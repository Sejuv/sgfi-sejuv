import { Expense, Creditor, Contract } from './types'
import { formatCurrency } from './calculations'

export interface SystemContext {
  activeView: string
  expenses: Expense[]
  creditors: Creditor[]
  contracts: Contract[]
  userName?: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function totalValue(list: Expense[]): number {
  return list.reduce((s, e) => s + (e.amount ?? 0), 0)
}

function normalizeMsg(msg: string): string {
  return msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, ' ')
}

// ── Respostas locais inteligentes ────────────────────────────────────────────
export function generateLocalResponse(message: string, ctx: SystemContext): string {
  const msg = normalizeMsg(message)
  const overdue = ctx.expenses.filter(e => e.status === 'overdue')
  const pending = ctx.expenses.filter(e => e.status === 'pending')
  const paid    = ctx.expenses.filter(e => e.status === 'paid')

  // ── Saudações
  if (/^(oi|ola|boa|bom|tudo|hey|hi|hello|obrigad|valeu|ate|tchau)/.test(msg)) {
    const nome = ctx.userName?.split(' ')[0]
    if (/obrigad|valeu/.test(msg)) return `De nada${nome ? `, ${nome}` : ''}! 😊 Fico feliz em ajudar. Se precisar de mais alguma coisa, é só falar!`
    if (/ate|tchau/.test(msg)) return `Até mais${nome ? `, ${nome}` : ''}! 👋 Qualquer dúvida, estarei aqui.`
    return `Olá${nome ? `, ${nome}` : ''}! 👋 Como posso te ajudar hoje?\n\nPosso responder sobre:\n• 📊 Resumo e totais de despesas\n• ⚠️ Despesas vencidas ou pendentes\n• 📄 Contratos e saldos\n• 👥 Credores cadastrados\n• 💡 Prioridades e dicas do sistema`
  }

  // ── Ajuda geral
  if (/ajuda|socorro|como funciona|o que (e|voce|tu|pode)|nao sei|nao entendo/.test(msg)) {
    return `Estou aqui para te ajudar com o SGFI! 😊\n\nPosso te auxiliar com:\n\n• **Despesas** — totais, vencidas, pendentes, pagas\n• **Contratos** — saldos disponíveis, itens consumidos\n• **Credores** — fornecedores cadastrados\n• **Relatórios** — como gerar e exportar\n• **Navegação** — "ir para despesas", "abrir contratos"\n• **Dicas** — "o que devo fazer agora?"\n\nPergunte o que quiser!`
  }

  // ── Despesas vencidas
  if (/vencid|atrasad|em atraso|overdue|nao pag.*prazo/.test(msg)) {
    if (overdue.length === 0) {
      return `✅ Ótima notícia! Não há despesas vencidas. Seu fluxo financeiro está em dia!`
    }
    const top = overdue.slice(0, 3).map(e => {
      const credor = ctx.creditors.find(c => c.id === e.creditorId)
      return `• **${e.description}** — ${formatCurrency(e.amount)} (${credor?.name ?? 'Sem credor'})`
    }).join('\n')
    const extra = overdue.length > 3 ? `\n_...e mais ${overdue.length - 3} outras._` : ''
    return `⚠️ Há **${overdue.length} despesa${overdue.length > 1 ? 's' : ''} vencida${overdue.length > 1 ? 's' : ''}**, totalizando **${formatCurrency(totalValue(overdue))}**.\n\n${top}${extra}\n\nRecomendo regularizá-las o quanto antes para evitar juros e multas. Acesse **Despesas** na barra lateral para ver todas.`
  }

  // ── Despesas pendentes
  if (/pendente|a pagar|aguardando|nao pag(?!.*prazo)/.test(msg)) {
    if (pending.length === 0) return `✅ Nenhuma despesa pendente! Todas estão pagas ou em outro status.`
    return `📋 Há **${pending.length} despesa${pending.length > 1 ? 's' : ''} pendente${pending.length > 1 ? 's' : ''}** aguardando pagamento, totalizando **${formatCurrency(totalValue(pending))}**.\n\nAcesse o módulo **Despesas** para pagar ou filtrar por pendentes.`
  }

  // ── Resumo / totais de despesas
  if (/total|soma|quanto|valor|resumo|estatistica|numeros/.test(msg)) {
    const total = totalValue(ctx.expenses)
    return `📊 **Resumo das Despesas:**\n\n• Total geral: **${formatCurrency(total)}**\n• ✅ Pagas: **${paid.length}** — ${formatCurrency(totalValue(paid))}\n• 🟡 Pendentes: **${pending.length}** — ${formatCurrency(totalValue(pending))}\n• 🔴 Vencidas: **${overdue.length}** — ${formatCurrency(totalValue(overdue))}\n• 📁 Total de registros: **${ctx.expenses.length} despesas**`
  }

  // ── Contratos
  if (/contrato|licitacao|empenho|ata|pregao|edital/.test(msg)) {
    if (ctx.contracts.length === 0) {
      return `Não há contratos cadastrados ainda. Para adicionar, clique em **"Contratos"** na barra lateral e depois em "Novo Contrato".`
    }
    const ativos = ctx.contracts.filter(c => c.status === 'active' || !c.status)
    return `📄 **Contratos:**\n\n• Total cadastrado: **${ctx.contracts.length}**\n${ativos.length ? `• Ativos: **${ativos.length}**\n` : ''}• Para consultar saldos e itens, acesse **Contratos** na barra lateral.\n\n_Dica: clique no ícone de saldo (=) em cada contrato para ver o detalhamento financeiro._`
  }

  // ── Credores / Fornecedores
  if (/credor|fornecedor|empresa|contratad|parceiro/.test(msg)) {
    if (ctx.creditors.length === 0) {
      return `Nenhum credor cadastrado. Acesse **Credores** na barra lateral para adicionar fornecedores.`
    }
    const ultimos = ctx.creditors.slice(-3).map(c => `• ${c.name}`).join('\n')
    return `👥 **Credores:** **${ctx.creditors.length}** cadastrados\n\nÚltimos cadastrados:\n${ultimos}\n\nPara gerenciar, acesse **Credores** na barra lateral.`
  }

  // ── Relatórios / exportação
  if (/relatorio|exportar|baixar|pdf|excel|planilha|imprimir|gerar/.test(msg)) {
    return `📑 **Como gerar relatórios:**\n\n1. Clique em **"Relatórios"** na barra lateral\n2. Escolha o tipo (despesas, contratos, etc.)\n3. Aplique filtros de data ou categoria\n4. Exporte em **PDF** ou **planilha Excel**\n\n_Dica: nas telas de Despesas e Contratos também há botão de exportar na lista._`
  }

  // ── Navegação
  if (/ir para|abrir|mostrar|ver|acessar|navegar/.test(msg)) {
    if (/despesa/.test(msg)) return `Para acessar as despesas, clique em **"Despesas"** na barra lateral. Lá você pode filtrar por status, data e categoria.`
    if (/contrato/.test(msg)) return `Clique em **"Contratos"** na barra lateral para acessar os contratos.`
    if (/credor|fornecedor/.test(msg)) return `Clique em **"Credores"** na barra lateral para gerenciar fornecedores.`
    if (/dashboard/.test(msg)) return `Clique em **"Dashboard"** na barra lateral para voltar ao painel principal.`
    return `Qual módulo deseja acessar? **Dashboard**, **Despesas**, **Credores** ou **Contratos**?`
  }

  // ── Prioridades / dicas
  if (/dica|sugestao|prioridade|o que (fazer|devo|tenho)|o que (e|esta) importante|foco|agenda/.test(msg)) {
    const tips: string[] = []
    if (overdue.length > 0)       tips.push(`🔴 Regularize **${overdue.length} despesa${overdue.length > 1 ? 's' : ''} vencida${overdue.length > 1 ? 's' : ''}** — total de ${formatCurrency(totalValue(overdue))}`)
    if (pending.length > 0)       tips.push(`🟡 Pague **${pending.length} despesa${pending.length > 1 ? 's' : ''} pendente${pending.length > 1 ? 's' : ''}** (${formatCurrency(totalValue(pending))})`)
    if (ctx.creditors.length === 0) tips.push(`👥 Cadastre credores/fornecedores para facilitar a gestão`)
    if (ctx.contracts.length === 0) tips.push(`📄 Cadastre contratos para controlar saldos e empenhos`)
    if (tips.length === 0) tips.push(`✅ Tudo em dia! Continue monitorando os vencimentos regularmente.`)
    return `💡 **Prioridades para hoje:**\n\n${tips.join('\n')}`
  }

  // ── Tela atual
  if (/tela atual|estou em|onde estou|modulo atual/.test(msg)) {
    const labels: Record<string, string> = {
      dashboard: 'Dashboard (Painel Principal)',
      expenses: 'Despesas',
      creditors: 'Credores',
      contratos: 'Contratos',
    }
    return `📍 Você está na tela de **${labels[ctx.activeView] ?? ctx.activeView}**. Posso te ajudar com algo específico aqui?`
  }

  // ── Fallback
  const fallbacks = [
    `Hmm, não entendi bem. Pode reformular? Posso ajudar com:\n• Despesas vencidas/pendentes\n• Totais e resumos\n• Contratos e credores\n• Relatórios e exportação\n• Dicas e prioridades`,
    `Não tenho certeza sobre isso. Tente: **"quantas despesas estão vencidas"**, **"resumo financeiro"** ou **"o que devo fazer agora"**.`,
    `Desculpe, essa pergunta está além do que sei responder localmente. Mas posso te ajudar com os módulos do SGFI — despesas, contratos, credores e relatórios!`,
  ]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

// ── OpenAI (opcional, se a chave estiver configurada) ───────────────────────
async function callOpenAI(message: string, ctx: SystemContext, apiKey: string): Promise<string> {
  const overdue = ctx.expenses.filter(e => e.status === 'overdue')
  const pending = ctx.expenses.filter(e => e.status === 'pending')

  const systemPrompt = `Você é Sofia, uma assistente de IA inteligente, amigável e prestativa do SGFI (Sistema de Gestão Financeira Integrada), um sistema de gestão financeira pública municipal brasileiro.

Estado atual do sistema:
- Tela ativa: ${ctx.activeView}
- Total de despesas: ${ctx.expenses.length} (${formatCurrency(totalValue(ctx.expenses))})
- Despesas vencidas: ${overdue.length} (${formatCurrency(totalValue(overdue))})
- Despesas pendentes: ${pending.length} (${formatCurrency(totalValue(pending))})
- Total de credores: ${ctx.creditors.length}
- Total de contratos: ${ctx.contracts.length}
- Usuário logado: ${ctx.userName ?? 'Administrador'}

Responda SEMPRE em português brasileiro. Seja concisa (máx. 200 palavras), direta e útil. Use **negrito** para destacar valores e ações importantes. Use emojis com moderação.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  })

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`)
  const data: { choices: { message: { content: string } }[] } = await response.json()
  return data.choices[0]?.message?.content ?? 'Não consegui gerar uma resposta.'
}

// ── Entry point público ──────────────────────────────────────────────────────
export async function generateAIResponse(message: string, ctx: SystemContext): Promise<string> {
  const apiKey = localStorage.getItem('sgfi-openai-key')
  if (apiKey) {
    try {
      return await callOpenAI(message, ctx, apiKey)
    } catch (e) {
      console.warn('[Sofia] OpenAI indisponível, usando resposta local:', e)
    }
  }
  // Simula uma pequena latência para parecer natural
  await new Promise(r => setTimeout(r, 400 + Math.random() * 400))
  return generateLocalResponse(message, ctx)
}
