const router = require('express').Router()
const db     = require('../db')

// Todas as configurações em um único documento Firestore: app_settings/config
const settingsDoc = () => db.collection('app_settings').doc('config')

// GET /api/settings — retorna todas as configurações como objeto { key: value }
router.get('/', async (_req, res) => {
  try {
    const snap = await settingsDoc().get()
    res.json(snap.exists ? snap.data() : {})
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/settings — salva/atualiza um ou mais pares { key: value }
router.put('/', async (req, res) => {
  const entries = req.body
  if (!entries || typeof entries !== 'object') return res.status(400).json({ error: 'Body inválido' })
  try {
    await settingsDoc().set(entries, { merge: true })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
