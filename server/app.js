require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const crypto    = require('crypto')
const helmet    = require('helmet')
const rateLimit = require('express-rate-limit')

// Se JWT_SECRET não estiver definido, gera um aleatório temporário
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex')
  console.warn('[SECURITY] JWT_SECRET não configurado. Configure nas variáveis do Railway.')
}

const app = express()

// ── Proxy reverso (Railway, Vercel, etc.) ─────────────────────
// Necessário para que express-rate-limit leia corretamente o IP
// real via X-Forwarded-For
app.set('trust proxy', 1)

// ── Cabeçalhos de segurança HTTP ──────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// ── CORS ──────────────────────────────────────────────────────
const rawOrigins    = process.env.ALLOWED_ORIGINS || ''
const allowedOrigins = rawOrigins ? rawOrigins.split(',').map(o => o.trim()) : []

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (allowedOrigins.length === 0) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Origem não permitida pelo CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}))

// ── Rate limiting ─────────────────────────────────────────────
// Limite geral: 200 req / 15 min por IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
})

// Limite de login: 10 tentativas / 15 min por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
})

app.use('/api/', generalLimiter)
app.use('/api/auth/login', loginLimiter)

app.use(express.json({ limit: '500kb' }))
app.use(express.urlencoded({ extended: true, limit: '500kb' }))

const requireAuth = require('./middleware/auth')

// ── Rotas ─────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'))

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
