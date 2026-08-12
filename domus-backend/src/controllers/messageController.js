const pool = require('../config/db');

/**
 * Lado da imobiliaria: listar mensagens da propria empresa
 */
exports.getMyMessages = async (req, res) => {
    try {
        await pool.query(
            `UPDATE messages SET read_at = NOW() WHERE company_id = $1 AND sender_role = 'admin' AND read_at IS NULL`,
            [req.user.company_id]
        );

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
        await pool.query(
            `UPDATE messages SET read_at = NOW() WHERE company_id = $1 AND sender_role = 'company' AND read_at IS NULL`,
            [companyId]
        );

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

/**
 * Lado da imobiliaria: contar mensagens nao lidas do Domus
 */
exports.getMyUnreadCount = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) AS total FROM messages WHERE company_id = $1 AND sender_role = 'admin' AND read_at IS NULL`,
            [req.user.company_id]
        );

        return res.json({ unread: Number(result.rows[0].total) });

    } catch (err) {
        console.error('Erro ao contar mensagens:', err);
        return res.status(500).json({ error: 'Erro ao contar mensagens.' });
    }
};

/**
 * Lado do super admin: contar mensagens nao lidas por imobiliaria
 */
exports.getUnreadCountsBySuperAdmin = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT company_id, COUNT(*) AS total
            FROM messages
            WHERE sender_role = 'company' AND read_at IS NULL
            GROUP BY company_id
            `
        );

        const counts = {};
        result.rows.forEach((row) => {
            counts[row.company_id] = Number(row.total);
        });

        return res.json(counts);

    } catch (err) {
        console.error('Erro ao contar mensagens:', err);
        return res.status(500).json({ error: 'Erro ao contar mensagens.' });
    }
};