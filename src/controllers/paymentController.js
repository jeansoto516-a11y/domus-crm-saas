const { MercadoPagoConfig, Preference } = require('mercadopago');
const axios = require('axios');
const pool = require('../config/db');

// configuração
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

// criar pagamento
exports.createPayment = async (req, res) => {
    try {
    const preference = new Preference(client);

    const response = await preference.create({
        body: {
        items: [
            {
            title: 'Domus CRM - Assinatura Mensal',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 79.90
            }
        ],
        back_urls: {
            success: 'http://localhost:3000/success',
            failure: 'http://localhost:3000/failure',
            pending: 'http://localhost:3000/pending'
        },
        notification_url: 'https://altitude-stainable-paying.ngrok-free.dev/leads/webhook',

        metadata: {
            company_id: req.user.company_id
        }
        }
    });

    return res.json({
        init_point: response.init_point
    });

    } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar pagamento' });
    }
};

// webhook
exports.webhook = async (req, res) => {
    try {
    console.log('WEBHOOK CHEGOU');
    console.log('BODY:', req.body);

    // VALIDA ORIGEM (PASSO NOVO)
    const requestId = req.headers['x-request-id'];

    if (!requestId) {
        console.log('Requisição suspeita: sem x-request-id');
        return res.sendStatus(400);
    }

    const { type, data } = req.body;

    if (type === 'payment') {

        const paymentId = data?.id;

        if (!paymentId) {
        console.log('paymentId não encontrado');
        return res.sendStatus(200);
        }

      // busca pagamento no Mercado Pago
        const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
            headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
            }
        }
        );

        const payment = response.data;

        console.log('STATUS:', payment.status);

        if (payment.status === 'approved') {

        const companyId = payment.metadata?.company_id;

        if (!companyId) {
            console.log('company_id não encontrado no metadata');
            return res.sendStatus(200);
        }

        // VERIFICA DUPLICIDADE
        const existingCompany = await pool.query(
            'SELECT payment_id FROM companies WHERE id = $1',
            [companyId]
        );

        if (!existingCompany.rows.length) {
            console.log('Empresa não encontrada');
            return res.sendStatus(200);
        }

        if (existingCompany.rows[0].payment_id === paymentId) {
            console.log('Pagamento já processado');
            return res.sendStatus(200);
        }

        // ATIVA ASSINATURA + SALVA PAYMENT_ID
        await pool.query(
            `UPDATE companies 
            SET subscription_status = 'active',
                payment_id = $2
            WHERE id = $1`,
            [companyId, paymentId]
        );

        console.log('ASSINATURA ATIVADA');
        }
    }

    return res.sendStatus(200);

    } catch (error) {
    console.error(error.response?.data || error.message);
    return res.sendStatus(500);
    }
};