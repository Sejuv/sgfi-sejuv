/**
 * SGFI — Importação de itens do Portal de Transparência
 * Origem: https://transparencia.acontratacao.com.br/pmiraucuba/itens
 *
 * GET  /api/portal-iraucuba/preview — busca itens sem salvar (prévia)
 * POST /api/portal-iraucuba/import  — busca e salva no Firestore (catalog_items)
 */
const router = require('express').Router()
const https  = require('https')
const http   = require('http')
const db     = require('../db')

const PORTAL_BASE = 'https://transparencia.acontratacao.com.br'
const ORG_SLUG    = 'pmiraucuba'

// ── Utilitários ───────────────────────────────────────────────

/** Faz GET com suporte a redirects e retorna string */
function fetchUrl(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        ...extraHeaders,
      },
    }, (res) => {
      // Segue redirect (máx 3 saltos)
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        fetchUrl(res.headers.location, extraHeaders).then(resolve).catch(reject)
        res.resume()
        return
      }
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve({ status: res.statusCode, body: data, contentType: res.headers['content-type'] || '' }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout ao acessar o portal')) })
  })
}

/** Mapeia string de categoria do portal para categorias internas do SGFI */
function mapCategory(cat) {
  if (!cat) return null
  const c = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (c.includes('material') && c.includes('consumo'))    return 'Material de Consumo'
  if (c.includes('material') && c.includes('permanente')) return 'Material Permanente'
  if (c.includes('servi'))                                return 'Serviços em Geral'
  if (c.includes('obra') || c.includes('reform'))        return 'Obras e Reformas'
  if (c.includes('tecnologia') || c.includes('inform'))  return 'Tecnologia da Informação'
  if (c.includes('saude') || c.includes('medic'))        return 'Saúde'
  if (c.includes('transport') || c.includes('combust'))  return 'Transporte / Combustível'
  if (c.includes('limpeza') || c.includes('higiene'))    return 'Limpeza e Higiene'
  if (c.includes('aliment') || c.includes('refei'))      return 'Alimentação'
  if (c.includes('mobili') || c.includes('movel'))       return 'Mobiliário'
  if (c.includes('seguran'))                              return 'Segurança'
  if (c.includes('consult') || c.includes('assessor'))   return 'Consultoria / Assessoria'
  if (c.includes('engenhar'))                             return 'Engenharia'
  if (c.includes('comunic'))                              return 'Comunicação'
  return cat.trim() || null
}

/** Limpa HTML tags de uma string */
function stripTags(str) {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

/**
 * Tenta mapear um objeto JSON (qualquer formato retornado pela API)
 * para o formato padrão { descricao, categoria, unidade, especificacao }
 */
function normalizeJsonItem(item) {
  return {
    descricao:    item.descricao    || item.description || item.nome          || item.name        || item.titulo || '',
    categoria:    item.categoria    || item.category    || item.tipo          || item.type        || item.grupo  || '',
    unidade:      item.unidade      || item.unit        || item.unidadeMedida || item.siglaUnidade || 'UN',
    especificacao: item.especificacao || item.specification || item.detalhe   || item.observacao  || item.obs    || '',
  }
}

/**
 * Parseia tabela HTML e extrai linhas como objetos
 * Detecta cabeçalhos automaticamente por palavras-chave
 */
function parseHtmlTable(html) {
  const items = []

  // Extrai cabeçalhos dos <th>
  const theadMatch = html.match(/<thead[\s\S]*?>([\s\S]*?)<\/thead>/i)
  let colIndexes = { descricao: -1, categoria: -1, unidade: -1, especificacao: -1 }

  if (theadMatch) {
    const ths = [...theadMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)]
      .map(m => stripTags(m[1]).toLowerCase())
    ths.forEach((h, i) => {
      if (h.includes('descri') || h.includes('item') || h.includes('nome'))   colIndexes.descricao    = i
      if (h.includes('categ') || h.includes('tipo') || h.includes('classe'))  colIndexes.categoria    = i
      if (h.includes('unid'))                                                  colIndexes.unidade      = i
      if (h.includes('espec') || h.includes('detalhe') || h.includes('obs'))  colIndexes.especificacao = i
    })
  }

  // Extrai linhas do <tbody>
  const tbodyMatch = html.match(/<tbody[\s\S]*?>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch) return items

  const rows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(m => stripTags(m[1]))
    if (cells.length === 0) continue

    let item
    if (colIndexes.descricao >= 0) {
      // Mapeamento por cabeçalho detectado
      item = {
        descricao:    colIndexes.descricao    >= 0 ? (cells[colIndexes.descricao]    || '') : '',
        categoria:    colIndexes.categoria    >= 0 ? (cells[colIndexes.categoria]    || '') : '',
        unidade:      colIndexes.unidade      >= 0 ? (cells[colIndexes.unidade]      || '') : '',
        especificacao: colIndexes.especificacao >= 0 ? (cells[colIndexes.especificacao] || '') : '',
      }
    } else {
      // Fallback: assume ordem padrão (col 0 = descrição, 1 = categoria, 2 = unidade, 3 = especificação)
      item = {
        descricao:    cells[0] || '',
        categoria:    cells[1] || '',
        unidade:      cells[2] || '',
        especificacao: cells[3] || '',
      }
    }

    if (item.descricao.length > 3) items.push(item)
  }

  return items
}

/**
 * Estratégia principal: tenta várias abordagens para obter os itens
 */
async function fetchPortalItems() {
  // ── Tentativa 1: Endpoints JSON conhecidos ────────────────
  const jsonEndpoints = [
    `${PORTAL_BASE}/api/${ORG_SLUG}/itens`,
    `${PORTAL_BASE}/api/${ORG_SLUG}/catalog-items`,
    `${PORTAL_BASE}/api/public/${ORG_SLUG}/itens`,
    `${PORTAL_BASE}/${ORG_SLUG}/api/itens`,
    `${PORTAL_BASE}/api/itens?slug=${ORG_SLUG}`,
    `${PORTAL_BASE}/api/v1/${ORG_SLUG}/itens`,
    `${PORTAL_BASE}/api/v1/itens?organizacao=${ORG_SLUG}`,
  ]

  for (const url of jsonEndpoints) {
    try {
      const { body, contentType, status } = await fetchUrl(url, { Accept: 'application/json' })
      if (status !== 200) continue
      if (!contentType.includes('json')) continue
      const parsed = JSON.parse(body)
      const list = Array.isArray(parsed)
        ? parsed
        : (parsed.data || parsed.itens || parsed.items || parsed.content || parsed.results || [])
      if (Array.isArray(list) && list.length > 0) {
        return list.map(normalizeJsonItem).filter(i => i.descricao.length > 2)
      }
    } catch { /* continua para próxima tentativa */ }
  }

  // ── Tentativa 2: Página HTML principal ───────────────────
  const { body: html, status } = await fetchUrl(`${PORTAL_BASE}/${ORG_SLUG}/itens`)
  if (status !== 200) throw new Error(`Portal retornou HTTP ${status}`)

  // Verifica se há JSON embutido na página (common em SPAs com SSR)
  const jsonEmbedded = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/)
    || html.match(/window\.__data__\s*=\s*({[\s\S]*?});/)
    || html.match(/"itens"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
    || html.match(/"items"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
  if (jsonEmbedded) {
    try {
      const rawJson = JSON.parse(jsonEmbedded[1])
      const list = Array.isArray(rawJson)
        ? rawJson
        : (rawJson.itens || rawJson.items || [])
      if (list.length > 0) return list.map(normalizeJsonItem).filter(i => i.descricao.length > 2)
    } catch { /* segue para parse HTML */ }
  }

  // ── Tentativa 3: Parse HTML tabela ───────────────────────
  const items = parseHtmlTable(html)
  if (items.length > 0) return items

  // ── Sem dados ─────────────────────────────────────────────
  throw new Error(
    'Nenhum item encontrado. O portal pode ser uma SPA que requer JavaScript para carregar os dados. ' +
    'Verifique se https://transparencia.acontratacao.com.br/pmiraucuba/itens está acessível.'
  )
}

// ── Rotas ─────────────────────────────────────────────────────

/**
 * GET /api/portal-iraucuba/preview
 * Retorna prévia dos itens do portal sem salvar no banco
 */
router.get('/preview', async (req, res) => {
  try {
    const items = await fetchPortalItems()
    res.json({ items, total: items.length })
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
})

/**
 * POST /api/portal-iraucuba/import
 * Busca itens do portal e salva na coleção catalog_items do Firestore.
 * Itens com descrição já existente são ignorados (evita duplicatas).
 * Body (opcional): { overwrite: true } — sobrescreve itens existentes
 */
router.post('/import', async (req, res) => {
  try {
    const items = await fetchPortalItems()
    if (items.length === 0) {
      return res.status(404).json({ error: 'Nenhum item encontrado no portal.' })
    }

    const overwrite = req.body?.overwrite === true
    const catalog   = db.collection('catalog_items')
    let saved = 0, skipped = 0, updated = 0
    let counter = 0

    for (const raw of items) {
      if (!raw.descricao || raw.descricao.length < 3) continue
      counter++

      const unit    = (raw.unidade || 'UN').toUpperCase().replace(/\.$/, '').trim() || 'UN'
      const docData = {
        description:           raw.descricao.trim(),
        category:              mapCategory(raw.categoria),
        unit,
        unitPrice:             0,
        specification:         raw.especificacao?.trim() || null,
        pncpCatalog:           null,
        pncpClassification:    null,
        pncpSubclassification: null,
        keyword1: null, keyword2: null, keyword3: null, keyword4: null,
        notes:         null,
        importedFrom:  'portal-iraucuba',
        importedAt:    new Date().toISOString(),
      }

      // Verifica duplicata por descrição exata
      const existing = await catalog
        .where('description', '==', docData.description)
        .limit(1)
        .get()

      if (!existing.empty) {
        if (overwrite) {
          await existing.docs[0].ref.update(docData)
          updated++
        } else {
          skipped++
        }
        continue
      }

      const id = `cat_portal_${Date.now()}_${counter}`
      await catalog.doc(id).set(docData)
      saved++
    }

    res.json({
      saved,
      skipped,
      updated,
      total: items.length,
      message: `Importação concluída: ${saved} salvos, ${skipped} ignorados (duplicatas)${updated ? `, ${updated} atualizados` : ''}.`,
    })
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
})

/**
 * GET /api/portal-iraucuba/import-stream
 * SSE: importa itens com barra de progresso em tempo real.
 * Usa batch writes do Firestore (até 499 por batch) e dedup via Set.
 */
router.get('/import-stream', async (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // nginx: desabilita buffering
  res.flushHeaders()

  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`)
    if (res.flush) res.flush()
  }

  try {
    // 1. Busca itens do portal
    send({ type: 'status', message: 'Buscando itens no portal...' })
    let items
    try {
      items = await fetchPortalItems()
    } catch (e) {
      send({ type: 'error', message: e.message })
      return res.end()
    }

    const validItems = items.filter(i => i.descricao && i.descricao.length >= 3)
    const total = validItems.length
    send({ type: 'total', total })

    // 2. Carrega descrições já existentes para deduplicação (uma query só)
    send({ type: 'status', message: 'Verificando itens já cadastrados...' })
    const catalog = db.collection('catalog_items')
    const existingSnap = await catalog.get()
    const existingDescs = new Set(
      existingSnap.docs.map(d => (d.data().description || '').trim().toUpperCase())
    )

    let saved = 0, skipped = 0, processed = 0
    const BATCH_SIZE = 499
    let batch = db.batch()
    let batchCount = 0
    const ts = Date.now()

    // 3. Processa itens
    for (const raw of validItems) {
      processed++
      const desc = raw.descricao.trim()
      const descKey = desc.toUpperCase()

      if (existingDescs.has(descKey)) {
        skipped++
      } else {
        existingDescs.add(descKey) // previne duplicatas dentro do mesmo lote
        const unit = (raw.unidade || 'UN').toUpperCase().replace(/\.$/, '').trim() || 'UN'
        const docRef = catalog.doc(`cat_portal_${ts}_${processed}`)
        batch.set(docRef, {
          description:           desc,
          category:              mapCategory(raw.categoria),
          unit,
          unitPrice:             0,
          specification:         raw.especificacao?.trim() || null,
          pncpCatalog:           null,
          pncpClassification:    null,
          pncpSubclassification: null,
          keyword1: null, keyword2: null, keyword3: null, keyword4: null,
          notes:        null,
          importedFrom: 'portal-iraucuba',
          importedAt:   new Date().toISOString(),
        })
        batchCount++
        saved++

        if (batchCount >= BATCH_SIZE) {
          await batch.commit()
          batch = db.batch()
          batchCount = 0
        }
      }

      // Envia progresso a cada 100 itens
      if (processed % 100 === 0) {
        send({ type: 'progress', processed, total, saved, skipped })
      }
    }

    // Commita o lote restante
    if (batchCount > 0) await batch.commit()

    // Progresso e conclusão finais
    send({ type: 'progress', processed, total, saved, skipped })
    send({ type: 'done', processed, total, saved, skipped })
    res.end()
  } catch (e) {
    send({ type: 'error', message: e.message })
    res.end()
  }
})

module.exports = router
