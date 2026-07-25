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
        payment_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'novo',
        score INTEGER DEFAULT 0,
        temperature TEXT DEFAULT 'frio',
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'frio';
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS payment_id TEXT;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS payment_method TEXT;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS preapproval_id text;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS next_charge_date TIMESTAMP;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS payer_cpf TEXT;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS payer_name TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

      CREATE INDEX IF NOT EXISTS idx_leads_company_created_at ON leads(company_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_leads_company_status ON leads(company_id, status);
      CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
    `);

    console.log('Tabelas criadas ou atualizadas com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar tabelas:', err);
    process.exit(1);
  }
}

createTables();
