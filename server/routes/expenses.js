const router = require('express').Router()
const db     = require('../db')

const col = () => db.collection('expenses')

const toFront = (doc) => {
  const r = { id: doc.id, ...doc.data() }
  return {
    id:          r.id,
    description: r.description,
    amount:      parseFloat(r.amount),
    type:        r.type,
    dueDate:     r.dueDate,
    month:       r.month,
    status:      r.status,
    creditorId:  r.creditorId  || null,
    categoryId:  r.categoryId  || null,
    createdAt:   r.createdAt,
    paidAt:      r.paidAt      || undefined,
  }
}

// GET /api/expenses
router.get('/', async (_req, res) => {
  try {
    const snap = await col().orderBy('dueDate').get()
    res.json(snap.docs.map(toFront))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/expenses
router.post('/', async (req, res) => {
  const { id, description, amount, type, dueDate, month, status, creditorId, categoryId, createdAt, paidAt } = req.body
  try {
    const data = { description, amount, type, dueDate, month,
      status: status || 'pending', creditorId: creditorId || null,
      categoryId: categoryId || null, createdAt, paidAt: paidAt || null }
    await col().doc(id).set(data)
    const doc = await col().doc(id).get()
    res.status(201).json(toFront(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  const { description, amount, type, dueDate, month, status, creditorId, categoryId, paidAt } = req.body
  try {
    const ref = col().doc(req.params.id)
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'Despesa não encontrada' })
    await ref.update({ description, amount, type, dueDate, month, status,
      creditorId: creditorId || null, categoryId: categoryId || null, paidAt: paidAt || null })
    res.json(toFront(await ref.get()))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    await col().doc(req.params.id).delete()
    res.status(204).end()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
