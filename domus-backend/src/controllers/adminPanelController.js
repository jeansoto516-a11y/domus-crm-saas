const pool = require('../config/db');

/**
 * Listar todas as imobiliarias cadastradas no sistema
 */
exports.listCompanies = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                companies.id,
                companies.name,
                companies.email,
                companies.subscription_status,
                companies.trial_ends_at,
                companies.payment_method,
                companies.created_at,
                (SELECT COUNT(*) FROM users WHERE users.company_id = companies.id) AS total_usuarios,
                (SELECT COUNT(*) FROM leads WHERE leads.company_id = companies.id) AS total_leads
            FROM companies
            ORDER BY companies.created_at DESC
        `);

        return res.json(result.rows);

    } catch (err) {
        console.error('Erro ao listar imobiliarias:', err);
        return res.status(500).json({ error: 'Erro ao listar imobiliarias.' });
    }
};

/**
 * Atualizar status da assinatura de uma imobiliaria manualmente
 * (ex: ativar, cancelar, ou estender o trial)
 */
exports.updateCompanyStatus = async (req, res) => {
    const { id } = req.params;
    const { subscription_status, trial_ends_at } = req.body;

    const allowedStatus = ['trial', 'active', 'canceled'];

    if (subscription_status && !allowedStatus.includes(subscription_status)) {
        return res.status(400).json({ error: 'Status invalido.' });
    }

    try {
        const fields = [];
        const values = [];

        if (subscription_status) {
            values.push(subscription_status);
            fields.push(`subscription_status = $${values.length}`);
        }

        if (trial_ends_at) {
            values.push(trial_ends_at);
            fields.push(`trial_ends_at = $${values.length}`);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Nada para atualizar.' });
        }

        values.push(id);

        await pool.query(
            `UPDATE companies SET ${fields.join(', ')} WHERE id = $${values.length}`,
            values
        );

        return res.json({ message: 'Imobiliaria atualizada com sucesso.' });

    } catch (err) {
        console.error('Erro ao atualizar imobiliaria:', err);
        return res.status(500).json({ error: 'Erro ao atualizar imobiliaria.' });
    }

};

    /**
 * Estatisticas gerais do sistema
 */
exports.getStats = async (req, res) => {
    try {
        const companiesResult = await pool.query(`
            SELECT subscription_status, COUNT(*) AS total
            FROM companies
            GROUP BY subscription_status
        `);

        const totalLeadsResult = await pool.query(`SELECT COUNT(*) AS total FROM leads`);
        const totalUsersResult = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE role != 'super_admin'`);

        const recentCompaniesResult = await pool.query(`
            SELECT id, name, subscription_status, created_at
            FROM companies
            ORDER BY created_at DESC
            LIMIT 5
        `);

        const stats = {
            por_status: {
                trial: 0,
                active: 0,
                canceled: 0
            },
            total_leads: Number(totalLeadsResult.rows[0].total),
            total_usuarios: Number(totalUsersResult.rows[0].total),
            recentes: recentCompaniesResult.rows
        };

        companiesResult.rows.forEach((item) => {
            stats.por_status[item.subscription_status] = Number(item.total);
        });

        stats.total_imobiliarias = stats.por_status.trial + stats.por_status.active + stats.por_status.canceled;
        stats.receita_estimada_mensal = (stats.por_status.active * 59.90).toFixed(2);

        return res.json(stats);

    } catch (err) {
        console.error('Erro ao buscar estatisticas:', err);
        return res.status(500).json({ error: 'Erro ao buscar estatisticas.' });
    }
};