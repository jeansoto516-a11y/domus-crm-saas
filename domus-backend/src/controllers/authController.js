const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

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
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro no login.' });
  }
};
