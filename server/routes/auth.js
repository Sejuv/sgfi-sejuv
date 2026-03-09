const router      = require('express').Router()
const bcrypt      = require('bcrypt')
const jwt         = require('jsonwebtoken')
const db          = require('../db')
const requireAuth = require('../middleware/auth')

const users = () => db.collection('users')

const safeUser = (doc) => {
  const { password: _, ...data } = doc.data()
  return { id: doc.id, ...data }
}

function issueToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
}

// POST /api/auth/login — emite JWT na resposta
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' })
  try {
    const snap = await users().where('email', '==', email).limit(1).get()
    if (snap.empty) return res.status(401).json({ error: 'Credenciais inválidas' })
    const doc   = snap.docs[0]
    const valid = await bcrypt.compare(password, doc.data().password)
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' })
    const user  = safeUser(doc)
    res.json({ user, token: issueToken(user) })
  } catch { res.status(500).json({ error: 'Erro interno do servidor' }) }
})

// POST /api/auth/register — requer autenticação (somente admins podem criar usuários)
router.post('/register', requireAuth, async (req, res) => {
  const { name, email, password, role = 'viewer' } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios faltando' })
  try {
    const existing = await users().where('email', '==', email).limit(1).get()
    if (!existing.empty) return res.status(409).json({ error: 'Email já cadastrado' })
    const hash = await bcrypt.hash(password, 10)
    const id   = `user_${Date.now()}`
    const data = { name, email, password: hash, role, created_at: new Date().toISOString() }
    await users().doc(id).set(data)
    const { password: _, ...safeData } = data
    res.status(201).json({ user: { id, ...safeData } })
  } catch { res.status(500).json({ error: 'Erro interno do servidor' }) }
})

// GET /api/auth/users — requer autenticação
router.get('/users', requireAuth, async (_req, res) => {
  try {
    const snap = await users().orderBy('name').get()
    res.json(snap.docs.map(safeUser))
  } catch { res.status(500).json({ error: 'Erro interno do servidor' }) }
})

// PUT /api/auth/users/:id — requer autenticação
router.put('/users/:id', requireAuth, async (req, res) => {
  const { name, email, password, role } = req.body
  try {
    const ref  = users().doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'Usuário não encontrado' })
    const update = { name, email, role }
    if (password && password.trim() !== '') update.password = await bcrypt.hash(password, 10)
    await ref.update(update)
    const updated = await ref.get()
    res.json({ user: safeUser(updated) })
  } catch { res.status(500).json({ error: 'Erro interno do servidor' }) }
})

// DELETE /api/auth/users/:id — requer autenticação
router.delete('/users/:id', requireAuth, async (req, res) => {
  try {
    const snap = await users().get()
    if (snap.size <= 1) return res.status(400).json({ error: 'Não é possível excluir o único usuário' })
    await users().doc(req.params.id).delete()
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Erro interno do servidor' }) }
})

module.exports = router
