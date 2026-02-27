const router = require('express').Router()
const db     = require('../db')

const col = () => db.collection('contracts')

// Os itens do contrato ficam embutidos no documento do contrato como array 'items'
const itemToFront = (i) => ({
  id:          i.id,
  description: i.description,
  quantity:    parseFloat(i.quantity),
  consumed:    parseFloat(i.consumed || 0),
  unit:        i.unit,
  unitPrice:   parseFloat(i.unitPrice),
})

const contractToFront = (doc) => {
  const r = { id: doc.id, ...doc.data() }
  return {
    id:               r.id,
    number:           r.number,
    description:      r.description,
    creditorId:       r.creditorId || null,
    status:           r.status,
    startDate:        r.startDate,
    endDate:          r.endDate,
    notes:            r.notes || '',
    alertNewContract: r.alertNewContract ?? undefined,
    alertAdditive:    r.alertAdditive    ?? undefined,
    createdAt:        r.createdAt,
    items:            (r.items || []).map(itemToFront),
  }
}

// GET /api/contracts
router.get('/', async (_req, res) => {
  try {
    const snap = await col().orderBy('createdAt', 'desc').get()
    res.json(snap.docs.map(contractToFront))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/contracts
router.post('/', async (req, res) => {
  const { id, number, description, creditorId, status, startDate, endDate,
          notes, alertNewContract, alertAdditive, items, createdAt } = req.body
  try {
    const data = {
      number, description, creditorId: creditorId || null, status, startDate, endDate,
      notes: notes || '', alertNewContract: alertNewContract ?? null,
      alertAdditive: alertAdditive ?? null, createdAt,
      items: (items || []).map((item, i) => ({ ...item, consumed: item.consumed ?? 0, sort: i }))
    }
    await col().doc(id).set(data)
    const doc = await col().doc(id).get()
    res.status(201).json(contractToFront(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/contracts/:id
router.put('/:id', async (req, res) => {
  const { number, description, creditorId, status, startDate, endDate,
          notes, alertNewContract, alertAdditive, items } = req.body
  try {
    const ref = col().doc(req.params.id)
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'Contrato não encontrado' })
    await ref.update({
      number, description, creditorId: creditorId || null, status, startDate, endDate,
      notes: notes || '', alertNewContract: alertNewContract ?? null,
      alertAdditive: alertAdditive ?? null,
      items: (items || []).map((item, i) => ({ ...item, consumed: item.consumed ?? 0, sort: i }))
    })
    res.json(contractToFront(await ref.get()))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PATCH /api/contracts/:id/items/:itemId/consumed
router.patch('/:id/items/:itemId/consumed', async (req, res) => {
  const { consumed } = req.body
  try {
    const ref  = col().doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'Contrato não encontrado' })
    const items = (snap.data().items || []).map(i =>
      i.id === req.params.itemId ? { ...i, consumed } : i
    )
    const updated = items.find(i => i.id === req.params.itemId)
    if (!updated) return res.status(404).json({ error: 'Item não encontrado' })
    await ref.update({ items })
    res.json(itemToFront(updated))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/contracts/:id
router.delete('/:id', async (req, res) => {
  try {
    await col().doc(req.params.id).delete()
    res.status(204).end()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
