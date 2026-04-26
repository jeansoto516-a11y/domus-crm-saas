require('dotenv').config();
const pool = require('../config/db');

async function createTables() {
    try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        trial_ends_at TIMESTAMP,
        subscription_status TEXT DEFAULT 'trial',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        company_id INTEGER REFERENCES companies(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'novo',
        user_id INTEGER REFERENCES users(id),
        company_id INTEGER REFERENCES companies(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('Tabelas criadas com sucesso 🚀');
    process.exit();

    } catch (err) {
    console.error('Erro ao criar tabelas:', err);
    process.exit(1);
    }
}

createTables();