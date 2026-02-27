const router = require('express').Router()
const db     = require('../db')

const col = () => db.collection('creditors')

const toFront = (doc) => {
  const r = { id: doc.id, ...doc.data() }
  return {
    id:             r.id,
    name:           r.name,
    documentNumber: r.documentNumber,
    contact:        r.contact,
    email:          r.email,
    cep:            r.cep,
    street:         r.street,
    neighborhood:   r.neighborhood,
    city:           r.city,
    uf:             r.uf,
  }
}

// GET /api/creditors
router.get('/', async (_req, res) => {
  try {
    const snap = await col().orderBy('name').get()
    res.json(snap.docs.map(toFront))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/creditors
router.post('/', async (req, res) => {
  const { id, name, documentNumber, contact, email, cep, street, neighborhood, city, uf } = req.body
  try {
    const data = { name, documentNumber: documentNumber||'', contact: contact||'', email: email||'',
      cep: cep||'', street: street||'', neighborhood: neighborhood||'', city: city||'', uf: uf||'' }
    await col().doc(id).set(data)
    const doc = await col().doc(id).get()
    res.status(201).json(toFront(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/creditors/:id
router.put('/:id', async (req, res) => {
  const { name, documentNumber, contact, email, cep, street, neighborhood, city, uf } = req.body
  try {
    const ref = col().doc(req.params.id)
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'Credor não encontrado' })
    await ref.update({ name, documentNumber: documentNumber||'', contact: contact||'', email: email||'',
      cep: cep||'', street: street||'', neighborhood: neighborhood||'', city: city||'', uf: uf||'' })
    res.json(toFront(await ref.get()))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/creditors/:id
router.delete('/:id', async (req, res) => {
  try {
    await col().doc(req.params.id).delete()
    res.status(204).end()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
