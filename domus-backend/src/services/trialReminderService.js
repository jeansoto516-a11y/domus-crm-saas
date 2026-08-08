const pool = require('../config/db');
const { sendMail } = require('./mailService');

async function checkTrialReminders() {
    try {
        const appUrl = process.env.APP_URL || 'http://localhost:5173';

        // Trial acabando em 3 dias (aviso antecipado)
        const threeDaysResult = await pool.query(`
            SELECT id, name, email, trial_ends_at
            FROM companies
            WHERE subscription_status = 'trial'
                AND trial_reminder_3d_sent = false
                AND trial_ends_at <= NOW() + INTERVAL '3 days'
                AND trial_ends_at > NOW()
        `);

        for (const company of threeDaysResult.rows) {
            if (!company.email) continue;

            await sendMail({
                to: company.email,
                subject: 'Seu trial no Domus termina em 3 dias',
                html: `
                    <p>Ola, ${company.name}.</p>
                    <p>Seu periodo de teste gratuito no Domus termina em 3 dias.</p>
                    <p>Para continuar usando o sistema sem interrupcao, assine agora:</p>
                    <p><a href="${appUrl}/checkout">Assinar o Domus</a></p>
                `
            });

            await pool.query(
                `UPDATE companies SET trial_reminder_3d_sent = true WHERE id = $1`,
                [company.id]
            );

            console.log(`Aviso de 3 dias enviado para: ${company.email}`);
        }

        // Trial acabando hoje (ultimo dia)
        const lastDayResult = await pool.query(`
            SELECT id, name, email, trial_ends_at
            FROM companies
            WHERE subscription_status = 'trial'
                AND trial_reminder_last_day_sent = false
                AND trial_ends_at <= NOW() + INTERVAL '1 day'
                AND trial_ends_at > NOW()
        `);

        for (const company of lastDayResult.rows) {
            if (!company.email) continue;

            await sendMail({
                to: company.email,
                subject: 'Seu trial no Domus termina hoje',
                html: `
                    <p>Ola, ${company.name}.</p>
                    <p>Seu periodo de teste gratuito no Domus termina hoje.</p>
                    <p>Assine agora para nao perder o acesso ao sistema:</p>
                    <p><a href="${appUrl}/checkout">Assinar o Domus</a></p>
                `
            });

            await pool.query(
                `UPDATE companies SET trial_reminder_last_day_sent = true WHERE id = $1`,
                [company.id]
            );

            console.log(`Aviso de ultimo dia enviado para: ${company.email}`);
        }

        if (threeDaysResult.rows.length === 0 && lastDayResult.rows.length === 0) {
            console.log('Verificacao de trial: nenhum e-mail para enviar agora.');
        }

    } catch (err) {
        console.error('Erro ao verificar trials:', err);
    }
}

module.exports = { checkTrialReminders };