/**
 * Script para criar um novo usuário administrador no Firestore.
 * Uso: node server/scripts/criar-admin.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const admin  = require('firebase-admin')
const bcrypt = require('bcrypt')

// ─── Configuração do novo admin ───────────────────────────────────────────────
const NOVO_ADMIN = {
  name:     'Administrador',
  email:    'admin@sgfi.com',
  password: 'Admin@2026!',
  role:     'admin',
}
// ─────────────────────────────────────────────────────────────────────────────

;(async () => {
  // Inicializa Firebase Admin
  if (!admin.apps.length) {
    const path = require('path')

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const sa = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
      admin.initializeApp({ credential: admin.credential.cert(sa) })
    } else {
      const saRaw  = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json'
      const saPath = saRaw.startsWith('.') ? path.resolve(__dirname, '..', saRaw) : saRaw
      const sa = require(saPath)
      admin.initializeApp({ credential: admin.credential.cert(sa) })
    }
  }

  const db = admin.firestore()
  const users = db.collection('users')

  // Verifica se email já existe
  const existing = await users.where('email', '==', NOVO_ADMIN.email).limit(1).get()
  if (!existing.empty) {
    console.error(`\n❌ Usuário com email "${NOVO_ADMIN.email}" já existe no Firestore.`)
    console.log('   Para alterar a senha, use a interface de usuários no sistema ou edite o script com outro email.\n')
    process.exit(1)
  }

  const hash = await bcrypt.hash(NOVO_ADMIN.password, 10)
  const id   = `user_${Date.now()}`

  await users.doc(id).set({
    name:       NOVO_ADMIN.name,
    email:      NOVO_ADMIN.email,
    password:   hash,
    role:       NOVO_ADMIN.role,
    created_at: new Date().toISOString(),
  })

  console.log('\n✅ Usuário admin criado com sucesso!')
  console.log('──────────────────────────────────')
  console.log(`   ID:    ${id}`)
  console.log(`   Nome:  ${NOVO_ADMIN.name}`)
  console.log(`   Email: ${NOVO_ADMIN.email}`)
  console.log(`   Senha: ${NOVO_ADMIN.password}`)
  console.log(`   Role:  ${NOVO_ADMIN.role}`)
  console.log('──────────────────────────────────\n')
  process.exit(0)
})().catch(err => {
  console.error('\n❌ Erro ao criar admin:', err.message)
  process.exit(1)
})
