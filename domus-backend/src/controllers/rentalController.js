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

        const referenceMonth = new Date();
        referenceMonth.setDate(1);
        const monthStr = referenceMonth.toISOString().slice(0, 10);

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
    const { month } = req.query;

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

        const referenceMonth = new Date();
        referenceMonth.setDate(1);
        const monthStr = referenceMonth.toISOString().slice(0, 10);

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