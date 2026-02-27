const express = require('express')
const https   = require('https')
const router  = express.Router()

// ─── Base estática de fallback (usada quando a API externa não está acessível) ──

const CATMAT_BASE = [
  { codigo: '367900', descricao: 'PAPEL, TIPO A4, BRANCO, FORMAT0 210 X 297 MM, 75 G/M2', unidade: 'RM', classe: 'Material de Escritório', subclasse: 'Papel para Impressão', tipo: 'CATMAT' },
  { codigo: '251550', descricao: 'CANETA ESFEROGRÁFICA, TINTA AZUL, CORPO PLÁSTICO TRANSPARENTE', unidade: 'UN', classe: 'Material de Escritório', subclasse: 'Canetas e Marcadores', tipo: 'CATMAT' },
  { codigo: '251551', descricao: 'CANETA ESFEROGRÁFICA, TINTA PRETA, CORPO PLÁSTICO', unidade: 'UN', classe: 'Material de Escritório', subclasse: 'Canetas e Marcadores', tipo: 'CATMAT' },
  { codigo: '251552', descricao: 'CANETA ESFEROGRÁFICA, TINTA VERMELHA, CORPO PLÁSTICO', unidade: 'UN', classe: 'Material de Escritório', subclasse: 'Canetas e Marcadores', tipo: 'CATMAT' },
  { codigo: '251560', descricao: 'CANETA MARCA TEXTO, CORES VARIADAS, PONTA CHANFRADA', unidade: 'UN', classe: 'Material de Escritório', subclasse: 'Canetas e Marcadores', tipo: 'CATMAT' },
  { codigo: '300400', descricao: 'LÁPIS GRAFITE N° 2, MADEIRA, SEXTAVADO, COM BORRACHA', unidade: 'UN', classe: 'Material de Escritório', subclasse: 'Lápis e Lapiseiras', tipo: 'CATMAT' },
  { codigo: '350200', descricao: 'GRAMPEADOR DE MESA, CAPACIDADE 20 FOLHAS, METAL/PLÁSTICO', unidade: 'UN', classe: 'Material de Escritório', subclasse: 'Grampeadores e Perfuradores', tipo: 'CATMAT' },
  { codigo: '350201', descricao: 'GRAMPO 26/6, GALVANIZADO, CAIXA COM 5000 UNIDADES', unidade: 'CX', classe: 'Material de Escritório', subclasse: 'Grampos e Clipes', tipo: 'CATMAT' },
  { codigo: '301100', descricao: 'ENVELOPE BRANCO, TAMANHO OFÍCIO, 114 X 229 MM, LISO', unidade: 'CX', classe: 'Material de Escritório', subclasse: 'Envelopes', tipo: 'CATMAT' },
  { codigo: '450000', descricao: 'PASTA AZ, LOMBADA LARGA, COM MECANISMO ALAVANCA, TAMANHO OFÍCIO', unidade: 'UN', classe: 'Material de Escritório', subclasse: 'Pastas e Encadernadores', tipo: 'CATMAT' },
  { codigo: '450001', descricao: 'PASTA SUSPENSA, EM PAPEL KRAFT, COM VISOR, TAMANHO OFÍCIO', unidade: 'UN', classe: 'Material de Escritório', subclasse: 'Pastas e Encadernadores', tipo: 'CATMAT' },
  { codigo: '600000', descricao: 'IMPRESSORA LASER MONOCROMÁTICA, VELOCIDADE 30 PPM, USB', unidade: 'UN', classe: 'Equipamentos de TI', subclasse: 'Impressoras', tipo: 'CATMAT' },
  { codigo: '600001', descricao: 'COMPUTADOR DESKTOP, PROCESSADOR I5, 8GB RAM, SSD 256GB', unidade: 'UN', classe: 'Equipamentos de TI', subclasse: 'Microcomputadores', tipo: 'CATMAT' },
  { codigo: '600002', descricao: 'MOUSE ÓPTICO USB, 1200 DPI, SCROLL, CABO 1,5M', unidade: 'UN', classe: 'Equipamentos de TI', subclasse: 'Periféricos', tipo: 'CATMAT' },
  { codigo: '600003', descricao: 'TECLADO USB ABNT2, PADRÃO BRASILEIRO, PLUG AND PLAY', unidade: 'UN', classe: 'Equipamentos de TI', subclasse: 'Periféricos', tipo: 'CATMAT' },
  { codigo: '600010', descricao: 'MONITOR LCD 21,5", FULL HD 1920X1080, VGA/HDMI', unidade: 'UN', classe: 'Equipamentos de TI', subclasse: 'Monitores', tipo: 'CATMAT' },
  { codigo: '600020', descricao: 'NOBREAK 1200VA, BIVOLT AUTOMÁTICO, 8 TOMADAS', unidade: 'UN', classe: 'Equipamentos de TI', subclasse: 'Estabilizadores e Nobreaks', tipo: 'CATMAT' },
  { codigo: '700100', descricao: 'CADEIRA SECRETÁRIA GIRATÓRIA, ESTOFADA EM TECIDO, COM RODÍZIOS', unidade: 'UN', classe: 'Mobiliário', subclasse: 'Cadeiras', tipo: 'CATMAT' },
  { codigo: '700101', descricao: 'MESA DE ESCRITÓRIO EM L, TAMPO MDF 25MM, COM PORTA-TECLADO', unidade: 'UN', classe: 'Mobiliário', subclasse: 'Mesas', tipo: 'CATMAT' },
  { codigo: '700102', descricao: 'ARMÁRIO DE AÇO, 2 PORTAS, 4 PRATELEIRAS, 1,98X0,92X0,40M', unidade: 'UN', classe: 'Mobiliário', subclasse: 'Armários e Arquivos', tipo: 'CATMAT' },
  { codigo: '800100', descricao: 'ÁGUA MINERAL, NATURAL, SEM GÁS, GARRAFA PET 500ML', unidade: 'UN', classe: 'Alimentos e Bebidas', subclasse: 'Águas e Refrigerantes', tipo: 'CATMAT' },
  { codigo: '800200', descricao: 'CAFÉ EM PÓ TORRADO E MOÍDO, TRADICIONAL, EMBALAGEM 500G, VÁCUO', unidade: 'KG', classe: 'Alimentos e Bebidas', subclasse: 'Café, Chá e Afins', tipo: 'CATMAT' },
  { codigo: '900100', descricao: 'CIMENTO PORTLAND CP II-E-32, SACO 50KG', unidade: 'SC', classe: 'Material de Construção', subclasse: 'Cimento e Cal', tipo: 'CATMAT' },
  { codigo: '900200', descricao: 'TINTA LÁTEX ACRÍLICA, BRANCA, LATA 18L, RENDIMENTO 300M2', unidade: 'LT', classe: 'Material de Construção', subclasse: 'Tintas e Vernizes', tipo: 'CATMAT' },
  { codigo: '100100', descricao: 'MEDICAMENTO: PARACETAMOL 500MG, COMPRIMIDO, EMBALAGEM 20 UNIDADES', unidade: 'CX', classe: 'Medicamentos', subclasse: 'Analgésicos e Antitérmicos', tipo: 'CATMAT' },
]

const CATSERV_BASE = [
  { codigo: 'S001', descricao: 'SERVIÇOS DE LIMPEZA E CONSERVAÇÃO DE AMBIENTES INTERNOS', unidade: 'M2', classe: 'Serviços Gerais', subclasse: 'Limpeza', tipo: 'CATSERV' },
  { codigo: 'S002', descricao: 'SERVIÇOS DE VIGILÂNCIA PATRIMONIAL ARMADA 24 HORAS', unidade: 'PST', classe: 'Serviços de Segurança', subclasse: 'Vigilância', tipo: 'CATSERV' },
  { codigo: 'S003', descricao: 'SERVIÇOS DE MANUTENÇÃO PREVENTIVA E CORRETIVA DE AR-CONDICIONADO', unidade: 'SV', classe: 'Manutenção', subclasse: 'Ar-Condicionado', tipo: 'CATSERV' },
  { codigo: 'S004', descricao: 'SERVIÇOS TÉCNICOS EM TECNOLOGIA DA INFORMAÇÃO - SUPORTE HELPDESK', unidade: 'H', classe: 'Tecnologia da Informação', subclasse: 'Suporte Técnico', tipo: 'CATSERV' },
  { codigo: 'S005', descricao: 'SERVIÇOS DE MANUTENÇÃO ELÉTRICA PREDIAL', unidade: 'SV', classe: 'Manutenção', subclasse: 'Elétrica', tipo: 'CATSERV' },
  { codigo: 'S006', descricao: 'SERVIÇOS DE RECEPÇÃO E ATENDIMENTO AO PÚBLICO', unidade: 'PST', classe: 'Serviços Administrativos', subclasse: 'Recepção', tipo: 'CATSERV' },
  { codigo: 'S007', descricao: 'SERVIÇOS DE TRANSPORTE DE PESSOAS - MOTORISTA', unidade: 'H', classe: 'Transporte', subclasse: 'Transporte de Pessoal', tipo: 'CATSERV' },
  { codigo: 'S008', descricao: 'SERVIÇOS DE REPROGRAFIA E IMPRESSÃO DE DOCUMENTOS', unidade: 'PG', classe: 'Serviços Administrativos', subclasse: 'Reprografia', tipo: 'CATSERV' },
  { codigo: 'S009', descricao: 'SERVIÇOS DE JARDINAGEM E MANUTENÇÃO DE ÁREAS VERDES', unidade: 'M2', classe: 'Serviços Gerais', subclasse: 'Jardinagem', tipo: 'CATSERV' },
  { codigo: 'S010', descricao: 'SERVIÇOS DE COPEIRAGEM E COZINHA', unidade: 'PST', classe: 'Serviços Gerais', subclasse: 'Copeiragem', tipo: 'CATSERV' },
  { codigo: 'S011', descricao: 'SERVIÇOS DE DESENVOLVIMENTO DE SOFTWARE SOB DEMANDA', unidade: 'H', classe: 'Tecnologia da Informação', subclasse: 'Desenvolvimento de Software', tipo: 'CATSERV' },
  { codigo: 'S012', descricao: 'SERVIÇOS DE CAPACITAÇÃO E TREINAMENTO DE PESSOAL', unidade: 'H', classe: 'Educação e Treinamento', subclasse: 'Treinamento', tipo: 'CATSERV' },
  { codigo: 'S013', descricao: 'SERVIÇOS DE LOCAÇÃO DE VEÍCULO EXECUTIVO COM MOTORISTA', unidade: 'DI', classe: 'Transporte', subclasse: 'Locação de Veículos', tipo: 'CATSERV' },
  { codigo: 'S014', descricao: 'SERVIÇOS DE FORNECIMENTO DE REFEIÇÕES - SELF-SERVICE POR KG', unidade: 'KG', classe: 'Alimentação', subclasse: 'Refeições', tipo: 'CATSERV' },
  { codigo: 'S015', descricao: 'SERVIÇOS DE CONSULTORIA EM GESTÃO E PLANEJAMENTO ESTRATÉGICO', unidade: 'H', classe: 'Consultoria', subclasse: 'Gestão', tipo: 'CATSERV' },
  { codigo: 'S016', descricao: 'SERVIÇOS DE MANUTENÇÃO HIDRÁULICA PREDIAL', unidade: 'SV', classe: 'Manutenção', subclasse: 'Hidráulica', tipo: 'CATSERV' },
  { codigo: 'S017', descricao: 'SERVIÇOS DE DESINFECÇÃO, DESINSETIZAÇÃO E DESRATIZAÇÃO', unidade: 'M2', classe: 'Serviços Gerais', subclasse: 'Controle de Pragas', tipo: 'CATSERV' },
  { codigo: 'S018', descricao: 'SERVIÇOS DE TELECOMUNICAÇÕES - LINK DE INTERNET DEDICADO', unidade: 'MES', classe: 'Tecnologia da Informação', subclasse: 'Conectividade', tipo: 'CATSERV' },
  { codigo: 'S019', descricao: 'SERVIÇOS GRÁFICOS - IMPRESSÃO DE MATERIAL INSTITUCIONAL', unidade: 'UN', classe: 'Serviços Gráficos', subclasse: 'Material Impresso', tipo: 'CATSERV' },
  { codigo: 'S020', descricao: 'SERVIÇOS DE AUDITORIA CONTÁBIL E FINANCEIRA', unidade: 'SV', classe: 'Serviços Profissionais', subclasse: 'Auditoria', tipo: 'CATSERV' },
]


function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'SGFI/1.0 (sistema interno)',
        'Accept': 'application/json',
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { reject(new Error('Resposta inválida do servidor PNCP')) }
      })
    })
    req.on('error', reject)
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

/**
 * GET /api/pncp-catalog/catalogs
 * Retorna a lista de catálogos disponíveis no PNCP (GET /v1/catalogos)
 * Endpoint público da API PNCP, não requer autenticação para leitura.
 */
router.get('/catalogs', async (req, res) => {
  try {
    const data = await httpsGet('https://pncp.gov.br/api/pncp/v1/catalogos?statusAtivo=true')
    res.json(data)
  } catch (e) {
    // Fallback com os dois catálogos oficiais
    res.json([
      { id: 1, nome: 'CATMAT', descricao: 'Catálogo de Materiais' },
      { id: 2, nome: 'CATSERV', descricao: 'Catálogo de Serviços' },
    ])
  }
})

/**
 * GET /api/pncp-catalog/search?q=papel&tipo=material&pagina=1
 * Busca itens no CATMAT ou CATSERV via API pública do ComprasNet/SIASG
 * tipo: 'material' (CATMAT) | 'servico' (CATSERV)
 */
router.get('/search', async (req, res) => {
  const q       = String(req.query.q || '').trim()
  const tipo    = String(req.query.tipo || 'material').toLowerCase()
  const pagina  = parseInt(req.query.pagina) || 1

  if (!q || q.length < 2) {
    return res.json({ itens: [], total: 0 })
  }

  try {
    let url
    if (tipo === 'servico' || tipo === 'catserv') {
      url = `https://compras.dados.gov.br/servicos/v1/servicos.json?descricao=${encodeURIComponent(q)}&pagina=${pagina}`
    } else {
      url = `https://compras.dados.gov.br/materiais/v1/materiais.json?descricao=${encodeURIComponent(q)}&pagina=${pagina}`
    }

    const data = await httpsGet(url)

    // Normaliza resposta para formato único
    const lista = data.materiais || data.servicos || []
    const itens = lista.map(item => ({
      codigo:       item.codigo || item.id || '',
      descricao:    item.descricao || item.nome || '',
      unidade:      item.unidadeFornecimento || item.unidade || '',
      classe:       item.classeDescricao || item.classe || '',
      subclasse:    item.pdm || item.subclasse || '',
      tipo:         tipo === 'servico' ? 'CATSERV' : 'CATMAT',
    }))

    return res.json({ itens, total: data.count || itens.length })
  } catch (e) {
    console.warn('[pncp-catalog] API externa indisponível, usando base local:', e.message)
    // Fallback: busca na base estática local quando a API externa não está acessível
    const termoBusca = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const baseFallback = tipo === 'servico' || tipo === 'catserv' ? CATSERV_BASE : CATMAT_BASE
    const itensFiltrados = baseFallback.filter(i =>
      i.descricao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(termoBusca)
    )
    return res.json({ itens: itensFiltrados.slice(0, 20), total: itensFiltrados.length, fonte: 'local' })
  }
})

module.exports = router
