const router = require('express').Router()
const db     = require('../db')

const col = () => db.collection('entities')

const toFront = (doc) => {
  const r = { id: doc.id, ...doc.data() }
  return {
    id:             r.id,
    name:           r.name,
    fullName:       r.fullName,
    documentNumber: r.documentNumber || null,
    address:        r.address        || null,
    phone:          r.phone          || null,
    email:          r.email          || null,
    website:        r.website        || null,
    logoUrl:        r.logoUrl        || null,
    brasaoUrl:      r.brasaoUrl      || null,
  }
}

// GET /api/entities
router.get('/', async (_req, res) => {
  try {
    const snap = await col().orderBy('createdAt').get()
    res.json(snap.docs.map(toFront))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/entities
router.post('/', async (req, res) => {
  const { name, fullName, documentNumber, address, phone, email, website, logoUrl, brasaoUrl } = req.body
  if (!name || !fullName) return res.status(400).json({ error: 'Nome e nome completo são obrigatórios' })
  const docSize = JSON.stringify(req.body).length
  if (docSize > 900000) return res.status(413).json({ error: 'Imagens muito grandes. Reduza o tamanho das imagens e tente novamente.' })
  try {
    const existing = await col().limit(1).get()
    if (!existing.empty) return res.status(409).json({ error: 'Já existe uma entidade cadastrada' })
    const id   = `entity_${Date.now()}`
    const data = { name, fullName, documentNumber: documentNumber||null, address: address||null,
      phone: phone||null, email: email||null, website: website||null,
      logoUrl: logoUrl||null, brasaoUrl: brasaoUrl||null, createdAt: new Date().toISOString() }
    await col().doc(id).set(data)
    const doc = await col().doc(id).get()
    res.status(201).json(toFront(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/entities/:id
router.put('/:id', async (req, res) => {
  const { name, fullName, documentNumber, address, phone, email, website, logoUrl, brasaoUrl } = req.body
  const docSize = JSON.stringify(req.body).length
  if (docSize > 900000) return res.status(413).json({ error: 'Imagens muito grandes. Reduza o tamanho das imagens e tente novamente.' })
  try {
    const ref = col().doc(req.params.id)
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'Entidade não encontrada' })
    await ref.update({ name, fullName, documentNumber: documentNumber||null, address: address||null,
      phone: phone||null, email: email||null, website: website||null,
      logoUrl: logoUrl||null, brasaoUrl: brasaoUrl||null })
    res.json(toFront(await ref.get()))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/entities/:id
router.delete('/:id', async (req, res) => {
  try {
    await col().doc(req.params.id).delete()
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
