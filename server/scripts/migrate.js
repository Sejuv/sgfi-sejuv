require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS entities (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      document_number VARCHAR(20),
      address TEXT,
      phone VARCHAR(30),
      email VARCHAR(100),
      website VARCHAR(255),
      logo_url TEXT,
      brasao_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✅ Tabela entities criada')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✅ Tabela app_settings criada')

  // Adicionar colunas de ALTER nas rotas de usuários caso necessário
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
  `)
  console.log('✅ Coluna is_active adicionada em users')

  await pool.end()
  console.log('\n✅ Migração concluída!')
}

migrate().catch(e => { console.error('Erro:', e.message); pool.end() })
