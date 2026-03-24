/**
 * SGFI — Servidor (Railway / desenvolvimento local)
 */
const app  = require('./app')

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🚀 SGFI API rodando em http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/api/health\n`)
})
