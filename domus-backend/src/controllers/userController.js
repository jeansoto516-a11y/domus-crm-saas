const bcrypt = require('bcrypt');
const pool = require('../config/db');

exports.createBroker = async (req, res) => {
    const { name, email, password } = req.body;

    if (req.user.role !== 'admin') {
    return res.status(403).json({
        error: 'Apenas administradores podem criar corretores.'
    });
    }

    if (!name || !email || !password) {
    return res.status(400).json({
        error: 'Preencha todos os campos.'
    });
    }

    try {
    const userExists = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
    );

    if (userExists.rows.length > 0) {
        return res.status(400).json({
        error: 'Email ja cadastrado.'
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users
        (name, email, password, role, company_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, role, company_id`,
        [
        name,
        email,
        hashedPassword,
        'user',
        req.user.company_id
        ]
    );

    return res.status(201).json({
        message: 'Corretor criado com sucesso.',
        user: result.rows[0]
    });

    } catch (err) {
    console.error(err);

    return res.status(500).json({
        error: 'Erro ao criar corretor.'
    });
    }
};