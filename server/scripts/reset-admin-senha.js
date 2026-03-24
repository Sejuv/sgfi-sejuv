/**
 * Script para redefinir a senha do admin no Firestore.
 * Uso: node server/scripts/reset-admin-senha.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const admin  = require('firebase-admin')
const bcrypt = require('bcrypt')

const ADMIN_EMAIL = 'admin@sgfi.com'
const NOVA_SENHA  = '12954768'

;(async () => {
  const path = require('path')

  if (!admin.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const sa = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
      admin.initializeApp({ credential: admin.credential.cert(sa) })
    } else {
      const saRaw  = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json'
      const saPath = saRaw.startsWith('.') ? path.resolve(__dirname, '..', saRaw) : saRaw
      admin.initializeApp({ credential: admin.credential.cert(require(saPath)) })
    }
  }

  const db    = admin.firestore()
  const snap  = await db.collection('users').where('email', '==', ADMIN_EMAIL).limit(1).get()

  if (snap.empty) {
    console.error(`\n❌ Nenhum usuário com email "${ADMIN_EMAIL}" encontrado.\n`)
    process.exit(1)
  }

  const doc  = snap.docs[0]
  const hash = await bcrypt.hash(NOVA_SENHA, 10)
  await doc.ref.update({ password: hash })

  console.log('\n✅ Senha redefinida com sucesso!')
  console.log('──────────────────────────────────')
  console.log(`   Email: ${ADMIN_EMAIL}`)
  console.log(`   Senha: ${NOVA_SENHA}`)
  console.log('──────────────────────────────────\n')
  process.exit(0)
})().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
