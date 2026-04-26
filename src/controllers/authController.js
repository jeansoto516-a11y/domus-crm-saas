const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// REGISTER (MULTI-TENANT)
exports.register = async (req, res) => {
  const { name, email, password, role, company_name } = req.body;

  try {
    if (!name || !email || !password || !company_name) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    // verifica se usuário já existe
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // cria trial de 14 dias
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    // cria empresa
    const companyResult = await pool.query(
      'INSERT INTO companies (name, trial_ends_at, subscription_status) VALUES ($1, $2, $3) RETURNING *',
      [company_name, trialEnd, 'trial']
    );

    const company = companyResult.rows[0];

    // criptografa senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // cria usuário
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, role || 'user', company.id]
    );

    const user = result.rows[0];
    delete user.password;

    return res.status(201).json({
      message: 'Usuário criado com sucesso',
      user,
      company
    });

  } catch (err) {
    console.error('ERRO NO REGISTER:', err);

    return res.status(500).json({
      error: 'Erro ao cadastrar usuário',
      details: err.message
    });
  }
};


// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('LOGIN:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    // proteção extra
    if (!user.password) {
      return res.status(500).json({ error: 'Senha não encontrada no banco' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Senha inválida' });
    }

    // valida JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET NÃO DEFINIDO');
      return res.status(500).json({ error: 'Erro interno de autenticação' });
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
      message: 'Login realizado com sucesso',
      token,
      user
    });

  } catch (err) {
    console.error('ERRO NO LOGIN:', err);

    return res.status(500).json({
      error: 'Erro no login',
      details: err.message
    });
  }
};