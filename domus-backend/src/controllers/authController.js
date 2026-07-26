const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const crypto = require('crypto');
const { sendMail } = require('../services/mailService');

exports.register = async (req, res) => {
  const { name, email, password, company_name } = req.body;
  const role = req.body.role === 'admin' ? 'admin' : 'user';

  if (!name || !email || !password || !company_name) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatorios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userExists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email ja cadastrado.' });
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const companyResult = await client.query(
      `INSERT INTO companies (name, trial_ends_at, subscription_status, email)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
      [company_name, trialEnd, 'trial', email]
    );

    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role, company_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, role, company_id, created_at`,
      [name, email, hashedPassword, role, companyResult.rows[0].id]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Usuario criado com sucesso.',
      user: userResult.rows[0],
      company: companyResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro no cadastro:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar usuario.' });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha sao obrigatorios.' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET nao configurado no servidor.' });
  }

  try {
    const result = await pool.query(
      `SELECT users.*, companies.name AS company_name, companies.subscription_status, companies.trial_ends_at
       FROM users
       LEFT JOIN companies ON companies.id = users.company_id
       WHERE users.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha invalidos.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou senha invalidos.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    delete user.password;

    return res.json({
      message: 'Login realizado com sucesso.',
      token,
      user
    });

    /**
 * Solicitar recuperacao de senha
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Informe o e-mail.' });
  }

  try {
    const userResult = await pool.query(
      `SELECT id, name FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        message: 'Se este e-mail existir em nossa base, um link de recuperacao foi enviado.'
      });
    }

    const user = userResult.rows[0];

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await pool.query(
      `UPDATE users SET reset_token_hash = $1, reset_token_expires = $2 WHERE id = $3`,
      [tokenHash, expires, user.id]
    );

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const resetLink = `${appUrl}/redefinir-senha?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await sendMail({
      to: email,
      subject: 'Recuperacao de senha - Domus',
      html: `
        <p>Ola, ${user.name}.</p>
        <p>Recebemos uma solicitacao para redefinir sua senha no Domus.</p>
        <p><a href="${resetLink}">Clique aqui para criar uma nova senha</a></p>
        <p>Este link expira em 1 hora. Se voce nao solicitou isso, ignore este e-mail.</p>
      `
    });

    return res.json({
      message: 'Se este e-mail existir em nossa base, um link de recuperacao foi enviado.'
    });

  } catch (error) {
    console.error('Erro ao solicitar recuperacao de senha:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitacao.' });
  }
};

/**
 * Redefinir senha usando o token recebido por e-mail
 */
exports.resetPassword = async (req, res) => {
  const { email, token, new_password } = req.body;

  if (!email || !token || !new_password) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const userResult = await pool.query(
      `SELECT id, reset_token_expires FROM users WHERE email = $1 AND reset_token_hash = $2`,
      [email, tokenHash]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Link invalido ou ja utilizado.' });
    }

    const user = userResult.rows[0];

    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ error: 'Link expirado. Solicite uma nova recuperacao de senha.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await pool.query(
      `UPDATE users SET password = $1, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = $2`,
      [hashedPassword, user.id]
    );

    return res.json({ message: 'Senha redefinida com sucesso.' });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
};

  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro no login.' });
  }
};
