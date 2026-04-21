const pool = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM companies WHERE id = $1',
      [req.user.company_id]
    );

    const company = result.rows[0];

    // evita crash
    if (!company) {
      return res.status(404).json({
        error: 'Empresa não encontrada'
      });
    }

    const now = new Date();

    const trialValid =
      company.trial_ends_at &&
      new Date(company.trial_ends_at) > now;

    // ASSINATURA ATIVA
    if (company.subscription_status === 'active') {
      return next();
    }

    // TRIAL AINDA VÁLIDO
    if (trialValid) {
      return next();
    }

    // BLOQUEIO
    return res.status(403).json({
      error: 'Acesso bloqueado. Assinatura inativa ou trial expirado.'
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Erro ao verificar assinatura'
    });
  }
};