const pool = require('../config/db');

module.exports = async (req, res, next) => {

    try {

        const companyId = req.user.company_id;

        if (!companyId) {
            return res.status(403).json({
                error: 'Usuario sem imobiliaria vinculada.'
            });
        }

        const result = await pool.query(
            `SELECT subscription_status, trial_ends_at
             FROM companies
             WHERE id = $1`,
            [companyId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                error: 'Imobiliaria nao encontrada.'
            });
        }

        const company = result.rows[0];

        if (company.subscription_status === 'active') {
            return next();
        }

        if (company.subscription_status === 'trial') {

            const trialEndsAt = new Date(company.trial_ends_at);
            const now = new Date();

            if (now <= trialEndsAt) {
                return next();
            }

            return res.status(402).json({
                error: 'Seu periodo de teste gratuito acabou. Assine o plano para continuar usando o Domus.',
                subscription_status: 'trial_expired'
            });
        }

        return res.status(402).json({
            error: 'Sua assinatura nao esta ativa. Assine o plano para continuar usando o Domus.',
            subscription_status: company.subscription_status
        });

    } catch (error) {

        console.log(
            "Erro no checkSubscription:",
            error
        );

        return res.status(500).json({
            error: "Erro interno"
        });

    }

};