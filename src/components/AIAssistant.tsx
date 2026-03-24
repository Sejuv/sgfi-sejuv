import { useState, useRef, useEffect } from 'react'
import { Expense, Creditor, Contract } from '@/lib/types'
import { PaperPlaneRight, Minus, X, Sparkle } from '@phosphor-icons/react'
import { useTheme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'
import { generateAIResponse } from '@/lib/ai-service'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: Date
}

export interface AIAssistantProps {
  activeView: string
  expenses: Expense[]
  creditors: Creditor[]
  contracts: Contract[]
  userName?: string
}

// ── Avatar da IA (imagem real) ───────────────────────────────────────────────
function SofiaAvatar({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/IA SGFI.png"
      alt="Sofia"
      width={size}
      height={size}
      className={cn('shrink-0 rounded-full object-cover object-top', className)}
      style={{ width: size, height: size }}
    />
  )
}

// ── Indicador de digitação ───────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full bg-primary/50"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.18}s infinite` }}
        />
      ))}
    </div>
  )
}

// ── Renderizador de markdown básico ─────────────────────────────────────────
function MessageContent({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-0.5 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        const parts = line.split(/(\*\*[^*]+\*\*)/)
        return (
          <p key={i} className={cn('text-sm', line.startsWith('•') && 'pl-1')}>
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        )
      })}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export function AIAssistant({ activeView, expenses, creditors, contracts, userName }: AIAssistantProps) {
  const { isDark } = useTheme()
  const [isOpen, setIsOpen]           = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages]       = useState<Message[]>([])
  const [input, setInput]             = useState('')
  const [isTyping, setIsTyping]       = useState(false)
  const [hasBadge, setHasBadge]       = useState(false)
  const messagesEndRef                = useRef<HTMLDivElement>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)
  const prevViewRef                   = useRef(activeView)

  // ── Saudação inicial ao abrir ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || messages.length > 0) return
    const overdue = expenses.filter(e => e.status === 'overdue').length
    const nome = userName?.split(' ')[0]
    let greeting = `Olá${nome ? `, ${nome}` : ''}! 👋 Sou a **Sofia**, sua assistente inteligente do SGFI.\n\n`
    if (overdue > 0) {
      greeting += `⚠️ Detectei **${overdue} despesa${overdue > 1 ? 's' : ''} vencida${overdue > 1 ? 's' : ''}** que precisam de atenção.\n\n`
    } else {
      greeting += `✅ Nenhuma pendência crítica no momento.\n\n`
    }
    greeting += `Como posso ajudar? Pergunte sobre despesas, contratos, relatórios ou peça dicas!`
    setMessages([{ id: 'welcome', role: 'assistant', content: greeting, time: new Date() }])
  }, [isOpen, messages.length, expenses, userName])

  // ── Comentário proativo ao trocar de tela ────────────────────────────────
  useEffect(() => {
    if (!isOpen || isMinimized || prevViewRef.current === activeView) return
    prevViewRef.current = activeView
    const tips: Record<string, string> = {
      dashboard:  '📊 Você abriu o **Dashboard** — visão geral do sistema.',
      expenses:   '💰 Tela de **Despesas**. Aqui você gerencia todos os lançamentos, filtra por status e exporta.',
      creditors:  '👥 Tela de **Credores**. Gerencie seus fornecedores e parceiros.',
      contratos:  '📄 Tela de **Contratos**. Monitore saldos, itens e vigências.',
    }
    const tip = tips[activeView]
    if (tip) {
      setMessages(prev => [...prev, {
        id: `nav-${Date.now()}`,
        role: 'assistant',
        content: tip,
        time: new Date(),
      }])
    }
  }, [activeView, isOpen, isMinimized])

  // ── Badge proativo (despesas vencidas) ──────────────────────────────────
  useEffect(() => {
    if (!isOpen && expenses.some(e => e.status === 'overdue')) {
      setHasBadge(true)
    }
  }, [expenses, isOpen])

  // ── Scroll automático ────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Foco no input ao abrir ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [isOpen, isMinimized])

  // ── Enviar mensagem ──────────────────────────────────────────────────────
  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text || isTyping) return
    if (!textOverride) setInput('')

    setMessages(prev => [...prev, {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      time: new Date(),
    }])
    setIsTyping(true)

    try {
      const response = await generateAIResponse(text, { activeView, expenses, creditors, contracts, userName })
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response,
        time: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro inesperado. Por favor, tente novamente.',
        time: new Date(),
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setHasBadge(false)
  }

  const quickPrompts = [
    '📊 Resumo financeiro',
    '⚠️ Despesas vencidas',
    '💡 O que devo fazer agora?',
    '📄 Status dos contratos',
  ]

  return (
    <>
      {/* ── Botão flutuante ───────────────────────────────────────────────── */}
      {!isOpen && (
        <div className="fixed bottom-12 right-5 z-50">
          <div className="relative group">
            <button
              onClick={handleOpen}
              title="Sofia — Assistente IA"
              className="relative rounded-full shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              aria-label="Abrir assistente Sofia"
            >
              <SofiaAvatar size={56} className="rounded-full" />
              {/* Anel de pulso */}
              <span className="absolute inset-0 rounded-full ring-2 ring-violet-400/50 animate-[ping_2.5s_ease-in-out_infinite]" />
            </button>

            {/* Badge de notificação */}
            {hasBadge && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-background shadow">
                !
              </span>
            )}

            {/* Tooltip */}
            <div className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-popover border border-border px-2.5 py-1.5 shadow-lg text-xs font-medium text-popover-foreground">
                <Sparkle size={12} weight="fill" className="text-violet-500" />
                Sofia — Assistente IA
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Painel de chat ────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-12 right-5 z-50 flex flex-col rounded-2xl shadow-2xl border border-border/80 overflow-hidden',
            'transition-all duration-300 ease-out',
            isDark ? 'bg-[oklch(0.17_0.025_255)]' : 'bg-white/98',
            isMinimized ? 'h-14 w-72' : 'h-[510px] w-[340px]',
          )}
          style={{ backdropFilter: 'blur(16px)' }}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div
            className="flex items-center gap-2.5 px-3 py-2 border-b border-border/60 shrink-0"
            style={{ background: isDark
              ? 'linear-gradient(135deg, oklch(0.22 0.04 270 / 0.8), oklch(0.20 0.04 250 / 0.8))'
              : 'linear-gradient(135deg, #ede9fe, #dbeafe)' }}
          >
            <SofiaAvatar size={34} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight tracking-tight">Sofia</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-muted-foreground">Assistente IA · Online</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setIsMinimized(m => !m)}
                title={isMinimized ? 'Expandir' : 'Minimizar'}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/10 transition-colors"
              >
                <Minus size={13} />
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsMinimized(false) }}
                title="Fechar"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/10 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ── Corpo (só se não minimizado) ────────────────────────────── */}
          {!isMinimized && (
            <>
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn('flex gap-2 items-end', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                  >
                    {msg.role === 'assistant' && <SofiaAvatar size={22} />}
                    <div
                      className={cn(
                        'max-w-[87%] rounded-2xl px-3 py-2',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : isDark
                            ? 'bg-white/8 rounded-bl-sm'
                            : 'bg-slate-100 rounded-bl-sm',
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <MessageContent text={msg.content} />
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      <p className={cn('text-[10px] mt-1 opacity-55 select-none', msg.role === 'user' ? 'text-right' : 'text-left')}>
                        {msg.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Indicador de digitação */}
                {isTyping && (
                  <div className="flex gap-2 items-end">
                    <SofiaAvatar size={22} />
                    <div className={cn('rounded-2xl rounded-bl-sm px-3 py-2', isDark ? 'bg-white/8' : 'bg-slate-100')}>
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick prompts (só na abertura) */}
              {messages.length <= 1 && !isTyping && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
                  {quickPrompts.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className={cn(
                        'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
                        isDark
                          ? 'border-white/15 text-muted-foreground hover:text-foreground hover:border-violet-500/50 hover:bg-violet-500/10'
                          : 'border-slate-200 text-muted-foreground hover:text-foreground hover:border-violet-300 hover:bg-violet-50',
                      )}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 pb-3 pt-1 border-t border-border/50 shrink-0">
                <div className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 transition-all',
                  'focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-400/50',
                  isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200',
                )}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Pergunte algo para Sofia…"
                    disabled={isTyping}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
                    autoComplete="off"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isTyping}
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/90 transition-colors shrink-0"
                    title="Enviar"
                  >
                    <PaperPlaneRight size={14} weight="fill" />
                  </button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground/40 mt-1.5 select-none">
                  Sofia · IA integrada ao SGFI
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
