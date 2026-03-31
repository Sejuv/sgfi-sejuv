import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus, Trash, PencilSimple, CalendarBlank, FileText,
  BellRinging, Bell, ListBullets, Scales, CheckCircle,
  Clock, XCircle, WarningCircle, Sparkle, CircleNotch,
  CloudArrowDown, Eye,
} from '@phosphor-icons/react'
import { Contract, Creditor, CatalogItem } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'
import { catalogItemsApi, pncpCatalogApi, portalIraucubaApi, type PncpCatalogItem, type PortalPreviewItem } from '@/lib/api'
import { correctGrammar, generateKeywords } from '@/lib/ai-service'
import { toast } from 'sonner'

interface DeleteConfirm {
  type: 'expense' | 'creditor' | 'contract'
  id: string
  label: string
}

interface ContratosViewProps {
  contracts: Contract[]
  creditors: Creditor[]
  catalogItems: CatalogItem[]
  onNewContract: () => void
  onEditContract: (contract: Contract) => void
  onDeleteConfirm: (confirm: DeleteConfirm) => void
  onShowBalance: (contract: Contract) => void
  onCatalogItemsChange: (items: CatalogItem[]) => void
}

const CONTRACT_STATUS_CONFIG = {
  active:    { label: 'Vigente',   variant: 'default'     as const, Icon: CheckCircle },
  pending:   { label: 'Pendente',  variant: 'secondary'   as const, Icon: Clock },
  expired:   { label: 'Encerrado', variant: 'outline'     as const, Icon: WarningCircle },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const, Icon: XCircle },
}

const EMPTY_ITEM_FORM = () => ({
  description: '', category: '', unit: '',
  pncpCatalog: 'CATMAT',
  pncpClassification: '', pncpSubclassification: '',
  specification: '',
  keyword1: '', keyword2: '', keyword3: '', keyword4: '',
})

export function ContratosView({
  contracts,
  creditors,
  catalogItems,
  onNewContract,
  onEditContract,
  onDeleteConfirm,
  onShowBalance,
  onCatalogItemsChange,
}: ContratosViewProps) {
  // ── Catalog Item local state ──────────────────────────────
  const [catalogItemForm, setCatalogItemForm] = useState(EMPTY_ITEM_FORM())
  const [editingCatalogItem, setEditingCatalogItem] = useState<CatalogItem | null>(null)
  const [pncpQuery, setPncpQuery]           = useState('')
  const [pncpResults, setPncpResults]       = useState<PncpCatalogItem[]>([])
  const [pncpLoading, setPncpLoading]       = useState(false)
  const [showPncpDropdown, setShowPncpDropdown] = useState(false)
  const [aiLoadingDesc, setAiLoadingDesc]   = useState(false)
  const [aiLoadingSpec, setAiLoadingSpec]   = useState(false)
  const [aiLoadingKw, setAiLoadingKw]       = useState(false)

  // ── Importação do Portal de Transparência ────────────────
  const [portalLoading, setPortalLoading]       = useState(false)
  const [portalPreview, setPortalPreview]       = useState<PortalPreviewItem[] | null>(null)
  const [portalShowDialog, setPortalShowDialog] = useState(false)

  type PortalProgress = {
    active:    boolean
    done:      boolean
    error?:    string
    status:    string
    processed: number
    total:     number
    saved:     number
    skipped:   number
  }
  const PORTAL_PROGRESS_INIT: PortalProgress = {
    active: false, done: false, status: '', processed: 0, total: 0, saved: 0, skipped: 0,
  }
  const [portalProgress, setPortalProgress] = useState<PortalProgress>(PORTAL_PROGRESS_INIT)

  const handlePortalPreview = async () => {
    setPortalLoading(true)
    try {
      const { items, total } = await portalIraucubaApi.preview()
      setPortalPreview(items)
      setPortalShowDialog(true)
      toast.success(`${total} itens encontrados no portal`)
    } catch (e: any) {
      toast.error(`Erro ao acessar portal: ${e.message}`)
    } finally {
      setPortalLoading(false)
    }
  }

  const handlePortalImportStream = async () => {
    setPortalShowDialog(false)
    setPortalPreview(null)
    setPortalProgress({ ...PORTAL_PROGRESS_INIT, active: true, status: 'Iniciando...' })

    try {
      const response = await portalIraucubaApi.importStream()
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as any).error || `HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.type === 'status') {
              setPortalProgress(p => ({ ...p, status: ev.message }))
            } else if (ev.type === 'total') {
              setPortalProgress(p => ({ ...p, total: ev.total, status: 'Importando itens...' }))
            } else if (ev.type === 'progress') {
              setPortalProgress(p => ({ ...p, processed: ev.processed, saved: ev.saved, skipped: ev.skipped }))
            } else if (ev.type === 'done') {
              setPortalProgress(p => ({ ...p, processed: ev.processed, saved: ev.saved, skipped: ev.skipped, done: true, status: 'Concluído!' }))
              const updatedItems = await catalogItemsApi.list()
              onCatalogItemsChange(updatedItems)
            } else if (ev.type === 'error') {
              throw new Error(ev.message)
            }
          } catch { /* linha malformada */ }
        }
      }
    } catch (e: any) {
      setPortalProgress(p => ({ ...p, error: e.message, status: 'Erro na importação' }))
    }
  }

  // Efeito de digitação ao aplicar correção da IA
  const typewriter = async (text: string, setter: (val: string) => void, speed = 16) => {
    setter('')
    for (let i = 1; i <= text.length; i++) {
      setter(text.slice(0, i))
      await new Promise(r => setTimeout(r, speed))
    }
  }

  // ── Contract alerts ───────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeAlerts: { contract: Contract; type: 'new' | 'additive'; daysLeft: number }[] = []
  contracts.forEach((c) => {
    if (c.status === 'expired' || c.status === 'cancelled') return
    const end = new Date(c.endDate)
    end.setHours(0, 0, 0, 0)
    const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000)
    if (c.alertNewContract != null && daysLeft <= c.alertNewContract && daysLeft >= 0)
      activeAlerts.push({ contract: c, type: 'new', daysLeft })
    if (c.alertAdditive != null && daysLeft <= c.alertAdditive && daysLeft >= 0)
      activeAlerts.push({ contract: c, type: 'additive', daysLeft })
  })

  const balanceAlerts: { contract: Contract; item: Contract['items'][0]; pctRemaining: number }[] = []
  contracts.forEach((c) => {
    if (c.status === 'expired' || c.status === 'cancelled') return
    c.items.forEach((item) => {
      if (item.quantity === 0) return
      const consumed = item.consumed ?? 0
      const pctRemaining = (item.quantity - consumed) / item.quantity
      if (pctRemaining <= 0.3) balanceAlerts.push({ contract: c, item, pctRemaining })
    })
  })

  const totalContractValue = contracts.reduce(
    (acc, c) => acc + c.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    0
  )

  // ── PNCP search ───────────────────────────────────────────
  const handlePncpSearch = async (q: string) => {
    setPncpQuery(q)
    if (q.length < 3) { setPncpResults([]); setShowPncpDropdown(false); return }
    setPncpLoading(true)
    try {
      const tipo = catalogItemForm.pncpCatalog === 'CATSERV' ? 'servico' : 'material'
      const { itens } = await pncpCatalogApi.search(q, tipo)
      setPncpResults(itens)
      setShowPncpDropdown(itens.length > 0)
    } catch { setPncpResults([]) }
    finally { setPncpLoading(false) }
  }

  const handleSelectPncpItem = (item: PncpCatalogItem) => {
    setCatalogItemForm((f) => ({
      ...f,
      description:           item.descricao,
      unit:                  item.unidade || f.unit,
      pncpClassification:    item.classe || f.pncpClassification,
      pncpSubclassification: item.subclasse || f.pncpSubclassification,
    }))
    setPncpQuery(item.descricao)
    setShowPncpDropdown(false)
  }

  // ── Catalog CRUD ──────────────────────────────────────────
  const handleSaveCatalogItem = async () => {
    if (!catalogItemForm.description.trim()) { toast.error('Descrição obrigatória'); return }
    const payload = {
      description:           catalogItemForm.description,
      category:              catalogItemForm.category || undefined,
      unit:                  catalogItemForm.unit || 'UN',
      unitPrice:             0,
      pncpCatalog:           catalogItemForm.pncpCatalog || undefined,
      pncpClassification:    catalogItemForm.pncpClassification || undefined,
      pncpSubclassification: catalogItemForm.pncpSubclassification || undefined,
      specification:         catalogItemForm.specification || undefined,
      keyword1:              catalogItemForm.keyword1 || undefined,
      keyword2:              catalogItemForm.keyword2 || undefined,
      keyword3:              catalogItemForm.keyword3 || undefined,
      keyword4:              catalogItemForm.keyword4 || undefined,
    }
    try {
      if (editingCatalogItem) {
        const updated = await catalogItemsApi.update(editingCatalogItem.id, payload)
        onCatalogItemsChange(catalogItems.map((i) => (i.id === updated.id ? updated : i)))
        toast.success('Item atualizado!')
      } else {
        const saved = await catalogItemsApi.create({ id: `cat_${Date.now()}`, ...payload })
        onCatalogItemsChange([...catalogItems, saved])
        toast.success('Item cadastrado!')
      }
      setCatalogItemForm(EMPTY_ITEM_FORM())
      setEditingCatalogItem(null)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteCatalogItem = async (id: string) => {
    try {
      await catalogItemsApi.remove(id)
      onCatalogItemsChange(catalogItems.filter((i) => i.id !== id))
      toast.success('Item excluído')
    } catch (e: any) { toast.error(e.message) }
  }

  const handleEditCatalogItem = (item: CatalogItem) => {
    setEditingCatalogItem(item)
    setPncpQuery(item.description)
    setCatalogItemForm({
      description:           item.description,
      category:              item.category || '',
      unit:                  item.unit,
      pncpCatalog:           item.pncpCatalog || 'CATMAT',
      pncpClassification:    item.pncpClassification || '',
      pncpSubclassification: item.pncpSubclassification || '',
      specification:         item.specification || '',
      keyword1:              item.keyword1 || '',
      keyword2:              item.keyword2 || '',
      keyword3:              item.keyword3 || '',
      keyword4:              item.keyword4 || '',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Contratos</h1>
        <p className="text-muted-foreground mt-1">Gestão de contratos institucionais</p>
      </div>

      {/* Alertas de prazo */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                alert.type === 'new'
                  ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20'
                  : 'border-blue-300 bg-blue-50 dark:bg-blue-950/20'
              }`}
            >
              <BellRinging
                size={18}
                weight="duotone"
                className={alert.type === 'new' ? 'text-orange-500 mt-0.5 shrink-0' : 'text-blue-500 mt-0.5 shrink-0'}
              />
              <div className="flex-1 text-sm">
                <span className="font-semibold">
                  {alert.type === 'new' ? 'Nova Contratação' : 'Aditivo de Prazo'}
                </span>
                {' — '}
                <span>
                  Contrato <strong>{alert.contract.number}</strong> ({alert.contract.description}) vence em{' '}
                  <strong>
                    {alert.daysLeft === 0 ? 'hoje' : `${alert.daysLeft} dia${alert.daysLeft > 1 ? 's' : ''}`}
                  </strong>{' '}
                  ({new Date(alert.contract.endDate).toLocaleDateString('pt-BR')})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alertas de saldo */}
      {balanceAlerts.length > 0 && (
        <div className="space-y-1.5">
          {balanceAlerts.map((ba, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 px-4 py-3"
            >
              <Scales size={18} weight="duotone" className="text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-red-700">Saldo baixo: </span>
                Contrato <strong>{ba.contract.number}</strong> — item <strong>{ba.item.description}</strong>:{' '}
                <span className="font-bold text-red-700">
                  {ba.pctRemaining <= 0
                    ? 'saldo esgotado!'
                    : `apenas ${(ba.pctRemaining * 100).toFixed(0)}% restante (${(
                        ba.item.quantity - (ba.item.consumed ?? 0)
                      ).toFixed(2)} ${ba.item.unit})`}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-xs border-red-300"
                onClick={() => onShowBalance(ba.contract)}
              >
                Ver Saldo
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{contracts.length}</div>
            <p className="text-xs text-muted-foreground">
              {contracts.filter((c) => c.status === 'active').length} vigentes
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display tabular-nums">
              {formatCurrency(totalContractValue)}
            </div>
            <p className="text-xs text-muted-foreground">Soma de todos os contratos</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contratos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">
              {contracts.filter((c) => c.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando assinatura/início</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contratos">
        <TabsList>
          <TabsTrigger value="contratos" className="gap-1.5">
            <FileText size={14} />Contratos
          </TabsTrigger>
          <TabsTrigger value="itens" className="gap-1.5">
            <ListBullets size={14} />Itens de Catálogo
          </TabsTrigger>
        </TabsList>

        {/* ── Aba Contratos ── */}
        <TabsContent value="contratos" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">Lista de Contratos</CardTitle>
                  <CardDescription>Cadastre e gerencie contratos com seus itens</CardDescription>
                </div>
                <Button onClick={onNewContract}>
                  <Plus className="mr-2" size={18} weight="bold" />
                  Novo Contrato
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText size={56} className="mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">Nenhum contrato cadastrado</p>
                  <p className="text-sm mt-1">Clique em "Novo Contrato" para começar.</p>
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº</TableHead>
                        <TableHead>Objeto</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Vigência</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Alertas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract) => {
                        const cfg = CONTRACT_STATUS_CONFIG[contract.status]
                        const creditor = creditors.find((c) => c.id === contract.creditorId)
                        const total = contract.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
                        const end = new Date(contract.endDate)
                        end.setHours(0, 0, 0, 0)
                        const dl = Math.ceil((end.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)

                        const alertBadges: ReactNode[] = []
                        if (contract.alertNewContract != null && dl <= contract.alertNewContract && dl >= 0)
                          alertBadges.push(
                            <Badge key="new" variant="outline" className="border-orange-400 text-orange-600 text-[10px] gap-1">
                              <BellRinging size={10} weight="fill" />
                              Nova ({dl}d)
                            </Badge>
                          )
                        if (contract.alertAdditive != null && dl <= contract.alertAdditive && dl >= 0)
                          alertBadges.push(
                            <Badge key="add" variant="outline" className="border-blue-400 text-blue-600 text-[10px] gap-1">
                              <Bell size={10} weight="fill" />
                              Aditivo ({dl}d)
                            </Badge>
                          )
                        if (contract.alertNewContract != null && alertBadges.length === 0)
                          alertBadges.push(
                            <span key="cfg" className="text-xs text-muted-foreground">
                              {contract.alertNewContract}d / {contract.alertAdditive ?? '—'}d
                            </span>
                          )

                        return (
                          <TableRow key={contract.id} className="align-top">
                            <TableCell className="font-mono font-semibold whitespace-normal break-words min-w-[110px]">{contract.number}</TableCell>
                            <TableCell className="whitespace-normal break-words min-w-[160px]">{contract.description}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-normal break-words min-w-[160px]">{creditor?.name || '—'}</TableCell>
                            <TableCell className="min-w-[130px]">
                              <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1"><CalendarBlank size={13} /><span>{contract.startDate}</span></div>
                                <div className="pl-[17px] text-xs">→ {contract.endDate}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                              {formatCurrency(total)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={cfg.variant}>
                                <cfg.Icon size={12} className="mr-1" />
                                {cfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {alertBadges.length
                                  ? alertBadges
                                  : <span className="text-xs text-muted-foreground">—</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs gap-1 border-primary/40"
                                  onClick={() => onShowBalance(contract)}
                                  title="Controle de saldo"
                                >
                                  <Scales size={14} />
                                  Saldo
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => onEditContract(contract)}>
                                  <PencilSimple size={15} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onDeleteConfirm({
                                      type: 'contract',
                                      id: contract.id,
                                      label: `${contract.number} – ${contract.description}`,
                                    })
                                  }
                                >
                                  <Trash size={15} className="text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Aba Itens de Catálogo ── */}
        <TabsContent value="itens" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingCatalogItem ? 'Editar Item de Catálogo' : 'Cadastrar Item de Catálogo'}
                </CardTitle>
                <CardDescription>
                  Itens cadastrados aqui ficam disponíveis para seleção ao criar contratos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações Principais */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Informações Principais
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-12">
                    <div className="sm:col-span-12 grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label>Descrição do item *</Label>
                        <button
                          type="button"
                          disabled={aiLoadingDesc || !catalogItemForm.description.trim()}
                          onClick={async () => {
                            setAiLoadingDesc(true)
                            try {
                              const corrected = await correctGrammar(catalogItemForm.description)
                              await typewriter(corrected, (val) => setCatalogItemForm(f => ({ ...f, description: val })))
                              toast.success('Descrição corrigida pela IA!')
                            } catch { toast.error('Erro ao corrigir com IA') }
                            finally { setAiLoadingDesc(false) }
                          }}
                          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/30 disabled:opacity-40 transition-colors"
                        >
                          {aiLoadingDesc ? <CircleNotch size={11} className="animate-spin" /> : <Sparkle size={11} weight="fill" />}
                          Corrigir com IA
                        </button>
                      </div>
                      <Input
                        value={catalogItemForm.description}
                        onChange={(e) => setCatalogItemForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Descreva o item ou serviço"
                      />
                    </div>
                    <div className="sm:col-span-5 grid gap-2">
                      <Label>Categoria</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={catalogItemForm.category}
                        onChange={(e) => setCatalogItemForm((f) => ({ ...f, category: e.target.value }))}
                      >
                        <option value="">Selecione uma categoria</option>
                        <option value="Material de Consumo">Material de Consumo</option>
                        <option value="Material Permanente">Material Permanente</option>
                        <option value="Serviços em Geral">Serviços em Geral</option>
                        <option value="Obras e Reformas">Obras e Reformas</option>
                        <option value="Tecnologia da Informação">Tecnologia da Informação</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Transporte / Combustível">Transporte / Combustível</option>
                        <option value="Limpeza e Higiene">Limpeza e Higiene</option>
                        <option value="Alimentação">Alimentação</option>
                        <option value="Mobiliário">Mobiliário</option>
                        <option value="Segurança">Segurança</option>
                        <option value="Consultoria / Assessoria">Consultoria / Assessoria</option>
                        <option value="Engenharia">Engenharia</option>
                        <option value="Comunicação">Comunicação</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3 grid gap-2">
                      <Label>Unid. de Medida</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={catalogItemForm.unit}
                        onChange={(e) => setCatalogItemForm((f) => ({ ...f, unit: e.target.value }))}
                      >
                        <option value="">Unidade</option>
                        <option value="UN">UN – Unidade</option>
                        <option value="CX">CX – Caixa</option>
                        <option value="PCT">PCT – Pacote</option>
                        <option value="KG">KG – Quilograma</option>
                        <option value="G">G – Grama</option>
                        <option value="L">L – Litro</option>
                        <option value="ML">ML – Mililitro</option>
                        <option value="M">M – Metro</option>
                        <option value="M2">M² – Metro quadrado</option>
                        <option value="M3">M³ – Metro cúbico</option>
                        <option value="H">H – Hora</option>
                        <option value="DIA">DIA – Dia</option>
                        <option value="MES">MÊS – Mês</option>
                        <option value="RESMA">RESMA – Resma</option>
                        <option value="PAR">PAR – Par</option>
                        <option value="JOGO">JOGO – Jogo</option>
                        <option value="KIT">KIT – Kit</option>
                        <option value="SV">SV – Serviço</option>
                        <option value="DIARIA">DIÁRIA</option>
                        <option value="KM">KM – Quilômetro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Especificação */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Especificação do Item
                  </h3>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Especificação</Label>
                      <button
                        type="button"
                        disabled={aiLoadingSpec || !catalogItemForm.specification.trim()}
                        onClick={async () => {
                          setAiLoadingSpec(true)
                          try {
                            const corrected = await correctGrammar(catalogItemForm.specification)
                            await typewriter(corrected, (val) => setCatalogItemForm(f => ({ ...f, specification: val })))
                            toast.success('Especificação corrigida pela IA!')
                          } catch { toast.error('Erro ao corrigir com IA') }
                          finally { setAiLoadingSpec(false) }
                        }}
                        className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/30 disabled:opacity-40 transition-colors"
                      >
                        {aiLoadingSpec ? <CircleNotch size={11} className="animate-spin" /> : <Sparkle size={11} weight="fill" />}
                        Corrigir com IA
                      </button>
                    </div>
                    <textarea
                      className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      value={catalogItemForm.specification}
                      onChange={(e) => setCatalogItemForm((f) => ({ ...f, specification: e.target.value }))}
                      placeholder="Descreva detalhadamente as especificações do item..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Palavras-chave */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Palavras-chave para Busca
                    </h3>
                    <button
                      type="button"
                      disabled={aiLoadingKw || !catalogItemForm.specification.trim()}
                      onClick={async () => {
                        setAiLoadingKw(true)
                        try {
                          const kws = await generateKeywords(catalogItemForm.specification || catalogItemForm.description)
                          setCatalogItemForm(f => ({ ...f, keyword1: kws[0] ?? '', keyword2: kws[1] ?? '', keyword3: kws[2] ?? '', keyword4: kws[3] ?? '' }))
                          toast.success('Palavras-chave geradas pela IA!')
                        } catch { toast.error('Erro ao gerar palavras-chave') }
                        finally { setAiLoadingKw(false) }
                      }}
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/30 disabled:opacity-40 transition-colors"
                    >
                      {aiLoadingKw ? <CircleNotch size={11} className="animate-spin" /> : <Sparkle size={11} weight="fill" />}
                      Gerar com IA
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-4">
                    {(['keyword1', 'keyword2', 'keyword3', 'keyword4'] as const).map((k, i) => (
                      <div key={k} className="grid gap-2">
                        <Label>Palavra {i + 1}</Label>
                        <Input
                          value={catalogItemForm[k]}
                          onChange={(e) => setCatalogItemForm((f) => ({ ...f, [k]: e.target.value }))}
                          placeholder={`Palavra-chave ${i + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t">
                  {editingCatalogItem && (
                    <Button
                      variant="outline"
                      onClick={() => { setEditingCatalogItem(null); setCatalogItemForm(EMPTY_ITEM_FORM()) }}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button onClick={handleSaveCatalogItem}>
                    <Plus size={16} className="mr-1" weight="bold" />
                    {editingCatalogItem ? 'Salvar Alterações' : 'Cadastrar Item'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de itens cadastrados */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-display">Itens Cadastrados</CardTitle>
                    <CardDescription>
                      {catalogItems.length} {catalogItems.length === 1 ? 'item disponível' : 'itens disponíveis'} para
                      seleção nos contratos
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      disabled={portalLoading}
                      onClick={handlePortalPreview}
                    >
                      {portalLoading
                        ? <CircleNotch size={14} className="animate-spin" />
                        : <Eye size={14} />}
                      Prévia do Portal
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs"
                      disabled={portalLoading}
                      onClick={handlePortalImportStream}
                    >
                      <CloudArrowDown size={14} />
                      Importar do Portal
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {catalogItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ListBullets size={48} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhum item cadastrado</p>
                    <p className="text-sm mt-1">Use o formulário acima para cadastrar itens do catálogo.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>Classificação PNCP</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catalogItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium max-w-[220px] truncate">
                              {item.description}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{item.category || '—'}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">
                              {item.pncpClassification || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCatalogItem(item)}
                                >
                                  <PencilSimple size={15} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCatalogItem(item.id)}
                                >
                                  <Trash size={15} className="text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialog de Prévia do Portal ── */}
      {portalShowDialog && portalPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold font-display">Prévia — Portal de Transparência</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {portalPreview.length} {portalPreview.length === 1 ? 'item encontrado' : 'itens encontrados'} em
                  {' '}transparencia.acontratacao.com.br/pmiraucuba/itens
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPortalShowDialog(false)}>
                <XCircle size={18} />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Descrição</th>
                    <th className="text-left py-2 px-3 font-medium">Categoria</th>
                    <th className="text-left py-2 px-3 font-medium">Unidade</th>
                    <th className="text-left py-2 px-3 font-medium">Especificação</th>
                  </tr>
                </thead>
                <tbody>
                  {portalPreview.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="py-1.5 px-3 max-w-[200px] truncate" title={item.descricao}>{item.descricao || '—'}</td>
                      <td className="py-1.5 px-3 text-muted-foreground">{item.categoria || '—'}</td>
                      <td className="py-1.5 px-3">{item.unidade || '—'}</td>
                      <td className="py-1.5 px-3 max-w-[200px] truncate text-muted-foreground" title={item.especificacao}>{item.especificacao || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setPortalShowDialog(false)}>Cancelar</Button>
              <Button onClick={handlePortalImportStream}>
                <CloudArrowDown size={14} className="mr-2" />Confirmar Importação
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Progresso da Importação ── */}
      {portalProgress.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            {/* Cabeçalho */}
            <div className="flex items-center gap-3">
              {portalProgress.done && !portalProgress.error
                ? <CheckCircle size={24} weight="fill" className="text-green-500 shrink-0" />
                : portalProgress.error
                  ? <XCircle size={24} weight="fill" className="text-destructive shrink-0" />
                  : <CircleNotch size={24} className="animate-spin text-primary shrink-0" />}
              <div>
                <h2 className="text-base font-semibold font-display">
                  {portalProgress.done && !portalProgress.error
                    ? 'Importação concluída!'
                    : portalProgress.error
                      ? 'Erro na importação'
                      : 'Importando itens do portal...'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{portalProgress.status}</p>
              </div>
            </div>

            {/* Barra de progresso */}
            {portalProgress.total > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{portalProgress.processed.toLocaleString('pt-BR')} de {portalProgress.total.toLocaleString('pt-BR')} itens</span>
                  <span>{Math.round((portalProgress.processed / portalProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.round((portalProgress.processed / portalProgress.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Contadores */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <div className="text-xl font-bold font-display tabular-nums">
                  {portalProgress.processed.toLocaleString('pt-BR')}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Processados</div>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 px-3 py-2">
                <div className="text-xl font-bold font-display tabular-nums text-green-600 dark:text-green-400">
                  {portalProgress.saved.toLocaleString('pt-BR')}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Salvos</div>
              </div>
              <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 px-3 py-2">
                <div className="text-xl font-bold font-display tabular-nums text-orange-500">
                  {portalProgress.skipped.toLocaleString('pt-BR')}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Duplicatas</div>
              </div>
            </div>

            {/* Erro */}
            {portalProgress.error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {portalProgress.error}
              </div>
            )}

            {/* Botão fechar (só aparece ao terminar) */}
            {(portalProgress.done || portalProgress.error) && (
              <div className="flex justify-end pt-1">
                <Button onClick={() => setPortalProgress(PORTAL_PROGRESS_INIT)}>
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
