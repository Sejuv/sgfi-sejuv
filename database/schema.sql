-- ============================================================
-- SGFI - Sistema de Gestão Financeira Institucional
-- Schema PostgreSQL
-- Execute este script no pgAdmin para criar o banco de dados.
-- ============================================================

-- Criação do banco (execute separado se necessário):
-- CREATE DATABASE sgfi;

-- ============================================================
-- ENUM TYPES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role       AS ENUM ('admin', 'finance_manager', 'viewer');
  CREATE TYPE expense_type    AS ENUM ('fixed', 'variable');
  CREATE TYPE expense_status  AS ENUM ('paid', 'pending', 'overdue');
  CREATE TYPE contract_status AS ENUM ('active', 'pending', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABELA: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(50)  PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  email      VARCHAR(200) NOT NULL UNIQUE,
  password   TEXT         NOT NULL,
  role       user_role    NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: creditors
-- ============================================================
CREATE TABLE IF NOT EXISTS creditors (
  id              VARCHAR(50)  PRIMARY KEY,
  name            VARCHAR(300) NOT NULL,
  document_number VARCHAR(30),
  contact         VARCHAR(200),
  email           VARCHAR(200),
  cep             VARCHAR(10),
  street          VARCHAR(300),
  neighborhood    VARCHAR(200),
  city            VARCHAR(200),
  uf              CHAR(2),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         VARCHAR(50)  PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  type       expense_type NOT NULL,
  color      VARCHAR(50),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id          VARCHAR(50)     PRIMARY KEY,
  description VARCHAR(500)    NOT NULL,
  amount      NUMERIC(15, 2)  NOT NULL,
  type        expense_type    NOT NULL,
  due_date    DATE            NOT NULL,
  month       VARCHAR(20)     NOT NULL,
  status      expense_status  NOT NULL DEFAULT 'pending',
  creditor_id VARCHAR(50)     REFERENCES creditors(id) ON DELETE SET NULL,
  category_id VARCHAR(50)     REFERENCES categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  paid_at     TIMESTAMPTZ
);

-- ============================================================
-- TABELA: contracts
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id                  VARCHAR(50)      PRIMARY KEY,
  number              VARCHAR(50)      NOT NULL,
  description         VARCHAR(500)     NOT NULL,
  creditor_id         VARCHAR(50)      REFERENCES creditors(id) ON DELETE SET NULL,
  status              contract_status  NOT NULL DEFAULT 'pending',
  start_date          DATE             NOT NULL,
  end_date            DATE             NOT NULL,
  notes               TEXT,
  alert_new_contract  INT,   -- dias antes do fim para alerta de nova contratação
  alert_additive      INT,   -- dias antes do fim para alerta de aditivo
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: contract_items
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_items (
  id          VARCHAR(50)    PRIMARY KEY,
  contract_id VARCHAR(50)    NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  description VARCHAR(500)   NOT NULL,
  quantity    NUMERIC(12, 3) NOT NULL DEFAULT 1,
  unit        VARCHAR(20)    NOT NULL DEFAULT 'un',
  unit_price  NUMERIC(15, 2) NOT NULL DEFAULT 0,
  sort_order  INT            NOT NULL DEFAULT 0
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_expenses_status     ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date   ON expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_month      ON expenses(month);
CREATE INDEX IF NOT EXISTS idx_contracts_status    ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date  ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contract_items_cid  ON contract_items(contract_id);

-- ============================================================
-- DADOS INICIAIS: usuário administrador padrão
-- Senha: admin123 (hash bcrypt gerado pelo servidor na primeira inicialização)
-- ============================================================
INSERT INTO users (id, name, email, password, role)
VALUES (
  'user_admin',
  'Administrador',
  'admin@sgfi.local',
  '$2b$10$rOzJqA8xK2mN5pL1vQ3eOeZwYhT7uXcGbVfDiMsNkEaP9WqRlH0uO',
  'admin'
) ON CONFLICT (id) DO NOTHING;
