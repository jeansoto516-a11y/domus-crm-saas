const pool = require('../config/db');
const { calculateScore, getTemperature } = require('../services/leadScoringService');

const validStatus = ['novo', 'contato', 'visita', 'proposta', 'fechado'];

function normalizeStatus(status) {
  return status?.toString().trim().toLowerCase();
}

function buildLeadScope(req, values) {
  let where = `WHERE company_id = $${values.length + 1}`;
  values.push(req.user.company_id);

  if (req.user.role !== 'admin') {
    where += ` AND user_id = $${values.length + 1}`;
    values.push(req.user.id);
  }

  return where;
}

function addDateFilters(where, values, query) {
  const { startDate, endDate, date } = query;

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

exports.createLead = async (req, res) => {
  const { name, email, phone } = req.body;
  const status = normalizeStatus(req.body.status) || 'novo';

  if (!name || (!email && !phone)) {
    return res.status(400).json({ error: 'Informe nome e pelo menos um contato do lead.' });
  }

  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: 'Status invalido.' });
  }

  try {
    const leadData = { name, email, phone, status };
    const score = calculateScore(leadData);
    const temperature = getTemperature(score);

    const result = await pool.query(
      `INSERT INTO leads (name, email, phone, status, score, temperature, user_id, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, email || null, phone || null, status, score, temperature, req.user.id, req.user.company_id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar lead:', err);
    return res.status(500).json({ error: 'Erro ao criar lead.' });
  }
};

exports.getLeads = async (req, res) => {
  const values = [];
  let where = buildLeadScope(req, values);

  const status = normalizeStatus(req.query.status);
  if (status) {
    if (!validStatus.includes(status)) {
      return res.status(400).json({ error: 'Status invalido.' });
    }

    where += ` AND status = $${values.length + 1}`;
    values.push(status);
  }

  where = addDateFilters(where, values, req.query);

  try {
    const result = await pool.query(
      `SELECT * FROM leads ${where} ORDER BY created_at DESC, id DESC`,
      values
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar leads:', err);
    return res.status(500).json({ error: 'Erro ao buscar leads.' });
  }
};

exports.updateLead = async (req, res) => {
  const { id } = req.params;
  const status = normalizeStatus(req.body.status);

  if (!status || !validStatus.includes(status)) {
    return res.status(400).json({ error: 'Status invalido.' });
  }

  const values = [];
  let where = buildLeadScope(req, values);
  values.push(id);

  try {
    const currentLead = await pool.query(
      `SELECT * FROM leads ${where} AND id = $${values.length}`,
      values
    );

    if (currentLead.rows.length === 0) {
      return res.status(404).json({ error: 'Lead nao encontrado.' });
    }

    const score = calculateScore({ ...currentLead.rows[0], status });
    const temperature = getTemperature(score);

    const result = await pool.query(
      `UPDATE leads
       SET status = $1, score = $2, temperature = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, score, temperature, id]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar lead:', err);
    return res.status(500).json({ error: 'Erro ao atualizar lead.' });
  }
};

exports.getDashboard = async (req, res) => {
  const values = [];
  let where = buildLeadScope(req, values);
  where = addDateFilters(where, values, req.query);

  try {
    const totalResult = await pool.query(`SELECT COUNT(*) FROM leads ${where}`, values);
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) FROM leads ${where} GROUP BY status`,
      values
    );

    const total = Number(totalResult.rows[0].count);
    const por_status = {
      novo: 0,
      contato: 0,
      visita: 0,
      proposta: 0,
      fechado: 0
    };

    statusResult.rows.forEach((row) => {
      por_status[row.status] = Number(row.count);
    });

    const conversao = total > 0 ? `${((por_status.fechado / total) * 100).toFixed(2)}%` : '0%';

    return res.json({ total, por_status, conversao });
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
    return res.status(500).json({ error: 'Erro ao carregar dashboard.' });
  }
};
