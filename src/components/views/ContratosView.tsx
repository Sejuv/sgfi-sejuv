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
  Clock, XCircle, WarningCircle,
} from '@phosphor-icons/react'
import { Contract, Creditor, CatalogItem } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'
import { catalogItemsApi, pncpCatalogApi, type PncpCatalogItem } from '@/lib/api'
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº</TableHead>
                        <TableHead>Objeto</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Vigência</TableHead>
                        <TableHead>Itens</TableHead>
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
                          <TableRow key={contract.id}>
                            <TableCell className="font-mono font-semibold">{contract.number}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{contract.description}</TableCell>
                            <TableCell className="text-muted-foreground">{creditor?.name || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <CalendarBlank size={13} />
                                <span>{contract.startDate} → {contract.endDate}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {contract.items.length} {contract.items.length === 1 ? 'item' : 'itens'}
                              </Badge>
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
                      <Label>Descrição do item *</Label>
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

                {/* Informações PNCP */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Informações PNCP
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Catálogo PNCP</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={catalogItemForm.pncpCatalog}
                        onChange={(e) => {
                          setCatalogItemForm((f) => ({ ...f, pncpCatalog: e.target.value }))
                          setPncpQuery('')
                          setPncpResults([])
                          setShowPncpDropdown(false)
                        }}
                      >
                        <option value="CATMAT">CATMAT – Catálogo de Materiais</option>
                        <option value="CATSERV">CATSERV – Catálogo de Serviços</option>
                      </select>
                    </div>

                    <div className="grid gap-2 relative">
                      <Label>
                        Buscar no {catalogItemForm.pncpCatalog}
                        {pncpLoading && (
                          <span className="ml-2 text-xs text-muted-foreground animate-pulse">buscando...</span>
                        )}
                      </Label>
                      <Input
                        value={pncpQuery}
                        onChange={(e) => handlePncpSearch(e.target.value)}
                        onBlur={() => setTimeout(() => setShowPncpDropdown(false), 200)}
                        onFocus={() => pncpResults.length > 0 && setShowPncpDropdown(true)}
                        placeholder={`Digite 3+ letras para buscar no ${catalogItemForm.pncpCatalog}...`}
                      />
                      {showPncpDropdown && pncpResults.length > 0 && (
                        <div className="absolute z-50 top-[calc(100%+2px)] left-0 right-0 bg-background border rounded-md shadow-lg max-h-52 overflow-y-auto">
                          {pncpResults.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent focus:bg-accent border-b last:border-b-0"
                              onMouseDown={() => handleSelectPncpItem(item)}
                            >
                              <span className="font-medium">{item.codigo}</span>
                              {item.codigo && ' – '}
                              <span>{item.descricao}</span>
                              {item.unidade && (
                                <span className="ml-1 text-xs text-muted-foreground">({item.unidade})</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Ao selecionar, preenche descrição, unidade e classificação automaticamente
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label>Classificação</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={catalogItemForm.pncpClassification}
                        onChange={(e) => setCatalogItemForm((f) => ({ ...f, pncpClassification: e.target.value }))}
                      >
                        <option value="">Selecionar classificação</option>
                        {catalogItemForm.pncpCatalog === 'CATMAT' ? (
                          <>
                            <option value="10000000">10 – Material de Agricultura e Allied Products</option>
                            <option value="20000000">20 – Material de Alimentação e Bebida</option>
                            <option value="31000000">31 – Material Elétrico e Eletrônico</option>
                            <option value="39000000">39 – Material de Iluminação</option>
                            <option value="40000000">40 – Distribuição e Condicionamento</option>
                            <option value="41000000">41 – Material de Laboratório</option>
                            <option value="43000000">43 – TI e Comunicação</option>
                            <option value="44000000">44 – Material de Escritório e Expediente</option>
                            <option value="46000000">46 – Segurança e Proteção</option>
                            <option value="47000000">47 – Material de Limpeza</option>
                            <option value="48000000">48 – Material Gráfico e Fotográfico</option>
                            <option value="49000000">49 – Esporte e Lazer</option>
                            <option value="51000000">51 – Produtos Farmacêuticos e Médicos</option>
                            <option value="56000000">56 – Mobiliário</option>
                            <option value="60000000">60 – Equipamento de Transporte</option>
                            <option value="72000000">72 – Instalação e Construção</option>
                            <option value="78000000">78 – Construção Civil</option>
                          </>
                        ) : (
                          <>
                            <option value="72000000">72 – Engenharia, Pesquisa e Tecnologia</option>
                            <option value="73000000">73 – Serviços Industriais</option>
                            <option value="76000000">76 – Higiene e Limpeza</option>
                            <option value="77000000">77 – Ambiental</option>
                            <option value="78000000">78 – Construção e Reforma</option>
                            <option value="80000000">80 – Gestão e Administração</option>
                            <option value="81000000">81 – Educação e Treinamento</option>
                            <option value="82000000">82 – Editorial e Gráfico</option>
                            <option value="83000000">83 – Saúde</option>
                            <option value="84000000">84 – Financeiro</option>
                            <option value="92000000">92 – Defesa e Segurança</option>
                          </>
                        )}
                        {catalogItemForm.pncpClassification &&
                          !['10000000','20000000','31000000','39000000','40000000','41000000','43000000',
                            '44000000','46000000','47000000','48000000','49000000','51000000','56000000',
                            '60000000','72000000','73000000','76000000','77000000','78000000','80000000',
                            '81000000','82000000','83000000','84000000','92000000',
                          ].includes(catalogItemForm.pncpClassification) && (
                            <option value={catalogItemForm.pncpClassification}>
                              {catalogItemForm.pncpClassification}
                            </option>
                          )}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Subclassificação</Label>
                      <Input
                        value={catalogItemForm.pncpSubclassification}
                        onChange={(e) =>
                          setCatalogItemForm((f) => ({ ...f, pncpSubclassification: e.target.value }))
                        }
                        placeholder="Código ou nome da subclassificação"
                      />
                    </div>
                  </div>
                </div>

                {/* Especificação */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Especificação do Item
                  </h3>
                  <div className="grid gap-2">
                    <Label>Especificação</Label>
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
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Palavras-chave para Busca
                  </h3>
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
                <CardTitle className="font-display">Itens Cadastrados</CardTitle>
                <CardDescription>
                  {catalogItems.length} {catalogItems.length === 1 ? 'item disponível' : 'itens disponíveis'} para
                  seleção nos contratos
                </CardDescription>
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
    </div>
  )
}
