const pool = require('../config/db');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const round2 = (value) => Math.round(value * 100) / 100;

const toNumber = (value) => (
    value === undefined || value === null || value === '' ? null : Number(value)
);

exports.createSale = async (req, res) => {
    const saleValue = toNumber(req.body.sale_value);
    const commissionPercent = toNumber(req.body.commission_percent);
    const brokerPercent = toNumber(req.body.broker_percent) ?? 50;
    const saleDate = req.body.sale_date || new Date().toISOString().slice(0, 10);

    if (!Number.isFinite(saleValue) || saleValue <= 0) {
        return res.status(400).json({ error: 'Informe o valor da venda.' });
    }

    if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
        return res.status(400).json({ error: 'A comissao deve estar entre 0 e 100%.' });
    }

    if (!Number.isFinite(brokerPercent) || brokerPercent < 0 || brokerPercent > 100) {
        return res.status(400).json({ error: 'A parte do corretor deve estar entre 0 e 100%.' });
    }

    if (!DATE_RE.test(saleDate)) {
        return res.status(400).json({ error: 'Data da venda invalida.' });
    }

    const companyId = req.user.company_id;
    const isAdmin = req.user.role === 'admin';
    const leadId = toNumber(req.body.lead_id);
    const propertyId = toNumber(req.body.property_id);
    let brokerId = isAdmin ? toNumber(req.body.broker_id) : req.user.id;

    if (!isAdmin && !leadId) {
        return res.status(400).json({ error: 'Informe o lead da venda.' });
    }

    try {
        if (leadId) {
            const leadValues = [leadId, companyId];
            let leadQuery = `SELECT id, user_id FROM leads WHERE id = $1 AND company_id = $2`;

            if (!isAdmin) {
                leadQuery += ` AND user_id = $3`;
                leadValues.push(req.user.id);
            }

            const leadResult = await pool.query(leadQuery, leadValues);

            if (leadResult.rows.length === 0) {
                return res.status(404).json({ error: 'Lead nao encontrado.' });
            }

            const existing = await pool.query(`SELECT id FROM sales WHERE lead_id = $1`, [leadId]);

            if (existing.rows.length > 0) {
                return res.status(409).json({ error: 'Este lead ja tem uma venda registrada.' });
            }

            if (!brokerId) brokerId = leadResult.rows[0].user_id;
        }

        if (propertyId) {
            const propertyResult = await pool.query(
                `SELECT id FROM properties WHERE id = $1 AND company_id = $2`,
                [propertyId, companyId]
            );

            if (propertyResult.rows.length === 0) {
                return res.status(404).json({ error: 'Imovel nao encontrado.' });
            }
        }

        if (brokerId) {
            const brokerResult = await pool.query(
                `SELECT id FROM users WHERE id = $1 AND company_id = $2`,
                [brokerId, companyId]
            );

            if (brokerResult.rows.length === 0) {
                return res.status(400).json({ error: 'Corretor invalido.' });
            }
        }

        const commissionValue = round2(saleValue * commissionPercent / 100);
        const brokerCommissionValue = round2(commissionValue * brokerPercent / 100);
        const agencyCommissionValue = round2(commissionValue - brokerCommissionValue);

        const result = await pool.query(
            `
            INSERT INTO sales
            (company_id, lead_id, property_id, broker_id, created_by, description, sale_value,
             commission_percent, broker_percent, commission_value, broker_commission_value,
             agency_commission_value, sale_date, notes)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *
            `,
            [
                companyId, leadId || null, propertyId || null, brokerId || null, req.user.id,
                req.body.description || null, saleValue, commissionPercent, brokerPercent,
                commissionValue, brokerCommissionValue, agencyCommissionValue, saleDate,
                req.body.notes || null
            ]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao registrar venda:', err);
        return res.status(500).json({ error: 'Erro ao registrar venda.' });
    }
};

exports.getSales = async (req, res) => {
    const { startDate, endDate } = req.query;

    const values = [req.user.company_id];
    let where = `WHERE sales.company_id = $1`;

    if (startDate) {
        if (!DATE_RE.test(startDate)) return res.status(400).json({ error: 'Data inicial invalida.' });
        where += ` AND sales.sale_date >= $${values.length + 1}`;
        values.push(startDate);
    }

    if (endDate) {
        if (!DATE_RE.test(endDate)) return res.status(400).json({ error: 'Data final invalida.' });
        where += ` AND sales.sale_date <= $${values.length + 1}`;
        values.push(endDate);
    }

    try {
        const result = await pool.query(
            `
            SELECT
                sales.*,
                leads.name AS lead_name,
                users.name AS broker_name,
                properties.title AS property_title
            FROM sales
            LEFT JOIN leads ON leads.id = sales.lead_id
            LEFT JOIN users ON users.id = sales.broker_id
            LEFT JOIN properties ON properties.id = sales.property_id
            ${where}
            ORDER BY sales.sale_date DESC, sales.id DESC
            `,
            values
        );

        return res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar vendas:', err);
        return res.status(500).json({ error: 'Erro ao buscar vendas.' });
    }
};

exports.deleteSale = async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM sales WHERE id = $1 AND company_id = $2 RETURNING id`,
            [req.params.id, req.user.company_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Venda nao encontrada.' });
        }

        return res.json({ message: 'Venda excluida com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir venda:', err);
        return res.status(500).json({ error: 'Erro ao excluir venda.' });
    }
};