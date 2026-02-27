const router = require('express').Router()
const db     = require('../db')

const col = () => db.collection('catalog_items')

const toFront = (doc) => {
  const r = { id: doc.id, ...doc.data() }
  return {
    id:                    r.id,
    description:           r.description,
    category:              r.category              || undefined,
    unit:                  r.unit,
    unitPrice:             parseFloat(r.unitPrice),
    pncpCatalog:           r.pncpCatalog           || undefined,
    pncpClassification:    r.pncpClassification    || undefined,
    pncpSubclassification: r.pncpSubclassification || undefined,
    specification:         r.specification         || undefined,
    keyword1:              r.keyword1              || undefined,
    keyword2:              r.keyword2              || undefined,
    keyword3:              r.keyword3              || undefined,
    keyword4:              r.keyword4              || undefined,
    notes:                 r.notes                 || undefined,
  }
}

// GET /api/catalog-items
router.get('/', async (_, res) => {
  try {
    const snap = await col().orderBy('description').get()
    res.json(snap.docs.map(toFront))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/catalog-items
router.post('/', async (req, res) => {
  const { id, description, category, unit, unitPrice, pncpCatalog, pncpClassification,
          pncpSubclassification, specification, keyword1, keyword2, keyword3, keyword4, notes } = req.body
  try {
    const data = {
      description, category: category||null, unit: unit||'un', unitPrice: unitPrice||0,
      pncpCatalog: pncpCatalog||null, pncpClassification: pncpClassification||null,
      pncpSubclassification: pncpSubclassification||null, specification: specification||null,
      keyword1: keyword1||null, keyword2: keyword2||null, keyword3: keyword3||null,
      keyword4: keyword4||null, notes: notes||null
    }
    await col().doc(id).set(data)
    const doc = await col().doc(id).get()
    res.status(201).json(toFront(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/catalog-items/:id
router.put('/:id', async (req, res) => {
  const { description, category, unit, unitPrice, pncpCatalog, pncpClassification,
          pncpSubclassification, specification, keyword1, keyword2, keyword3, keyword4, notes } = req.body
  try {
    const ref = col().doc(req.params.id)
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'Item não encontrado' })
    await ref.update({
      description, category: category||null, unit: unit||'un', unitPrice: unitPrice||0,
      pncpCatalog: pncpCatalog||null, pncpClassification: pncpClassification||null,
      pncpSubclassification: pncpSubclassification||null, specification: specification||null,
      keyword1: keyword1||null, keyword2: keyword2||null, keyword3: keyword3||null,
      keyword4: keyword4||null, notes: notes||null
    })
    res.json(toFront(await ref.get()))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/catalog-items/:id
router.delete('/:id', async (req, res) => {
  try {
    await col().doc(req.params.id).delete()
    res.status(204).end()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
