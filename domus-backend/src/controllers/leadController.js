const pool = require('../config/db');

const validStatus = ['novo', 'contato', 'visita', 'proposta', 'fechado'];

// fluxo permitido de status (pipeline)
const statusFlow = {
  novo: ['contato'],
  contato: ['visita'],
  visita: ['proposta'],
  proposta: ['fechado'],
  fechado: []
};

// CRIAR LEAD
exports.createLead = async (req, res) => {
  const { name, email, phone, status } = req.body;

  // valida status
  if (status && !validStatus.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO leads (name, email, phone, status, user_id, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        name,
        email,
        phone,
        status || 'novo',
        req.user.id,
        req.user.company_id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
};

// LISTAR LEADS (MULTI-TENANT + FILTRO POR STATUS)
exports.getLeads = async (req, res) => {
  const { status } = req.query;

  console.log('STATUS:', status); 

  // valida status (se vier)
  if (status && !validStatus.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    let query = '';
    let values = [];

    // ADMIN → vê tudo da imobiliaria
    if (req.user.role === 'admin') {
      query = 'SELECT * FROM leads WHERE company_id = $1';
      values = [req.user.company_id];

      if (status) {
        query += ' AND status = $2';
        values.push(status);
      }

    } else {
      // CORRETOR → vê só os próprios leads
      query = 'SELECT * FROM leads WHERE user_id = $1 AND company_id = $2';
      values = [req.user.id, req.user.company_id];

      if (status) {
        query += ' AND status = $3';
        values.push(status);
      }
    }

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
};

// ATUALIZAR LEAD (COM CONTROLE DE PIPELINE)
exports.updateLead = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // valida se veio status
  if (!status) {
    return res.status(400).json({ error: 'Status é obrigatório' });
  }

  // valida status válido
  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    // busca o lead atual
    const currentLead = await pool.query(
      'SELECT status FROM leads WHERE id = $1 AND company_id = $2',
      [id, req.user.company_id]
    );

    if (currentLead.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const currentStatus = currentLead.rows[0].status;

    // verifica se pode avançar no pipeline
    const allowedNext = statusFlow[currentStatus];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        error: `Transição inválida: ${currentStatus} → ${status}`
      });
    }

    // faz update
    const result = await pool.query(
      'UPDATE leads SET status = $1 WHERE id = $2 AND company_id = $3 RETURNING *',
      [status, id, req.user.company_id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
};

// CONTAGEM DE LEADS POR STATUS (DASHBOARD)
exports.getLeadsStats = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT status, COUNT(*) 
      FROM leads
      WHERE company_id = $1
      GROUP BY status
      `,
      [req.user.company_id]
    );

    // estrutura padrão quantidade de leads por status
    const stats = {
      novo: 0,
      contato: 0,
      visita: 0,
      proposta: 0,
      fechado: 0
    };

    // preencher com dados do banco
    result.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
    });

    res.json(stats);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    // total de leads
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM leads WHERE company_id = $1',
      [companyId]
    );

    // contagem por status
    const statsResult = await pool.query(
      `
      SELECT status, COUNT(*) 
      FROM leads
      WHERE company_id = $1
      GROUP BY status
      `,
      [companyId]
    );

    const stats = {
      novo: 0,
      contato: 0,
      visita: 0,
      proposta: 0,
      fechado: 0
    };

    statsResult.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
    });

    res.json({
      leads: {
        total: parseInt(totalResult.rows[0].count),
        por_status: stats
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};

//DASHBOARD — (APENAS TOTAL)
exports.getDashboard = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    // TOTAL DE LEADS
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM leads WHERE company_id = $1',
      [companyId]
    );

    const total = Number(totalResult.rows[0].count);

    // CONTAGEM POR STATUS
    const statsResult = await pool.query(
      `
      SELECT status, COUNT(*) 
      FROM leads
      WHERE company_id = $1
      GROUP BY status
      `,
      [companyId]
    );

    const por_status = {
      novo: 0,
      contato: 0,
      visita: 0,
      proposta: 0,
      fechado: 0
    };

    statsResult.rows.forEach(row => {
      por_status[row.status] = Number(row.count);
    });

    // CONVERSÃO
    const fechados = por_status.fechado;

    const conversao = total > 0
      ? ((fechados / total) * 100).toFixed(2) + '%'
      : '0%';

    // RESPOSTA FINAL (PADRÃO CORRETO)
    return res.json({
      total,
      por_status,
      conversao
    });

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);

    return res.status(500).json({
      error: 'Erro ao carregar dashboard'
    });
  }
};