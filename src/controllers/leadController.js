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

/**
 * CRIAR LEAD
 */
exports.createLead = async (req, res) => {

  const {
    name,
    email,
    phone,
    status
  } = req.body;

  const normalizedStatus =
    status?.trim().toLowerCase();

  if (
    status &&
    !validStatus.includes(normalizedStatus)
  ) {

    return res.status(400).json({
      error: 'Status inválido'
    });
  }

  try {

    const leadData = {
      name,
      email,
      phone,
      status: normalizedStatus || 'novo'
    };

    // SCORE
    const score =
      calculateScore(leadData);

    // TEMPERATURA
    const temperature =
      getTemperature(score);

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

      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)

      RETURNING *
      `,
      [
        name,
        email,
        phone,
        leadData.status,
        score,
        temperature,
        req.user.id,
        req.user.company_id
      ]
    );

    return res.status(201).json(
      result.rows[0]
    );

  } catch (err) {

    console.error(
      'ERRO CREATE:',
      err
    );

    return res.status(500).json({
      error: 'Erro ao criar lead'
    });
  }
};

/**
 * LISTAR LEADS
 */
exports.getLeads = async (req, res) => {

  const {
    status,
    date
  } = req.query;

  try {

    let query;

    let values = [];

    let index = 1;

    if (req.user.role === 'admin') {

      query =
        'SELECT * FROM leads WHERE company_id = $1';

      values.push(
        req.user.company_id
      );

      index = 2;

    } else {

      query =
        'SELECT * FROM leads WHERE user_id = $1 AND company_id = $2';

      values.push(
        req.user.id,
        req.user.company_id
      );

      index = 3;
    }

    if (status) {

      const normalizedStatus =
        status.trim().toLowerCase();

      if (
        !validStatus.includes(
          normalizedStatus
        )
      ) {

        return res.status(400).json({
          error: 'Status inválido'
        });
      }

      query += ` AND status = $${index}`;

      values.push(normalizedStatus);

      index++;
    }

    if (date) {

      query += ` AND DATE(created_at) = $${index}`;

      values.push(date);

      index++;
    }

    const result =
      await pool.query(
        query,
        values
      );

    return res.json(result.rows);

  } catch (err) {

    console.error(
      'ERRO GET:',
      err
    );

    return res.status(500).json({
      error: 'Erro ao buscar leads'
    });
  }
};

/**
 * ATUALIZAR LEAD
 */
exports.updateLead = async (req, res) => {

  const { id } = req.params;

  const { status } = req.body;

  console.log("=================================");
  console.log("UPDATE LEAD");
  console.log("ID:", id);
  console.log("STATUS:", status);
  console.log("USER:", req.user);
  console.log("=================================");

  const normalizedStatus =
    status?.trim().toLowerCase();

  if (!normalizedStatus) {

    return res.status(400).json({
      error: 'Status é obrigatório'
    });
  }

  if (
    !validStatus.includes(
      normalizedStatus
    )
  ) {

    return res.status(400).json({
      error: 'Status inválido'
    });
  }

  try {

    // BUSCA LEAD
    const currentLead =
      await pool.query(
        `
        SELECT *
        FROM leads
        WHERE id = $1
        `,
        [id]
      );

    console.log(
      "LEAD ENCONTRADO:",
      currentLead.rows
    );

    if (
      currentLead.rows.length === 0
    ) {

      return res.status(404).json({
        error: 'Lead não encontrado'
      });
    }

    const currentData =
      currentLead.rows[0];

    // SCORE
    const score =
      calculateScore({
        ...currentData,
        status: normalizedStatus
      });

    // TEMPERATURA
    const temperature =
      getTemperature(score);

    console.log(
      "NOVO SCORE:",
      score
    );

    console.log(
      "NOVA TEMPERATURA:",
      temperature
    );

    // UPDATE
    const result =
      await pool.query(
        `
        UPDATE leads
        SET
          status = $1,
          score = $2,
          temperature = $3
        WHERE id = $4

        RETURNING *
        `,
        [
          normalizedStatus,
          score,
          temperature,
          id
        ]
      );

    console.log(
      "UPDATE OK:",
      result.rows[0]
    );

    return res.json(
      result.rows[0]
    );

  } catch (err) {

    console.error(
      "ERRO UPDATE COMPLETO:",
      err
    );

    return res.status(500).json({
      error: 'Erro ao atualizar lead',
      details: err.message
    });
  }
};

/**
 * DASHBOARD
 */
exports.getDashboard = async (req, res) => {

  console.log("=================================");
  console.log("CHEGOU NA DASHBOARD");
  console.log("USER:", req.user);
  console.log("QUERY:", req.query);
  console.log("=================================");

  try {

    const companyId =
      req.user.company_id;

    const {
      startDate,
      endDate
    } = req.query;

    let where =
      `WHERE company_id = $1`;

    let values = [companyId];

    let index = 2;

    // FILTRO POR DATA
    if (
      startDate &&
      endDate
    ) {

      where +=
        ` AND DATE(created_at) BETWEEN $${index} AND $${index + 1}`;

      values.push(
        startDate,
        endDate
      );

      index += 2;

    } else if (startDate) {

      where +=
        ` AND DATE(created_at) >= $${index}`;

      values.push(startDate);

      index++;

    } else if (endDate) {

      where +=
        ` AND DATE(created_at) <= $${index}`;

      values.push(endDate);

      index++;
    }

    console.log("WHERE:", where);
    console.log("VALUES:", values);

    // TOTAL
    const totalResult =
      await pool.query(
        `SELECT COUNT(*) FROM leads ${where}`,
        values
      );

    const total = Number(
      totalResult.rows[0].count
    );

    // STATUS
    const statsResult =
      await pool.query(
        `
        SELECT status, COUNT(*)
        FROM leads
        ${where}
        GROUP BY status
        `,
        values
      );

    const por_status = {
      novo: 0,
      contato: 0,
      visita: 0,
      proposta: 0,
      fechado: 0
    };

    statsResult.rows.forEach(
      (row) => {

        por_status[row.status] =
          Number(row.count);
      }
    );

    const fechados =
      por_status.fechado;

    const conversao =
      total > 0
        ? (
            (fechados / total) * 100
          ).toFixed(2) + '%'
        : '0%';

    console.log(
      "DASHBOARD OK"
    );

    return res.json({
      total,
      por_status,
      conversao
    });

  } catch (err) {

    console.error(
      'ERRO DASHBOARD:',
      err
    );

    return res.status(500).json({
      error:
        'Erro ao carregar dashboard'
    });
  }
};