/**
 * SGFI — Servidor (Railway / desenvolvimento local)
 */
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Exceção não capturada:', err.message)
  console.error(err.stack)
  // Não chama process.exit para Railway ver o log
})

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Promise rejeitada sem handler:', reason)
})

// Log de variáveis de ambiente no startup (sem expor valores)
console.log('[STARTUP] NODE_ENV:', process.env.NODE_ENV || 'não definido')
console.log('[STARTUP] PORT:', process.env.PORT || '3001 (padrão)')
console.log('[STARTUP] FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✓ definido' : '✗ FALTANDO')
console.log('[STARTUP] GOOGLE_APPLICATION_CREDENTIALS_JSON:', process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? '✓ definido' : '✗ não definido')
console.log('[STARTUP] GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✓ ' + process.env.GOOGLE_APPLICATION_CREDENTIALS : '✗ não definido')
console.log('[STARTUP] JWT_SECRET:', process.env.JWT_SECRET ? '✓ definido' : '✗ FALTANDO')

const app  = require('./app')

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🚀 SGFI API rodando em http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/api/health\n`)
})
