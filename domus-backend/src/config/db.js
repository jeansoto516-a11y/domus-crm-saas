require('dotenv').config();

const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {

  console.error(
    '❌ DATABASE_URL não definida'
  );

  process.exit(1);
}

console.log('DATABASE OK');

const pool = new Pool({
  connectionString: databaseUrl,

  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => {
    console.log('Banco conectado 🚀');
  })
  .catch((err) => {
    console.error(
      'Erro ao conectar no banco:',
      err
    );
  });

module.exports = pool;