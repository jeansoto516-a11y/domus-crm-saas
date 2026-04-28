require('dotenv').config();
const pool = require('../config/db');

async function run() {
    try {
    await pool.query(`
        ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    console.log('Coluna created_at adicionada com sucesso!');
    process.exit();
    } catch (err) {
    console.error('Erro ao adicionar coluna:', err);
    process.exit(1);
    }
}

run();