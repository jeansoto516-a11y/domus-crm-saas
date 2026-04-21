const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// REGISTER (MULTI-TENANT)
exports.register = async (req, res) => {
  const { name, email, password, role, company_name } = req.body;

  try {
    
   // cria data de fim do trial (14 dias)
const trialEnd = new Date();
trialEnd.setDate(trialEnd.getDate() + 14);

// cria a empresa com trial de 14 dias
const companyResult = await pool.query(
  'INSERT INTO companies (name, trial_ends_at, subscription_status) VALUES ($1, $2, $3) RETURNING *',
  [company_name, trialEnd, 'trial']
);

    const company = companyResult.rows[0];

    // 2. criptografa senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. cria usuário vinculado à empresa
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, role, company.id]
    );

    const user = result.rows[0];
    delete user.password;

    res.status(201).json({
      user,
      company
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
};

// LOGIN (AGORA COM COMPANY_ID)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Senha inválida' });
    }

    //  agora inclui company_id no token
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

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login' });
  }
};