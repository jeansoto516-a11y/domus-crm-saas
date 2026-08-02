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