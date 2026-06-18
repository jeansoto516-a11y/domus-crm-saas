const { MercadoPagoConfig, Preference } = require('mercadopago');
const axios = require('axios');
const pool = require('../config/db');

function getMercadoPagoClient() {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    return null;
  }

  return new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
  });
}

exports.createPayment = async (req, res) => {
  const client = getMercadoPagoClient();

  if (!client) {
    return res.status(500).json({ error: 'Mercado Pago nao configurado.' });
  }

  try {
    const preference = new Preference(client);
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const apiUrl = process.env.API_URL || 'http://localhost:3000';

    const response = await preference.create({
      body: {
        items: [
          {
            title: 'Domus CRM - Assinatura Mensal',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 79.9
          }
        ],
        back_urls: {
          success: `${appUrl}/dashboard`,
          failure: `${appUrl}/dashboard`,
          pending: `${appUrl}/dashboard`
        },
        notification_url: `${apiUrl}/payments/webhook`,
        metadata: {
          company_id: req.user.company_id
        }
      }
    });

    return res.json({ init_point: response.init_point });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Erro ao criar pagamento.' });
  }
};

exports.webhook = async (req, res) => {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    return res.sendStatus(200);
  }

  try {
    const { type, data } = req.body;

    if (type !== 'payment' || !data?.id) {
      return res.sendStatus(200);
    }

    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${data.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
        }
      }
    );

    const payment = response.data;

    if (payment.status !== 'approved') {
      return res.sendStatus(200);
    }

    const companyId = payment.metadata?.company_id;

    if (!companyId) {
      return res.sendStatus(200);
    }

    await pool.query(
      `UPDATE companies
       SET subscription_status = 'active', payment_id = $2
       WHERE id = $1 AND (payment_id IS NULL OR payment_id <> $2)`,
      [companyId, String(data.id)]
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error.response?.data || error.message);
    return res.sendStatus(500);
  }
};
