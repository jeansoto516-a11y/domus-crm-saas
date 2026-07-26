const axios = require('axios');

async function sendMail({ to, subject, html }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'onboarding@resend.dev';

    if (!apiKey) {
    console.error('RESEND_API_KEY nao configurada.');
    return false;
    }

    try {
    await axios.post(
        'https://api.resend.com/emails',
        {
        from: `Domus <${from}>`,
        to: [to],
        subject,
        html
        },
        {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
        }
    );

    return true;

    } catch (error) {
    console.error('Erro ao enviar e-mail:', error.response?.data || error.message);
    return false;
    }
}

module.exports = { sendMail };