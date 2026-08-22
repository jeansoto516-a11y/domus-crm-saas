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

      CREATE TABLE IF NOT EXISTS lead_history (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        type TEXT DEFAULT 'nota',
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        sender_role TEXT NOT NULL,
        sender_user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_messages_company_id ON messages(company_id, created_at);

      
      CREATE TABLE IF NOT EXISTS goal_topics (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        metric_type TEXT NOT NULL DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        topic_id INTEGER REFERENCES goal_topics(id) ON DELETE CASCADE,
        month DATE NOT NULL,
        target_value NUMERIC NOT NULL DEFAULT 0,
        achieved_value NUMERIC NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, topic_id, month)
      );

      INSERT INTO goal_topics (company_id, name, metric_type)
      SELECT NULL, 'Leads captados', 'leads_captados'
      WHERE NOT EXISTS (SELECT 1 FROM goal_topics WHERE metric_type = 'leads_captados' AND company_id IS NULL);

      INSERT INTO goal_topics (company_id, name, metric_type)
      SELECT NULL, 'Visitas realizadas', 'visitas'
      WHERE NOT EXISTS (SELECT 1 FROM goal_topics WHERE metric_type = 'visitas' AND company_id IS NULL);

      INSERT INTO goal_topics (company_id, name, metric_type)
      SELECT NULL, 'Propostas enviadas', 'propostas'
      WHERE NOT EXISTS (SELECT 1 FROM goal_topics WHERE metric_type = 'propostas' AND company_id IS NULL);

      INSERT INTO goal_topics (company_id, name, metric_type)
      SELECT NULL, 'Vendas fechadas', 'vendas'
      WHERE NOT EXISTS (SELECT 1 FROM goal_topics WHERE metric_type = 'vendas' AND company_id IS NULL);

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
      ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_reminder_3d_sent BOOLEAN DEFAULT false;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_reminder_last_day_sent BOOLEAN DEFAULT false;

      CREATE INDEX IF NOT EXISTS idx_leads_company_created_at ON leads(company_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_leads_company_status ON leads(company_id, status);
      CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
      CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id);
    `);

    console.log('Tabelas criadas ou atualizadas com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar tabelas:', err);
    process.exit(1);
  }
}

createTables();