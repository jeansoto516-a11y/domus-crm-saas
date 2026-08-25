const pool = require('../config/db');

/**
 * Listar topicos disponiveis (padrao do sistema + personalizados da imobiliaria)
 */
exports.getTopics = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT id, company_id, name, metric_type
            FROM goal_topics
            WHERE company_id IS NULL OR company_id = $1
            ORDER BY company_id NULLS FIRST, id
            `,
            [req.user.company_id]
        );

        return res.json(result.rows);

    } catch (err) {
        console.error('Erro ao buscar topicos:', err);
        return res.status(500).json({ error: 'Erro ao buscar topicos.' });
    }
};

/**
 * Criar topico personalizado (somente admin)
 */
exports.createTopic = async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Informe o nome do topico.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO goal_topics (company_id, name, metric_type) VALUES ($1, $2, 'manual') RETURNING *`,
            [req.user.company_id, name.trim()]
        );

        return res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao criar topico:', err);
        return res.status(500).json({ error: 'Erro ao criar topico.' });
    }
};

async function calculateAchieved(goal) {
    const { user_id, company_id, month, metric_type, achieved_value } = goal;

    if (metric_type === 'leads_captados') {
        const r = await pool.query(
            `SELECT COUNT(*) AS total FROM leads WHERE user_id = $1 AND company_id = $2 AND date_trunc('month', created_at) = date_trunc('month', $3::date)`,
            [user_id, company_id, month]
        );
        return Number(r.rows[0].total);
    }

        if (metric_type === 'visitas' || metric_type === 'propostas') {
        const statuses = metric_type === 'visitas'
            ? ['visita', 'proposta', 'fechado']
            : ['proposta', 'fechado'];

        const r = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM leads
            WHERE user_id = $1
                AND company_id = $2
                AND status = ANY($3::text[])
                AND date_trunc('month', updated_at) = date_trunc('month', $4::date)
            `,
            [user_id, company_id, statuses, month]
        );
        return Number(r.rows[0].total);
    }

    if (metric_type === 'vendas') {
        const r = await pool.query(
            `SELECT COUNT(*) AS total FROM leads WHERE user_id = $1 AND company_id = $2 AND status = 'fechado' AND date_trunc('month', updated_at) = date_trunc('month', $3::date)`,
            [user_id, company_id, month]
        );
        return Number(r.rows[0].total);
    }

    return Number(achieved_value) || 0;
}

/**
 * Listar metas (admin ve todas da imobiliaria, corretor ve so as proprias)
 */
exports.getGoals = async (req, res) => {
    const month = req.query.month || new Date().toISOString().slice(0, 8) + '01';

    try {
        const values = [req.user.company_id, month];
        let where = 'WHERE goals.company_id = $1 AND goals.month = $2';

        if (req.user.role !== 'admin') {
            values.push(req.user.id);
            where += ` AND goals.user_id = $${values.length}`;
        }

        const result = await pool.query(
            `
            SELECT
                goals.id,
                goals.user_id,
                goals.topic_id,
                goals.month,
                goals.target_value,
                goals.achieved_value,
                users.name AS corretor,
                goal_topics.name AS topico,
                goal_topics.metric_type
            FROM goals
            JOIN users ON users.id = goals.user_id
            JOIN goal_topics ON goal_topics.id = goals.topic_id
            ${where}
            ORDER BY users.name, goal_topics.name
            `,
            values
        );

        const goalsWithProgress = await Promise.all(
            result.rows.map(async (goal) => ({
                ...goal,
                achieved_value: await calculateAchieved({
                    user_id: goal.user_id,
                    company_id: req.user.company_id,
                    month: goal.month,
                    metric_type: goal.metric_type,
                    achieved_value: goal.achieved_value
                })
            }))
        );

        return res.json(goalsWithProgress);

    } catch (err) {
        console.error('Erro ao buscar metas:', err);
        return res.status(500).json({ error: 'Erro ao buscar metas.' });
    }
};

/**
 * Criar ou atualizar uma meta (somente admin)
 */
exports.setGoal = async (req, res) => {
    const { user_id, topic_id, month, target_value } = req.body;

    if (!user_id || !topic_id || !month || target_value === undefined) {
        return res.status(400).json({ error: 'Preencha corretor, topico, mes e meta.' });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO goals (company_id, user_id, topic_id, month, target_value)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, topic_id, month)
            DO UPDATE SET target_value = $5
            RETURNING *
            `,
            [req.user.company_id, user_id, topic_id, month, target_value]
        );

        return res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao salvar meta:', err);
        return res.status(500).json({ error: 'Erro ao salvar meta.' });
    }
};

/**
 * Atualizar progresso manual de uma meta (topicos personalizados)
 */
exports.updateProgress = async (req, res) => {
    const { id } = req.params;
    const { achieved_value } = req.body;

    if (achieved_value === undefined) {
        return res.status(400).json({ error: 'Informe o valor alcancado.' });
    }

    try {
        const goalCheck = await pool.query(
            `
            SELECT goals.*, goal_topics.metric_type
            FROM goals
            JOIN goal_topics ON goal_topics.id = goals.topic_id
            WHERE goals.id = $1 AND goals.company_id = $2
            `,
            [id, req.user.company_id]
        );

        if (goalCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Meta nao encontrada.' });
        }

        const goal = goalCheck.rows[0];

        if (req.user.role !== 'admin' && goal.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Voce so pode atualizar suas proprias metas.' });
        }

        if (goal.metric_type !== 'manual') {
            return res.status(400).json({ error: 'Esse topico e calculado automaticamente pelo sistema.' });
        }

        const result = await pool.query(
            `UPDATE goals SET achieved_value = $1 WHERE id = $2 RETURNING *`,
            [achieved_value, id]
        );

        return res.json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao atualizar progresso:', err);
        return res.status(500).json({ error: 'Erro ao atualizar progresso.' });
    }
};

/**
 * Excluir uma meta (somente admin)
 */
exports.deleteGoal = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM goals WHERE id = $1 AND company_id = $2 RETURNING id`,
            [id, req.user.company_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Meta nao encontrada.' });
        }

        return res.json({ message: 'Meta excluida com sucesso.' });

    } catch (err) {
        console.error('Erro ao excluir meta:', err);
        return res.status(500).json({ error: 'Erro ao excluir meta.' });
    }
};