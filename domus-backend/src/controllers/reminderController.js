const pool = require('../config/db');

/**
 * Listar lembretes do usuario logado (pendentes primeiro, depois concluidos)
 */
exports.getReminders = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT id, note, due_date, done, lead_id, created_at
            FROM reminders
            WHERE user_id = $1
            ORDER BY done ASC, due_date ASC NULLS LAST, created_at DESC
            `,
            [req.user.id]
        );

        return res.json(result.rows);

    } catch (err) {
        console.error('Erro ao buscar lembretes:', err);
        return res.status(500).json({ error: 'Erro ao buscar lembretes.' });
    }
};

/**
 * Criar lembrete
 */
exports.createReminder = async (req, res) => {
    const { note, due_date, lead_id } = req.body;

    if (!note || !note.trim()) {
        return res.status(400).json({ error: 'Escreva o lembrete.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO reminders (user_id, company_id, lead_id, note, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.user.id, req.user.company_id, lead_id || null, note.trim(), due_date || null]
        );

        return res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao criar lembrete:', err);
        return res.status(500).json({ error: 'Erro ao criar lembrete.' });
    }
};

/**
 * Marcar lembrete como concluido/pendente
 */
exports.toggleReminder = async (req, res) => {
    const { id } = req.params;
    const { done } = req.body;

    try {
        const result = await pool.query(
            `UPDATE reminders SET done = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
            [done, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lembrete nao encontrado.' });
        }

        return res.json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao atualizar lembrete:', err);
        return res.status(500).json({ error: 'Erro ao atualizar lembrete.' });
    }
};

/**
 * Excluir lembrete
 */
exports.deleteReminder = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lembrete nao encontrado.' });
        }

        return res.json({ message: 'Lembrete excluido com sucesso.' });

    } catch (err) {
        console.error('Erro ao excluir lembrete:', err);
        return res.status(500).json({ error: 'Erro ao excluir lembrete.' });
    }
};