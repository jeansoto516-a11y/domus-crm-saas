const axios = require('axios');
const pool = require('../config/db');

const PLAN_PRICE = 59.90;

function getAccessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN;
}

/**
 * Criar assinatura recorrente via cartao de credito
 * Espera receber "card_token_id" gerado no frontend
 */
exports.createCardSubscription = async (req, res) => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return res.status(500).json({ error: 'Mercado Pago nao configurado.' });
  }

  const { card_token_id } = req.body;

  if (!card_token_id) {
    return res.status(400).json({ error: 'card_token_id e obrigatorio.' });
  }

  try {
    const companyId = req.user.company_id;

    const companyResult = await pool.query(
      `SELECT email, trial_ends_at FROM companies WHERE id = $1`,
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Imobiliaria nao encontrada.' });
    }

    const company = companyResult.rows[0];
    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    const now = new Date();
    const trialEndsAt = company.trial_ends_at ? new Date(company.trial_ends_at) : now;
    const startDate = trialEndsAt > now ? trialEndsAt : now;

    const response = await axios.post(
      'https://api.mercadopago.com/preapproval',
      {
        reason: 'Domus CRM - Assinatura Mensal',
        external_reference: String(companyId),
        payer_email: company.email,
        card_token_id,
        back_url: `${appUrl}/dashboard`,
        status: 'authorized',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: PLAN_PRICE,
          currency_id: 'BRL',
          start_date: startDate.toISOString()
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const preapproval = response.data;

    await pool.query(
      `UPDATE companies
      SET preapproval_id = $2, payment_method = 'card', next_charge_date = $3
      WHERE id = $1`,
      [companyId, preapproval.id, startDate]
    );

    return res.json({
      message: 'Assinatura criada com sucesso.',
      preapproval_id: preapproval.id,
      status: preapproval.status
    });

  } catch (error) {
    console.error('Erro ao criar assinatura de cartao:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Erro ao criar assinatura de cartao.' });
  }
};

/**
 * Gerar cobranca Pix (pagamento unico, repetido todo ciclo)
 */
exports.createPixCharge = async (req, res) => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return res.status(500).json({ error: 'Mercado Pago nao configurado.' });
  }

  const { payer_name, payer_cpf } = req.body;

  try {
    const companyId = req.user.company_id;

    const companyResult = await pool.query(
      `SELECT email, payer_name, payer_cpf FROM companies WHERE id = $1`,
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Imobiliaria nao encontrada.' });
    }

    const company = companyResult.rows[0];

    const finalName = payer_name || company.payer_name;
    const finalCpf = payer_cpf || company.payer_cpf;

    if (!finalName || !finalCpf) {
      return res.status(400).json({ error: 'Informe nome completo e CPF para gerar o Pix.' });
    }

    const cpfDigits = finalCpf.replace(/\D/g, '');
    const nameParts = finalName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const response = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      {
        transaction_amount: PLAN_PRICE,
        description: 'Domus CRM - Assinatura Mensal',
        payment_method_id: 'pix',
        external_reference: String(companyId),
        payer: {
          email: company.email,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: 'CPF',
            number: cpfDigits
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const payment = response.data;
    const qr = payment.point_of_interaction?.transaction_data;

    await pool.query(
      `UPDATE companies
      SET payment_method = 'pix', payment_id = $2, payer_name = $3, payer_cpf = $4
      WHERE id = $1`,
      [companyId, String(payment.id), finalName, cpfDigits]
    );

    return res.json({
      payment_id: payment.id,
      qr_code: qr?.qr_code,
      qr_code_base64: qr?.qr_code_base64,
      status: payment.status
    });

  } catch (error) {
    console.error('Erro ao gerar cobranca Pix:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Erro ao gerar cobranca Pix.' });
  }
};
/**
 * pagamentos avulsos (Pix) e mudancas de assinatura (cartao)
 */
exports.webhook = async (req, res) => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return res.sendStatus(200);
  }

  try {
    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${data.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const payment = response.data;
      const companyId = payment.external_reference;

      if (payment.status === 'approved' && companyId) {
        const nextCharge = new Date();
        nextCharge.setDate(nextCharge.getDate() + 30);

        await pool.query(
          `UPDATE companies
          SET subscription_status = 'active', payment_id = $2, next_charge_date = $3
          WHERE id = $1`,
          [companyId, String(data.id), nextCharge]
        );
      }

      return res.sendStatus(200);
    }

    if (type === 'subscription_preapproval' && data?.id) {
      const response = await axios.get(
        `https://api.mercadopago.com/preapproval/${data.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const preapproval = response.data;
      const companyId = preapproval.external_reference;

      if (!companyId) {
        return res.sendStatus(200);
      }

      if (preapproval.status === 'authorized') {
        await pool.query(
          `UPDATE companies SET subscription_status = 'active' WHERE id = $1`,
          [companyId]
        );
      }

      if (preapproval.status === 'cancelled' || preapproval.status === 'paused') {
        await pool.query(
          `UPDATE companies SET subscription_status = 'canceled' WHERE id = $1`,
          [companyId]
        );
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error.response?.data || error.message);
    return res.sendStatus(500);
  }
};

/**
 * Retorna o status da assinatura
 */
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const result = await pool.query(
      `SELECT subscription_status, trial_ends_at FROM companies WHERE id = $1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imobiliaria nao encontrada.' });
    }

    const company = result.rows[0];
    let daysLeft = null;

    if (company.subscription_status === 'trial' && company.trial_ends_at) {
      const now = new Date();
      const trialEndsAt = new Date(company.trial_ends_at);
      const diffMs = trialEndsAt - now;
      daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    return res.json({
      subscription_status: company.subscription_status,
      trial_ends_at: company.trial_ends_at,
      days_left: daysLeft
    });

  } catch (error) {
    console.error('Erro ao buscar status da assinatura:', error);
    return res.status(500).json({ error: 'Erro ao buscar status da assinatura.' });
  }
};