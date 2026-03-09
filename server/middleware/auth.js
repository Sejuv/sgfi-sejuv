const jwt = require('jsonwebtoken')

/**
 * Middleware de autenticação JWT.
 * Lê o header Authorization: Bearer <token> e valida assinatura.
 * Injeta req.user = { id, email, role } no fluxo.
 */
module.exports = function requireAuth(req, res, next) {
  const auth = req.headers['authorization']
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' })
  }
  const token = auth.slice(7)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' })
  }
}
