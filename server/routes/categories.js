const router = require('express').Router()
const db     = require('../db')

const col = () => db.collection('categories')

const toFront = (doc) => {
  const r = { id: doc.id, ...doc.data() }
  return { id: r.id, name: r.name, type: r.type, color: r.color || null }
}

router.get('/', async (_req, res) => {
  try {
    const snap = await col().orderBy('name').get()
    res.json(snap.docs.map(toFront))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  const { id, name, type, color } = req.body
  try {
    const data = { name, type, color: color || null }
    await col().doc(id).set(data)
    const doc = await col().doc(id).get()
    res.status(201).json(toFront(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  const { name, type, color } = req.body
  try {
    const ref = col().doc(req.params.id)
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'Categoria não encontrada' })
    await ref.update({ name, type, color: color || null })
    res.json(toFront(await ref.get()))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await col().doc(req.params.id).delete()
    res.status(204).end()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
