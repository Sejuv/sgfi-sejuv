const router = require('express').Router()
const db     = require('../db')

const col = () => db.collection('expenses')

const toFront = (doc) => {
  const r = { id: doc.id, ...doc.data() }
  return {
    id:                 r.id,
    number:             r.number             || null,
    description:        r.description,
    amount:             parseFloat(r.amount),
    type:               r.type,
    classification:     r.classification     || null,
    customerNumber:     r.customerNumber     || null,
    installationNumber: r.installationNumber || null,
    dueDate:            r.dueDate,
    month:              r.month,
    status:             r.status,
    creditorId:         r.creditorId         || null,
    categoryId:         r.categoryId         || null,
    contractId:         r.contractId         || null,
    createdAt:          r.createdAt,
    paidAt:             r.paidAt             || undefined,
  }
}

/** Gera próximo número sequencial: "0001/2026" */
async function nextExpenseNumber(year) {
  const snap = await col()
    .where('number', '>=', `0001/${year}`)
    .where('number', '<=', `9999/${year}`)
    .get()
  let max = 0
  snap.docs.forEach((d) => {
    const num = parseInt((d.data().number || '').split('/')[0]) || 0
    if (num > max) max = num
  })
  return `${String(max + 1).padStart(4, '0')}/${year}`
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
  const {
    id, description, amount, type, dueDate, month, status,
    creditorId, categoryId, contractId, createdAt, paidAt,
    classification, customerNumber, installationNumber, number,
  } = req.body
  try {
    const year = new Date().getFullYear()
    const expNumber = number || await nextExpenseNumber(year)
    const data = {
      number:             expNumber,
      description, amount, type, dueDate, month,
      status:             status             || 'pending',
      creditorId:         creditorId         || null,
      categoryId:         categoryId         || null,
      contractId:         contractId         || null,
      classification:     classification     || null,
      customerNumber:     customerNumber     || null,
      installationNumber: installationNumber || null,
      createdAt,
      paidAt:             paidAt             || null,
    }
    await col().doc(id).set(data)
    const doc = await col().doc(id).get()
    res.status(201).json(toFront(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  const {
    number, description, amount, type, dueDate, month, status,
    creditorId, categoryId, contractId, paidAt,
    classification, customerNumber, installationNumber,
  } = req.body
  try {
    const ref = col().doc(req.params.id)
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'Despesa não encontrada' })
    await ref.update({
      number:             number             || null,
      description, amount, type, dueDate, month, status,
      creditorId:         creditorId         || null,
      categoryId:         categoryId         || null,
      contractId:         contractId         || null,
      classification:     classification     || null,
      customerNumber:     customerNumber     || null,
      installationNumber: installationNumber || null,
      paidAt:             paidAt             || null,
    })
    res.json(toFront(await ref.get()))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    await col().doc(req.params.id).delete()
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
