/**
 * SGFI — Aplicação Express (sem listen)
 * Exportado tanto para o servidor local quanto para Firebase Functions.
 */

require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const app = express()

// ── Middlewares ────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : '*'

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

// ── Rotas ──────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'))
app.use('/api/creditors',     require('./routes/creditors'))
app.use('/api/expenses',      require('./routes/expenses'))
app.use('/api/categories',    require('./routes/categories'))
app.use('/api/contracts',     require('./routes/contracts'))
app.use('/api/catalog-items', require('./routes/catalog-items'))
app.use('/api/pncp-catalog',  require('./routes/pncp-catalog'))
app.use('/api/entities',      require('./routes/entities'))
app.use('/api/settings',      require('./routes/settings'))

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date() })
)

module.exports = app
