const pool = require('../config/db');

/**
 * Listar imoveis alugados
 * Admin ve todos da imobiliaria, corretor ve so os proprios
 */
exports.getProperties = async (req, res) => {
    try {
        let query = `
            SELECT
                rental_properties.*,
                users.name AS corretor
            FROM rental_properties
            LEFT JOIN users ON users.id = rental_properties.broker_id
            WHERE rental_properties.company_id = $1
        `;
        const values = [req.user.company_id];

        if (req.user.role !== 'admin') {
            query += ` AND rental_properties.broker_id = $2`;
            values.push(req.user.id);
        }

        query += ` ORDER BY rental_properties.created_at DESC`;

        const result = await pool.query(query, values);

        return res.json(result.rows);

    } catch (err) {
        console.error('Erro ao buscar imoveis:', err);
        return res.status(500).json({ error: 'Erro ao buscar imoveis.' });
    }
};

/**
 * Cadastrar imovel alugado
 */
exports.createProperty = async (req, res) => {
    const {
        address,
        tenant_name,
        tenant_contact,
        owner_name,
        owner_contact,
        rent_value,
        due_day,
        contract_start,
        contract_end
    } = req.body;

    if (!address || !rent_value) {
        return res.status(400).json({ error: 'Informe pelo menos o endereco e o valor do aluguel.' });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO rental_properties
            (company_id, broker_id, address, tenant_name, tenant_contact, owner_name, owner_contact, rent_value, due_day, contract_start, contract_end)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
            `,
            [
                req.user.company_id,
                req.user.id,
                address,
                tenant_name || null,
                tenant_contact || null,
                owner_name || null,
                owner_contact || null,
                rent_value,
                due_day || 10,
                contract_start || null,
                contract_end || null
            ]
        );

        return res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao cadastrar imovel:', err);
        return res.status(500).json({ error: 'Erro ao cadastrar imovel.' });
    }
};

/**
 * Atualizar imovel (inclui as % de administracao e comissao - somente admin)
 */
/**
 * Ranking de corretores por alugueis administrados
 */
exports.getRentalRanking = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                users.id,
                users.name,
                COUNT(rental_properties.id) FILTER (WHERE rental_properties.status = 'ativo') AS imoveis_ativos,
                COUNT(rental_properties.id) AS total_imoveis,
                COALESCE(SUM(rental_payments.broker_commission_value) FILTER (
                    WHERE date_trunc('month', rental_payments.reference_month) = date_trunc('month', NOW())
                ), 0) AS comissao_mes
            FROM users
            LEFT JOIN rental_properties ON rental_properties.broker_id = users.id AND rental_properties.company_id = users.company_id
            LEFT JOIN rental_payments ON rental_payments.property_id = rental_properties.id
            WHERE users.company_id = $1 AND users.role = 'user'
            GROUP BY users.id, users.name
            ORDER BY imoveis_ativos DESC, comissao_mes DESC
            `,
            [req.user.company_id]
        );

        const ranking = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            imoveis_ativos: Number(row.imoveis_ativos),
            total_imoveis: Number(row.total_imoveis),
            comissao_mes: Number(row.comissao_mes)
        }));

        return res.json(ranking);

    } catch (err) {
        console.error('Erro ao buscar ranking de alugueis:', err);
        return res.status(500).json({ error: 'Erro ao buscar ranking de alugueis.' });
    }
};

/**
 * Exportar imoveis alugados em CSV
 */
exports.exportRentals = async (req, res) => {
    try {
        let query = `
            SELECT
                rental_properties.*,
                users.name AS corretor
            FROM rental_properties
            LEFT JOIN users ON users.id = rental_properties.broker_id
            WHERE rental_properties.company_id = $1
        `;
        const values = [req.user.company_id];

        if (req.user.role !== 'admin') {
            query += ` AND rental_properties.broker_id = $2`;
            values.push(req.user.id);
        }

        query += ` ORDER BY rental_properties.created_at DESC`;

        const result = await pool.query(query, values);

        const headers = [
            'ID',
            'Endereco',
            'Inquilino',
            'Contato inquilino',
            'Proprietario',
            'Contato proprietario',
            'Corretor',
            'Valor aluguel',
            'Dia vencimento',
            'Inicio contrato',
            'Fim contrato',
            'Adm %',
            'Comissao %',
            'Status',
            'Cadastrado em'
        ];

        function escapeCsv(value) {
            if (value === null || value === undefined) {
                return '';
            }

            const text = String(value);

            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                return `"${text.replace(/"/g, '""')}"`;
            }

            return text;
        }

        const rows = result.rows.map((property) => [
            property.id,
            property.address,
            property.tenant_name || '',
            property.tenant_contact || '',
            property.owner_name || '',
            property.owner_contact || '',
            property.corretor || '',
            property.rent_value,
            property.due_day,
            property.contract_start ? new Date(property.contract_start).toLocaleDateString('pt-BR') : '',
            property.contract_end ? new Date(property.contract_end).toLocaleDateString('pt-BR') : '',
            property.admin_fee_percent,
            property.broker_commission_percent,
            property.status,
            new Date(property.created_at).toLocaleString('pt-BR')
        ].map(escapeCsv).join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        const csvWithBom = '\uFEFF' + csv;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="alugueis-domus.csv"');

        return res.send(csvWithBom);

    } catch (err) {
        console.error('Erro ao exportar alugueis:', err);
        return res.status(500).json({ error: 'Erro ao exportar alugueis.' });
    }
};

/**
 * Reajustar o valor do aluguel (somente admin, a qualquer momento)
 */
exports.adjustRent = async (req, res) => {
    const { id } = req.params;
    const { new_value } = req.body;

    const newValue = Number(new_value);

    if (!newValue || newValue <= 0) {
        return res.status(400).json({ error: 'Informe um novo valor de aluguel valido.' });
    }

    try {
        const propertyResult = await pool.query(
            `SELECT id, rent_value FROM rental_properties WHERE id = $1 AND company_id = $2`,
            [id, req.user.company_id]
        );

        if (propertyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Imovel nao encontrado.' });
        }

        const oldValue = Number(propertyResult.rows[0].rent_value);

        await pool.query(
            `
            INSERT INTO rental_adjustments (property_id, old_value, new_value, adjusted_by)
            VALUES ($1, $2, $3, $4)
            `,
            [id, oldValue, newValue, req.user.id]
        );

        const updateResult = await pool.query(
            `UPDATE rental_properties SET rent_value = $1 WHERE id = $2 RETURNING *`,
            [newValue, id]
        );

        return res.json({
            message: 'Reajuste aplicado com sucesso.',
            property: updateResult.rows[0]
        });

    } catch (err) {
        console.error('Erro ao reajustar aluguel:', err);
        return res.status(500).json({ error: 'Erro ao reajustar aluguel.' });
    }
};

/**
 * Historico de reajustes de um imovel
 */
exports.getAdjustments = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
            SELECT rental_adjustments.*, users.name AS adjusted_by_name
            FROM rental_adjustments
            JOIN rental_properties ON rental_properties.id = rental_adjustments.property_id
            LEFT JOIN users ON users.id = rental_adjustments.adjusted_by
            WHERE rental_adjustments.property_id = $1 AND rental_properties.company_id = $2
            ORDER BY rental_adjustments.adjusted_at DESC
            `,
            [id, req.user.company_id]
        );

        return res.json(result.rows);

    } catch (err) {
        console.error('Erro ao buscar reajustes:', err);
        return res.status(500).json({ error: 'Erro ao buscar reajustes.' });
    }
};

exports.updateProperty = async (req, res) => {
    const { id } = req.params;
    const {
        address,
        tenant_name,
        tenant_contact,
        owner_name,
        owner_contact,
        rent_value,
        due_day,
        contract_start,
        contract_end,
        admin_fee_percent,
        broker_commission_percent,
        status
    } = req.body;

    try {
        const result = await pool.query(
            `
            UPDATE rental_properties
            SET
                address = COALESCE($1, address),
                tenant_name = $2,
                tenant_contact = $3,
                owner_name = $4,
                owner_contact = $5,
                rent_value = COALESCE($6, rent_value),
                due_day = COALESCE($7, due_day),
                contract_start = $8,
                contract_end = $9,
                admin_fee_percent = COALESCE($10, admin_fee_percent),
                broker_commission_percent = COALESCE($11, broker_commission_percent),
                status = COALESCE($12, status)
            WHERE id = $13 AND company_id = $14
            RETURNING *
            `,
            [
                address, tenant_name, tenant_contact, owner_name, owner_contact,
                rent_value, due_day, contract_start, contract_end,
                admin_fee_percent, broker_commission_percent, status,
                id, req.user.company_id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Imovel nao encontrado.' });
        }

        return res.json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao atualizar imovel:', err);
        return res.status(500).json({ error: 'Erro ao atualizar imovel.' });
    }
};

/**
 * Excluir imovel
 */
exports.deleteProperty = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM rental_properties WHERE id = $1 AND company_id = $2 RETURNING id`,
            [id, req.user.company_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Imovel nao encontrado.' });
        }

        return res.json({ message: 'Imovel excluido com sucesso.' });

    } catch (err) {
        console.error('Erro ao excluir imovel:', err);
        return res.status(500).json({ error: 'Erro ao excluir imovel.' });
    }
};

/**
 * Gerar os registros do mes atual para todos os imoveis ativos
 * (nao gera cobranca de verdade, so cria a "linha" para controle manual)
 */
exports.generateMonthlyPayments = async (req, res) => {
    try {
        const propertiesResult = await pool.query(
            `SELECT * FROM rental_properties WHERE company_id = $1 AND status = 'ativo'`,
            [req.user.company_id]
        );

        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        let created = 0;
        let skipped = 0;

        for (const property of propertiesResult.rows) {

            const rentValue = Number(property.rent_value);
            const adminFeePercent = Number(property.admin_fee_percent);
            const brokerCommissionPercent = Number(property.broker_commission_percent);

            const adminFeeValue = rentValue * (adminFeePercent / 100);
            const brokerCommissionValue = adminFeeValue * (brokerCommissionPercent / 100);

            const result = await pool.query(
                `
                INSERT INTO rental_payments
                (property_id, reference_month, rent_value, admin_fee_percent, admin_fee_value, broker_commission_percent, broker_commission_value)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (property_id, reference_month) DO NOTHING
                RETURNING id
                `,
                [property.id, monthStr, rentValue, adminFeePercent, adminFeeValue, brokerCommissionPercent, brokerCommissionValue]
            );

            if (result.rows.length > 0) {
                created += 1;
            } else {
                skipped += 1;
            }

        }

        return res.json({
            message: `${created} registro(s) gerado(s) para este mes. ${skipped} ja existiam.`,
            created,
            skipped
        });

    } catch (err) {
        console.error('Erro ao gerar pagamentos mensais:', err);
        return res.status(500).json({ error: 'Erro ao gerar pagamentos mensais.' });
    }
};

/**
 * Listar pagamentos mensais (com filtro opcional de mes)
 */
exports.getPayments = async (req, res) => {
    const { month, property_id } = req.query;

    try {
        let query = `
            SELECT
                rental_payments.*,
                rental_properties.address,
                rental_properties.broker_id,
                users.name AS corretor
            FROM rental_payments
            JOIN rental_properties ON rental_properties.id = rental_payments.property_id
            LEFT JOIN users ON users.id = rental_properties.broker_id
            WHERE rental_properties.company_id = $1
        `;
        const values = [req.user.company_id];

        if (req.user.role !== 'admin') {
            query += ` AND rental_properties.broker_id = $${values.length + 1}`;
            values.push(req.user.id);
        }

        if (month) {
            query += ` AND rental_payments.reference_month = $${values.length + 1}`;
            values.push(month);
        }

        if (property_id) {
            query += ` AND rental_payments.property_id = $${values.length + 1}`;
            values.push(property_id);
        }

        query += ` ORDER BY rental_payments.reference_month DESC, rental_properties.address ASC`;

        const result = await pool.query(query, values);

        return res.json(result.rows);

    } catch (err) {
        console.error('Erro ao buscar pagamentos:', err);
        return res.status(500).json({ error: 'Erro ao buscar pagamentos.' });
    }
};

/**
 * Marcar pagamento como pago/atrasado (somente admin)
 */
exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pendente', 'pago', 'atrasado'].includes(status)) {
        return res.status(400).json({ error: 'Status invalido.' });
    }

    try {
        const paidAt = status === 'pago' ? new Date() : null;

        const result = await pool.query(
            `
            UPDATE rental_payments
            SET status = $1, paid_at = $2
            WHERE id = $3
            AND property_id IN (SELECT id FROM rental_properties WHERE company_id = $4)
            RETURNING *
            `,
            [status, paidAt, id, req.user.company_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro nao encontrado.' });
        }

        return res.json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao atualizar status do pagamento:', err);
        return res.status(500).json({ error: 'Erro ao atualizar status do pagamento.' });
    }
};


/**
 * Dashboard do modulo de alugueis
 */
exports.getDashboard = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';

        const scopeFilter = isAdmin ? '' : ' AND rental_properties.broker_id = $2';
        const scopeValues = isAdmin ? [req.user.company_id] : [req.user.company_id, req.user.id];

        const propertiesResult = await pool.query(
            `
            SELECT
                COUNT(*) AS total_imoveis,
                COUNT(*) FILTER (WHERE status = 'ativo') AS imoveis_ativos,
                COALESCE(SUM(rent_value) FILTER (WHERE status = 'ativo'), 0) AS soma_alugueis
            FROM rental_properties
            WHERE company_id = $1
            ${isAdmin ? '' : 'AND broker_id = $2'}
            `,
            scopeValues
        );

        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const paymentsResult = await pool.query(
            `
            SELECT
                rental_payments.status,
                COUNT(*) AS total,
                COALESCE(SUM(rental_payments.admin_fee_value), 0) AS soma_administracao,
                COALESCE(SUM(rental_payments.broker_commission_value), 0) AS soma_comissao
            FROM rental_payments
            JOIN rental_properties ON rental_properties.id = rental_payments.property_id
            WHERE rental_properties.company_id = $1
            AND rental_payments.reference_month = $${isAdmin ? 2 : 3}
            ${scopeFilter}
            GROUP BY rental_payments.status
            `,
            isAdmin ? [req.user.company_id, monthStr] : [req.user.company_id, req.user.id, monthStr]
        );

        const dashboard = {
            total_imoveis: Number(propertiesResult.rows[0].total_imoveis),
            imoveis_ativos: Number(propertiesResult.rows[0].imoveis_ativos),
            soma_alugueis: Number(propertiesResult.rows[0].soma_alugueis),
            mes_atual: {
                pendente: 0,
                pago: 0,
                atrasado: 0,
                receita_administracao_mes: 0,
                total_comissao_corretores_mes: 0
            }
        };

        paymentsResult.rows.forEach((row) => {
            dashboard.mes_atual[row.status] = Number(row.total);
            dashboard.mes_atual.receita_administracao_mes += Number(row.soma_administracao);
            dashboard.mes_atual.total_comissao_corretores_mes += Number(row.soma_comissao);
        });

        return res.json(dashboard);

    } catch (err) {
        console.error('Erro ao buscar dashboard de alugueis:', err);
        return res.status(500).json({ error: 'Erro ao buscar dashboard de alugueis.' });
    }
};


const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Criar contrato de aluguel a partir do fechamento de um lead de aluguel
 */
exports.createContractFromLead = async (req, res) => {
    const companyId = req.user.company_id;
    const isAdmin = req.user.role === 'admin';

    const toNumber = (value) => (
        value === undefined || value === null || value === '' ? null : Number(value)
    );

    const leadId = toNumber(req.body.lead_id);
    const catalogPropertyId = toNumber(req.body.property_id);
    const rentValue = toNumber(req.body.rent_value);
    const dueDay = toNumber(req.body.due_day) ?? 10;
    const contractStart = req.body.contract_start;
    const contractEnd = req.body.contract_end;
    const guaranteeType = req.body.guarantee_type || 'nenhuma';
    const adminFeePercent = isAdmin ? toNumber(req.body.admin_fee_percent) : null;
    const brokerCommissionPercent = isAdmin ? toNumber(req.body.broker_commission_percent) : null;
    let depositValue = toNumber(req.body.deposit_value);
    let address = (req.body.address || '').toString().trim();

    if (!leadId) {
        return res.status(400).json({ error: 'Informe o lead do aluguel.' });
    }

    if (!Number.isFinite(rentValue) || rentValue <= 0) {
        return res.status(400).json({ error: 'Informe o valor do aluguel.' });
    }

    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
        return res.status(400).json({ error: 'O dia de vencimento deve estar entre 1 e 31.' });
    }

    if (!DATE_RE.test(contractStart || '') || !DATE_RE.test(contractEnd || '')) {
        return res.status(400).json({ error: 'Informe o inicio e o fim do contrato.' });
    }

    if (contractEnd < contractStart) {
        return res.status(400).json({ error: 'O fim do contrato deve ser depois do inicio.' });
    }

    if (!['fiador', 'caucao', 'nenhuma'].includes(guaranteeType)) {
        return res.status(400).json({ error: 'Garantia invalida.' });
    }

    if (guaranteeType === 'caucao') {
        if (!Number.isFinite(depositValue) || depositValue <= 0) {
            return res.status(400).json({ error: 'Informe o valor da caucao.' });
        }
    } else {
        depositValue = null;
    }

    if (adminFeePercent !== null && (!Number.isFinite(adminFeePercent) || adminFeePercent < 0 || adminFeePercent > 100)) {
        return res.status(400).json({ error: 'A taxa de administracao deve estar entre 0 e 100%.' });
    }

    if (brokerCommissionPercent !== null && (!Number.isFinite(brokerCommissionPercent) || brokerCommissionPercent < 0 || brokerCommissionPercent > 100)) {
        return res.status(400).json({ error: 'A comissao do corretor deve estar entre 0 e 100%.' });
    }

    try {
        const leadValues = [leadId, companyId];
        let leadQuery = `SELECT id, name, email, phone, user_id, lead_type FROM leads WHERE id = $1 AND company_id = $2`;

        if (!isAdmin) {
            leadQuery += ` AND user_id = $3`;
            leadValues.push(req.user.id);
        }

        const leadResult = await pool.query(leadQuery, leadValues);

        if (leadResult.rows.length === 0) {
            return res.status(404).json({ error: 'Lead nao encontrado.' });
        }

        const lead = leadResult.rows[0];

        if (lead.lead_type !== 'aluguel') {
            return res.status(400).json({ error: 'Este lead nao e de aluguel.' });
        }

        const existing = await pool.query(`SELECT id FROM rental_properties WHERE lead_id = $1`, [leadId]);

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Este lead ja tem um contrato de aluguel.' });
        }

        let ownerName = null;
        let ownerContact = null;

        if (catalogPropertyId) {
            const propertyResult = await pool.query(
                `SELECT id, title, region, city, owner_name, owner_contact FROM properties WHERE id = $1 AND company_id = $2`,
                [catalogPropertyId, companyId]
            );

            if (propertyResult.rows.length === 0) {
                return res.status(404).json({ error: 'Imovel nao encontrado.' });
            }

            const property = propertyResult.rows[0];

            ownerName = property.owner_name || null;
            ownerContact = property.owner_contact || null;

            if (!address) {
                address = [property.title, property.region, property.city].filter(Boolean).join(' - ');
            }
        }

        if (!address) {
            return res.status(400).json({ error: 'Informe o imovel ou o endereco.' });
        }

        const result = await pool.query(
            `
            INSERT INTO rental_properties
            (company_id, broker_id, address, tenant_name, tenant_contact, owner_name, owner_contact,
             rent_value, due_day, contract_start, contract_end, admin_fee_percent, broker_commission_percent,
             lead_id, guarantee_type, deposit_value)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, 8), COALESCE($13, 50), $14, $15, $16)
            RETURNING *
            `,
            [
                companyId,
                lead.user_id,
                address,
                lead.name,
                lead.phone || lead.email || null,
                ownerName,
                ownerContact,
                rentValue,
                dueDay,
                contractStart,
                contractEnd,
                adminFeePercent,
                brokerCommissionPercent,
                leadId,
                guaranteeType,
                depositValue
            ]
        );

        return res.status(201).json(result.rows[0]);

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Este lead ja tem um contrato de aluguel.' });
        }

        console.error('Erro ao criar contrato a partir do lead:', err);
        return res.status(500).json({ error: 'Erro ao criar contrato de aluguel.' });
    }
};