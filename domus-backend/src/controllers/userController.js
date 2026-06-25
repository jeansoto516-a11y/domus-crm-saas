const bcrypt = require('bcrypt');
const pool = require('../config/db');

/**
 * Listar corretores da empresa
 */
exports.getBrokers = async (req, res) => {
    try {
    const result = await pool.query(
        `
        SELECT
        id,
        name,
        email,
        role,
        company_id,
        created_at
        FROM users
        WHERE company_id = $1
        ORDER BY created_at DESC
        `,
        [req.user.company_id]
    );

    return res.json(result.rows);

    } catch (err) {
    console.error('Erro ao buscar corretores:', err);

    return res.status(500).json({
        error: 'Erro ao buscar corretores.'
    });
    }
};

/**
 * Criar corretor
 */
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
        `
        INSERT INTO users
        (
        name,
        email,
        password,
        role,
        company_id
        )
        VALUES
        (
        $1,
        $2,
        $3,
        $4,
        $5
        )
        RETURNING
        id,
        name,
        email,
        role,
        company_id
        `,
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
    console.error('Erro ao criar corretor:', err);

    return res.status(500).json({
        error: 'Erro ao criar corretor.'
    });
    }
};

/**
 * Excluir corretor
 */
exports.deleteBroker = async (req, res) => {
    const { id } = req.params;

    // Apenas administrador
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Apenas administradores podem excluir corretores.'
        });
    }

    // Não permitir excluir a si mesmo
    if (Number(id) === req.user.id) {
        return res.status(400).json({
            error: 'Você não pode excluir seu próprio usuário.'
        });
    }

    try {

        const result = await pool.query(
            `
            DELETE FROM users
            WHERE id = $1
            AND company_id = $2
            RETURNING id
            `,
            [id, req.user.company_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Corretor não encontrado.'
            });
        }

        return res.json({
            message: 'Corretor excluído com sucesso.'
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Erro ao excluir corretor.'
        });

    }
};