require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const rateLimit  = require('express-rate-limit')

// Validação crítica na inicialização
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('[SECURITY] JWT_SECRET ausente ou muito curto. Defina ao menos 32 caracteres no .env')
  process.exit(1)
}

const app = express()

// ── Cabeçalhos de segurança HTTP ───────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// ── CORS restrito ──────────────────────────────────────────────
const rawOrigins = process.env.ALLOWED_ORIGINS || ''
const allowedOrigins = rawOrigins
  ? rawOrigins.split(',').map(o => o.trim())
  : []

app.use(cors({
  origin: (origin, cb) => {
    // Sem origin = chamadas server-side ou ferramentas de desenvolvimento
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Origem não permitida pelo CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}))

// ── Rate limit global (anti-DDoS básico) ───────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em breve.' },
}))

// ── Rate limit específico para login (anti-brute-force) ────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
})

app.use(express.json({ limit: '500kb' }))
app.use(express.urlencoded({ extended: true, limit: '500kb' }))

const requireAuth = require('./middleware/auth')

// ── Rotas ─────────────────────────────────────────────────────
app.use('/api/auth',          loginLimiter, require('./routes/auth'))

// Todas as rotas abaixo exigem token JWT válido
app.use('/api/creditors',     requireAuth, require('./routes/creditors'))
app.use('/api/expenses',      requireAuth, require('./routes/expenses'))
app.use('/api/categories',    requireAuth, require('./routes/categories'))
app.use('/api/contracts',     requireAuth, require('./routes/contracts'))
app.use('/api/catalog-items', requireAuth, require('./routes/catalog-items'))
app.use('/api/pncp-catalog',  requireAuth, require('./routes/pncp-catalog'))
app.use('/api/entities',      requireAuth, require('./routes/entities'))
app.use('/api/settings',      requireAuth, require('./routes/settings'))

// ── Health check (público) ────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok' })
)

// ── Handler de erros global ───────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ error: 'Erro interno do servidor' })
})

module.exports = app
