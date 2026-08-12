const pool = require('../config/db');

/**
 * Lado da imobiliaria: listar mensagens da propria empresa
 */
exports.getMyMessages = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                messages.id,
                messages.sender_role,
                messages.content,
                messages.created_at,
                users.name AS autor
            FROM messages
            LEFT JOIN users ON users.id = messages.sender_user_id
            WHERE messages.company_id = $1
            ORDER BY messages.created_at ASC
            `,
            [req.user.company_id]
        );

        return res.json(result.rows);

    } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
        return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    }
};

/**
 * Lado da imobiliaria: enviar mensagem para o Domus
 */
exports.sendMyMessage = async (req, res) => {
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Escreva uma mensagem.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO messages (company_id, sender_role, sender_user_id, content) VALUES ($1, 'company', $2, $3) RETURNING *`,
            [req.user.company_id, req.user.id, content.trim()]
        );

        return res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    }
};

/**
 * Lado do super admin: listar mensagens de uma imobiliaria especifica
 */
exports.getCompanyMessages = async (req, res) => {
    const { companyId } = req.params;

    try {
        const result = await pool.query(
            `
            SELECT
                messages.id,
                messages.sender_role,
                messages.content,
                messages.created_at,
                users.name AS autor
            FROM messages
            LEFT JOIN users ON users.id = messages.sender_user_id
            WHERE messages.company_id = $1
            ORDER BY messages.created_at ASC
            `,
            [companyId]
        );

        return res.json(result.rows);

    } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
        return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    }
};

/**
 * Lado do super admin: enviar mensagem para uma imobiliaria especifica
 */
exports.sendCompanyMessage = async (req, res) => {
    const { companyId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Escreva uma mensagem.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO messages (company_id, sender_role, sender_user_id, content) VALUES ($1, 'admin', $2, $3) RETURNING *`,
            [companyId, req.user.id, content.trim()]
        );

        return res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    }
};