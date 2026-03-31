/**
 * SGFI — Servidor (Railway / desenvolvimento local)
 */
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Exceção não capturada:', err.message)
  console.error(err.stack)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Promise rejeitada sem handler:', reason)
  process.exit(1)
})

const app  = require('./app')

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🚀 SGFI API rodando em http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/api/health\n`)
})
