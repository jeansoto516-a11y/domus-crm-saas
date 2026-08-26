const pool = require('../config/db');
const {
    calculateScore,
    getTemperature
} = require('../services/leadScoringService');

const validStatus = [
    'novo',
    'contato',
    'visita',
    'proposta',
    'fechado'
];

function normalizeStatus(status) {
    return status?.toString().trim().toLowerCase();
}

function buildLeadScope(req, values) {

    let where = `WHERE leads.company_id = $${values.length + 1}`;

    values.push(req.user.company_id);

    if (req.user.role !== 'admin') {

        where += ` AND leads.user_id = $${values.length + 1}`;

        values.push(req.user.id);

    }

    return where;

}
function addDateFilters(where, values, query) {

    const {
        startDate,
        endDate,
        date
    } = query;

    if (date) {

        where += ` AND DATE(created_at) = $${values.length + 1}`;

        values.push(date);

    }

    if (startDate) {

        where += ` AND DATE(created_at) >= $${values.length + 1}`;

        values.push(startDate);

    }

    if (endDate) {

        where += ` AND DATE(created_at) <= $${values.length + 1}`;

        values.push(endDate);

    }

    return where;

}

/**
 * Criar Lead
 */
exports.createLead = async (req, res) => {

    const {
        name,
        email,
        phone
    } = req.body;

    const status = normalizeStatus(req.body.status) || 'novo';

    if (!name || (!email && !phone)) {

        return res.status(400).json({
            error: 'Informe nome e pelo menos um contato.'
        });

    }

    if (!validStatus.includes(status)) {

        return res.status(400).json({
            error: 'Status inválido.'
        });

    }

    try {

        let assignedUserId = req.user.id;

        if (req.user.role === 'admin') {

            const brokerResult = await pool.query(
                `
                SELECT
                    users.id,
                    COUNT(leads.id) FILTER (WHERE leads.status != 'fechado') AS leads_ativos
                FROM users
                LEFT JOIN leads ON leads.user_id = users.id AND leads.company_id = users.company_id
                WHERE users.company_id = $1 AND users.role = 'user'
                GROUP BY users.id
                ORDER BY leads_ativos ASC
                LIMIT 1
                `,
                [req.user.company_id]
            );

            if (brokerResult.rows.length > 0) {
                assignedUserId = brokerResult.rows[0].id;
            }

        }

        const leadData = {
            name,
            email,
            phone,
            status
        };

        const score = calculateScore(leadData);

        const temperature = getTemperature(score);

        const result = await pool.query(
                        `
            INSERT INTO leads
            (
                name,
                email,
                phone,
                status,
                score,
                temperature,
                user_id,
                company_id
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8
            )
            RETURNING *
            `,
                        [
                name,
                email || null,
                phone || null,
                status,
                score,
                temperature,
                assignedUserId,
                req.user.company_id
            ]
        );

        await pool.query(
            `INSERT INTO lead_history (lead_id, user_id, type, content) VALUES ($1, $2, 'status', 'Lead cadastrado no sistema')`,
            [result.rows[0].id, req.user.id]
        );

        return res.status(201).json(result.rows[0]);

    } catch (err) {

        console.error('Erro ao criar lead:', err);

        return res.status(500).json({
            error: 'Erro ao criar lead.'
        });

    }

};

/**
 * Listar Leads
 */
exports.getLeads = async (req, res) => {

    const values = [];
    let where = buildLeadScope(req, values);

    const status = normalizeStatus(req.query.status);

    if (status) {

        if (!validStatus.includes(status)) {
            return res.status(400).json({
                error: 'Status invalido.'
            });
        }

        where += ` AND status = $${values.length + 1}`;
        values.push(status);

    }

    where = addDateFilters(where, values, req.query);

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM leads
            ${where}
            ORDER BY created_at DESC, id DESC
            `,
            values
        );

        return res.json(result.rows);

    } catch (err) {

        console.error('Erro ao buscar leads:', err);

        return res.status(500).json({
            error: 'Erro ao buscar leads.'
        });

    }

};


/**
 * Atualizar Status do Lead
 */
exports.updateLead = async (req, res) => {

    const { id } = req.params;

    const status = normalizeStatus(req.body.status);

    if (!status || !validStatus.includes(status)) {

        return res.status(400).json({
            error: 'Status invalido.'
        });

    }

    const values = [];

    let where = buildLeadScope(req, values);

    values.push(id);

    try {

        const currentLead = await pool.query(
            `
            SELECT *
            FROM leads
            ${where}
            AND id = $${values.length}
            `,
            values
        );

        if (currentLead.rows.length === 0) {

            return res.status(404).json({
                error: 'Lead nao encontrado.'
            });

        }

        const score = calculateScore({
            ...currentLead.rows[0],
            status
        });

        const temperature = getTemperature(score);

        const result = await pool.query(
            `
            UPDATE leads
            SET
                status = $1,
                score = $2,
                temperature = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
            `,
            [
                status,
                score,
                temperature,
                id
            ]
        );

        await pool.query(
            `INSERT INTO lead_history (lead_id, user_id, type, content) VALUES ($1, $2, 'status', $3)`,
            [id, req.user.id, `Status alterado para: ${status}`]
        );

        return res.json(result.rows[0]);

    } catch (err) {

        console.error('Erro ao atualizar lead:', err);

        return res.status(500).json({
            error: 'Erro ao atualizar lead.'
        });

    }

};

/**
 * Dashboard
 */
exports.getDashboard = async (req, res) => {

    const values = [];

    let where = buildLeadScope(req, values);

    where = addDateFilters(where, values, req.query);

    try {

        // Total de leads
        const totalResult = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM leads
            ${where}
            `,
            values
        );

        // Quantidade por status
        const statusResult = await pool.query(
            `
            SELECT
                status,
                COUNT(*) AS total
            FROM leads
            ${where}
            GROUP BY status
            `,
            values
        );

        // Quantidade por temperatura
        const temperatureResult = await pool.query(
            `
            SELECT
                temperature,
                COUNT(*) AS total
            FROM leads
            ${where}
            GROUP BY temperature
            `,
            values
        );

        const dashboard = {
            total: Number(totalResult.rows[0].total),

            por_status: {
                novo: 0,
                contato: 0,
                visita: 0,
                proposta: 0,
                fechado: 0
            },

            por_temperatura: {
                frio: 0,
                morna: 0,
                quente: 0
            }
        };

            statusResult.rows.forEach((item) => {
            dashboard.por_status[item.status] = Number(item.total);
});

            temperatureResult.rows.forEach((item) => {
            dashboard.por_temperatura[item.temperature] = Number(item.total);
});

        const totalLeads = dashboard.total;

            dashboard.conversao =
            totalLeads > 0
            ? (
            (dashboard.por_status.fechado / totalLeads) * 100
        ).toFixed(2) + '%'
        : '0%';

        return res.json(dashboard);

    } catch (err) {

        console.error('Erro ao carregar dashboard:', err);

        return res.status(500).json({
            error: 'Erro ao carregar dashboard.'
        });

    }

};

/**
 *  EXCLUIR LEAD
 */

exports.deleteLead = async (req, res) => {
    const { id } = req.params;
    const values = [];
    let where = buildLeadScope(req, values);
    values.push(id);
    
    try {

        const result = await pool.query(
            `
            DELETE FROM leads
            ${where}
            AND id = $${values.length}
            RETURNING id
            `,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Lead não encontrado."
            });
        }

        return res.json({
            message: "Lead excluido com sucesso."
        });

    } catch (err){
        console.error("Erro ao excluir lead:", err);
        return res.status(500).json({
            error: "Erro ao excluir lead"
        });
    }
};

/**
 * Exportar leads em CSV
 */
exports.exportLeads = async (req, res) => {

    const values = [];
    let where = buildLeadScope(req, values);

    where = addDateFilters(where, values, req.query);

    try {

        const result = await pool.query(
            `
            SELECT
                leads.id,
                leads.name,
                leads.email,
                leads.phone,
                leads.status,
                leads.score,
                leads.temperature,
                leads.created_at,
                users.name AS corretor
            FROM leads
            LEFT JOIN users ON users.id = leads.user_id
            ${where}
            ORDER BY leads.created_at DESC, leads.id DESC
            `,
            values
        );

        const headers = [
            'ID',
            'Nome',
            'Email',
            'Telefone',
            'Status',
            'Score',
            'Temperatura',
            'Corretor',
            'Cadastrado em'
        ];

        function escapeCsv(value) {
            if (value === null || value === undefined) {
                return '';
            }

            const text = String(value);

            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                return `"${text.replace(/"/g, '""')}"`;
            }

            return text;
        }

        const rows = result.rows.map((lead) => [
            lead.id,
            lead.name,
            lead.email,
            lead.phone,
            lead.status,
            lead.score,
            lead.temperature,
            lead.corretor || '',
            new Date(lead.created_at).toLocaleString('pt-BR')
        ].map(escapeCsv).join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        const csvWithBom = '\uFEFF' + csv;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="leads-domus.csv"');

        return res.send(csvWithBom);

    } catch (err) {

        console.error('Erro ao exportar leads:', err);

        return res.status(500).json({
            error: 'Erro ao exportar leads.'
        });

    }

};

/**
 * Listar historico de um lead
 */
exports.getLeadHistory = async (req, res) => {

    const { id } = req.params;
    const values = [];
    let where = buildLeadScope(req, values);
    values.push(id);

    try {

        const leadCheck = await pool.query(
            `SELECT id FROM leads ${where} AND id = $${values.length}`,
            values
        );

        if (leadCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Lead nao encontrado.'
            });
        }

        const result = await pool.query(
            `
            SELECT
                lead_history.id,
                lead_history.type,
                lead_history.content,
                lead_history.created_at,
                users.name AS autor
            FROM lead_history
            LEFT JOIN users ON users.id = lead_history.user_id
            WHERE lead_history.lead_id = $1
            ORDER BY lead_history.created_at DESC
            `,
            [id]
        );

        return res.json(result.rows);

    } catch (err) {

        console.error('Erro ao buscar historico do lead:', err);

        return res.status(500).json({
            error: 'Erro ao buscar historico do lead.'
        });

    }

};

/**
 * Adicionar anotacao manual no lead
 */
exports.addLeadNote = async (req, res) => {

    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({
            error: 'Escreva algo para adicionar a anotacao.'
        });
    }

    const values = [];
    let where = buildLeadScope(req, values);
    values.push(id);

    try {

        const leadCheck = await pool.query(
            `SELECT id FROM leads ${where} AND id = $${values.length}`,
            values
        );

        if (leadCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Lead nao encontrado.'
            });
        }

        const result = await pool.query(
            `INSERT INTO lead_history (lead_id, user_id, type, content) VALUES ($1, $2, 'nota', $3) RETURNING *`,
            [id, req.user.id, content.trim()]
        );

        return res.status(201).json(result.rows[0]);

    } catch (err) {

        console.error('Erro ao adicionar anotacao:', err);

        return res.status(500).json({
            error: 'Erro ao adicionar anotacao.'
        });

    }

};

/**
 * Ranking de corretores (fechamentos no mes atual)
 */
exports.getBrokerRanking = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                users.id,
                users.name,
                COUNT(*) FILTER (WHERE leads.status = 'fechado' AND date_trunc('month', leads.updated_at) = date_trunc('month', NOW())) AS fechados_mes,
                COUNT(*) AS total_leads
            FROM users
            LEFT JOIN leads ON leads.user_id = users.id AND leads.company_id = users.company_id
            WHERE users.company_id = $1 AND users.role = 'user'
            GROUP BY users.id, users.name
            ORDER BY fechados_mes DESC, total_leads DESC
            `,
            [req.user.company_id]
        );

        const ranking = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            fechados_mes: Number(row.fechados_mes),
            total_leads: Number(row.total_leads)
        }));

        return res.json(ranking);

    } catch (err) {

        console.error('Erro ao buscar ranking:', err);

        return res.status(500).json({
            error: 'Erro ao buscar ranking.'
        });

    }

};

/**
 * Rota publica: buscar dados basicos da imobiliaria pelo slug (para exibir no formulario)
 */
exports.getPublicCompany = async (req, res) => {
    const { slug } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, name FROM companies WHERE public_slug = $1`,
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Formulario nao encontrado.' });
        }

        return res.json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao buscar imobiliaria publica:', err);
        return res.status(500).json({ error: 'Erro ao buscar imobiliaria.' });
    }
};

/**
 * Rota publica: criar lead vindo do formulario embutivel
 */
exports.createPublicLead = async (req, res) => {
    const { slug } = req.params;
    const { name, email, phone } = req.body;

    if (!name || (!email && !phone)) {
        return res.status(400).json({
            error: 'Informe nome e pelo menos um contato.'
        });
    }

    try {

        const companyResult = await pool.query(
            `SELECT id FROM companies WHERE public_slug = $1`,
            [slug]
        );

        if (companyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Formulario nao encontrado.' });
        }

        const companyId = companyResult.rows[0].id;

        const leadData = { name, email, phone, status: 'novo' };
        const score = calculateScore(leadData);
        const temperature = getTemperature(score);

        let assignedUserId = null;

        const brokerResult = await pool.query(
            `
            SELECT
                users.id,
                COUNT(leads.id) FILTER (WHERE leads.status != 'fechado') AS leads_ativos
            FROM users
            LEFT JOIN leads ON leads.user_id = users.id AND leads.company_id = users.company_id
            WHERE users.company_id = $1 AND users.role = 'user'
            GROUP BY users.id
            ORDER BY leads_ativos ASC
            LIMIT 1
            `,
            [companyId]
        );

        if (brokerResult.rows.length > 0) {
            assignedUserId = brokerResult.rows[0].id;
        } else {
            const adminResult = await pool.query(
                `SELECT id FROM users WHERE company_id = $1 AND role = 'admin' LIMIT 1`,
                [companyId]
            );
            assignedUserId = adminResult.rows[0]?.id || null;
        }

        const result = await pool.query(
            `
            INSERT INTO leads (name, email, phone, status, score, temperature, user_id, company_id)
            VALUES ($1, $2, $3, 'novo', $4, $5, $6, $7)
            RETURNING id
            `,
            [name, email || null, phone || null, score, temperature, assignedUserId, companyId]
        );

        await pool.query(
            `INSERT INTO lead_history (lead_id, user_id, type, content) VALUES ($1, $2, 'status', 'Lead cadastrado via formulario publico')`,
            [result.rows[0].id, assignedUserId]
        );

        return res.status(201).json({ message: 'Recebemos seus dados! Em breve entraremos em contato.' });

    } catch (err) {

        console.error('Erro ao criar lead publico:', err);

        return res.status(500).json({
            error: 'Erro ao enviar formulario.'
        });

    }

};