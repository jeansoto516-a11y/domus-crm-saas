const pool = require('../config/db');
const { getMetaSpend } = require('../services/metaSpendService');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TARGETS = ['geral', 'venda', 'aluguel'];

const round2 = (value) => Math.round(value * 100) / 100;

function currentMonthRange() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    return {
        start: `${now.getFullYear()}-${month}-01`,
        end: `${now.getFullYear()}-${month}-${String(now.getDate()).padStart(2, '0')}`
    };
}

function readRange(query) {
    const fallback = currentMonthRange();
    const start = query.startDate || fallback.start;
    const end = query.endDate || fallback.end;

    if (!DATE_RE.test(start) || !DATE_RE.test(end)) return null;

    return { start, end };
}

exports.getInvestments = async (req, res) => {
    const range = readRange(req.query);

    if (!range) {
        return res.status(400).json({ error: 'Datas invalidas.' });
    }

    try {
        const result = await pool.query(
            `
            SELECT id, channel, description, amount, target, invest_date, created_at
            FROM ad_investments
            WHERE company_id = $1 AND invest_date BETWEEN $2 AND $3
            ORDER BY invest_date DESC, id DESC
            `,
            [req.user.company_id, range.start, range.end]
        );

        return res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar investimentos:', err);
        return res.status(500).json({ error: 'Erro ao buscar investimentos.' });
    }
};

exports.createInvestment = async (req, res) => {
    const channel = String(req.body.channel || '').trim();
    const amount = Number(req.body.amount);
    const target = TARGETS.includes(req.body.target) ? req.body.target : 'geral';
    const investDate = req.body.invest_date || new Date().toISOString().slice(0, 10);

    if (!channel) {
        return res.status(400).json({ error: 'Informe o canal do investimento.' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Informe um valor valido.' });
    }

    if (!DATE_RE.test(investDate)) {
        return res.status(400).json({ error: 'Data invalida.' });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO ad_investments (company_id, created_by, channel, description, amount, target, invest_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [req.user.company_id, req.user.id, channel, req.body.description || null, amount, target, investDate]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao registrar investimento:', err);
        return res.status(500).json({ error: 'Erro ao registrar investimento.' });
    }
};

exports.deleteInvestment = async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM ad_investments WHERE id = $1 AND company_id = $2 RETURNING id`,
            [req.params.id, req.user.company_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Investimento nao encontrado.' });
        }

        return res.json({ message: 'Investimento excluido com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir investimento:', err);
        return res.status(500).json({ error: 'Erro ao excluir investimento.' });
    }
};

exports.getSummary = async (req, res) => {
    const range = readRange(req.query);

    if (!range) {
        return res.status(400).json({ error: 'Datas invalidas.' });
    }

    try {
        const result = await pool.query(
            `
            SELECT channel, target, COALESCE(SUM(amount), 0) AS total
            FROM ad_investments
            WHERE company_id = $1 AND invest_date BETWEEN $2 AND $3
            GROUP BY channel, target
            `,
            [req.user.company_id, range.start, range.end]
        );

        const manual = { total: 0, by_target: { geral: 0, venda: 0, aluguel: 0 } };
        const byChannel = {};

        result.rows.forEach((row) => {
            const value = Number(row.total);

            manual.total += value;
            manual.by_target[row.target] = (manual.by_target[row.target] || 0) + value;
            byChannel[row.channel] = (byChannel[row.channel] || 0) + value;
        });

        manual.total = round2(manual.total);
        Object.keys(manual.by_target).forEach((key) => {
            manual.by_target[key] = round2(manual.by_target[key]);
        });

        manual.by_channel = Object.entries(byChannel)
            .map(([channel, total]) => ({ channel, total: round2(total) }))
            .sort((a, b) => b.total - a.total);

        const meta = await getMetaSpend(req.user.company_id, range.start, range.end);

        return res.json({
            period: range,
            manual,
            meta,
            total: round2(manual.total + meta.total)
        });
    } catch (err) {
        console.error('Erro ao montar resumo de investimentos:', err);
        return res.status(500).json({ error: 'Erro ao montar resumo de investimentos.' });
    }
};