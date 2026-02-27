/**
 * SGFI — Firebase Admin SDK / Firestore
 *
 * Prioridade de credenciais:
 *  1. GOOGLE_APPLICATION_CREDENTIALS_JSON — JSON completo da service account em string
 *     (use no Railway: cole o conteúdo inteiro do serviceAccountKey.json)
 *  2. GOOGLE_APPLICATION_CREDENTIALS — caminho para o arquivo serviceAccountKey.json
 *     (use em desenvolvimento local)
 */
require('dotenv').config()
const admin = require('firebase-admin')

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID

  // 1. Credencial via JSON string (Railway / qualquer PaaS)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const sa = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
      admin.initializeApp({ credential: admin.credential.cert(sa), projectId })
      console.log('[DB] Firebase Admin inicializado via GOOGLE_APPLICATION_CREDENTIALS_JSON')
    } catch (e) {
      console.error('[DB] Falha ao parsear GOOGLE_APPLICATION_CREDENTIALS_JSON:', e.message)
      process.exit(1)
    }
  }
  // 2. Credencial via arquivo (desenvolvimento local)
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const path = require('path')
      const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
      const resolved = saPath.startsWith('.') ? path.resolve(__dirname, saPath) : saPath
      const sa = require(resolved)
      admin.initializeApp({ credential: admin.credential.cert(sa), projectId })
      console.log('[DB] Firebase Admin inicializado via serviceAccountKey.json')
    } catch (e) {
      console.error('[DB] Falha ao carregar serviceAccountKey.json:', e.message)
      process.exit(1)
    }
  }
  // 3. Sem credenciais explícitas (erro claro)
  else {
    console.error('[DB] ERRO: Defina GOOGLE_APPLICATION_CREDENTIALS_JSON ou GOOGLE_APPLICATION_CREDENTIALS')
    process.exit(1)
  }
}

module.exports = admin.firestore()
