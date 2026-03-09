import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Wallet, Trash, Drop, Lightning, PencilSimple, FunnelSimple, X } from '@phosphor-icons/react'
import { Expense, Creditor, Category, Contract } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/calculations'

interface DeleteConfirm {
  type: 'expense' | 'creditor' | 'contract'
  id: string
  label: string
}

interface ExpensesViewProps {
  expenses: Expense[]
  creditors: Creditor[]
  categories?: Category[]
  contracts?: Contract[]
  onNewExpense: () => void
  onEditExpense: (expense: Expense) => void
  onToggleStatus: (id: string) => void
  onDeleteConfirm: (confirm: DeleteConfirm) => void
}

const ClassificationBadge = ({ classification }: { classification?: string }) => {
  if (!classification || classification === 'outros') return null
  if (classification === 'agua') {
    return (
      <Badge variant="outline" className="gap-1 border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/20 text-[10px] py-0">
        <Drop size={10} weight="fill" />
        Água
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 border-yellow-400 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 text-[10px] py-0">
      <Lightning size={10} weight="fill" />
      Energia
    </Badge>
  )
}

/** Converte "0023/2026" em número comparável: 20260023 */
function expenseNumberSortKey(num?: string): number {
  if (!num) return Number.MAX_SAFE_INTEGER
  const match = num.match(/^(\d+)\/(\d+)$/)
  if (!match) return Number.MAX_SAFE_INTEGER
  const seq = parseInt(match[1], 10)
  const year = parseInt(match[2], 10)
  return year * 1_000_000 + seq
}

// ─── Tabela com colunas redimensionáveis ──────────────────────────────────────
// Percentuais somam 100% — a tabela sempre ocupa toda a largura disponível
// Índices: 0=Nº  1=Descrição  2=Credor  3=Valor  4=Tipo  5=Vencimento  6=Mês  7=Status  8=Ações
const DEFAULT_COL_PCTS = [9, 24, 15, 9, 7, 9, 7, 9, 11]

interface ResizableProps {
  sortedFiltered: Expense[]
  creditors: Creditor[]
  onEditExpense: (e: Expense) => void
  onToggleStatus: (id: string) => void
  onDeleteConfirm: (c: { type: 'expense' | 'creditor' | 'contract'; id: string; label: string }) => void
}

function ResizableExpensesTable({
  sortedFiltered, creditors, onEditExpense, onToggleStatus, onDeleteConfirm,
}: ResizableProps) {
  const [colPcts, setColPcts] = useState<number[]>([...DEFAULT_COL_PCTS])
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<{ col: number; startX: number; startPct: number; nextPct: number; containerW: number } | null>(null)

  const onMouseDown = useCallback((col: number, e: React.MouseEvent) => {
    e.preventDefault()
    const containerW = containerRef.current?.getBoundingClientRect().width ?? 1000
    dragging.current = { col, startX: e.clientX, startPct: colPcts[col], nextPct: colPcts[col + 1], containerW }

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const deltaPct = ((ev.clientX - dragging.current.startX) / dragging.current.containerW) * 100
      const newCur = Math.max(3, dragging.current.startPct + deltaPct)
      const newNext = Math.max(3, dragging.current.nextPct - deltaPct)
      setColPcts(prev => {
        const next = [...prev]
        next[dragging.current!.col] = newCur
        next[dragging.current!.col + 1] = newNext
        return next
      })
    }
    const onUp = () => {
      dragging.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [colPcts])

  const headers = ['Nº Despesa', 'Descrição', 'Credor', 'Valor', 'Tipo', 'Vencimento', 'Mês', 'Status', 'Ações']

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <table style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          {colPcts.map((pct, i) => <col key={i} style={{ width: pct + '%' }} />)}
        </colgroup>
        <thead>
          <tr className="border-b">
            {headers.map((h, i) => (
              <th
                key={i}
                className="relative px-3 py-3 text-left text-sm font-medium text-muted-foreground select-none bg-background overflow-hidden"
              >
                <span className="block truncate">{h}</span>
                {i < headers.length - 1 && (
                  <span
                    onMouseDown={(e) => onMouseDown(i, e)}
                    className="absolute top-0 right-0 h-full w-2 cursor-col-resize flex items-center justify-center group z-10"
                    title="Arraste para redimensionar"
                  >
                    <span className="w-px h-4 bg-border group-hover:bg-primary group-hover:w-0.5 transition-all" />
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedFiltered.map((expense) => {
            const creditor = creditors.find((c) => c.id === expense.creditorId)
            return (
              <tr key={expense.id} className="border-b hover:bg-muted/50 transition-colors">
                {/* Nº Despesa — sem quebra */}
                <td className="px-3 py-2 align-top overflow-hidden whitespace-nowrap">
                  <span className="font-mono text-sm font-semibold text-primary">
                    {expense.number || '—'}
                  </span>
                </td>
                {/* Descrição — quebra de texto */}
                <td className="px-3 py-2 align-top font-medium overflow-hidden">
                  <div className="flex flex-col gap-0.5">
                    <span className="whitespace-normal break-words leading-snug text-sm">{expense.description}</span>
                    <ClassificationBadge classification={expense.classification} />
                  </div>
                </td>
                {/* Credor — quebra de texto */}
                <td className="px-3 py-2 align-top text-sm overflow-hidden">
                  <span className="whitespace-normal break-words leading-snug">{creditor?.name || '-'}</span>
                </td>
                {/* Valor — sem quebra */}
                <td className="px-3 py-2 align-top tabular-nums font-semibold text-sm overflow-hidden whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </td>
                {/* Tipo — sem quebra */}
                <td className="px-3 py-2 align-top overflow-hidden whitespace-nowrap">
                  <Badge variant="outline" className="text-xs">
                    {expense.type === 'fixed' ? 'Fixa' : 'Variável'}
                  </Badge>
                </td>
                {/* Vencimento — sem quebra */}
                <td className="px-3 py-2 align-top text-sm overflow-hidden whitespace-nowrap">
                  {formatDate(expense.dueDate)}
                </td>
                {/* Mês — sem quebra */}
                <td className="px-3 py-2 align-top font-medium text-sm overflow-hidden whitespace-nowrap">
                  {expense.month}
                </td>
                {/* Status — sem quebra */}
                <td className="px-3 py-2 align-top overflow-hidden whitespace-nowrap">
                  <Badge
                    variant={expense.status === 'paid' ? 'default' : expense.status === 'overdue' ? 'destructive' : 'secondary'}
                    className="cursor-pointer text-xs"
                    onClick={() => onToggleStatus(expense.id)}
                  >
                    {expense.status === 'paid' ? 'Pago' : expense.status === 'overdue' ? 'Vencido' : 'Pendente'}
                  </Badge>
                </td>
                {/* Ações */}
                <td className="px-3 py-2 align-top overflow-hidden whitespace-nowrap">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditExpense(expense)}
                      className="gap-1 text-primary border-primary/40 hover:bg-primary/10 h-7 text-xs px-2"
                    >
                      <PencilSimple size={12} weight="bold" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteConfirm({
                        type: 'expense',
                        id: expense.id,
                        label: `${expense.number ? expense.number + ' – ' : ''}${expense.description}`,
                      })}
                      title="Excluir despesa"
                      className="h-7 px-2"
                    >
                      <Trash size={14} className="text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────

export function ExpensesView({
  expenses,
  creditors,
  categories = [],
  contracts = [],
  onNewExpense,
  onEditExpense,
  onToggleStatus,
  onDeleteConfirm,
}: ExpensesViewProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filterDescription, setFilterDescription] = useState('')
  const [filterCreditor, setFilterCreditor] = useState('all')
  const [filterContract, setFilterContract] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterValueMin, setFilterValueMin] = useState('')
  const [filterValueMax, setFilterValueMax] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const hasActiveFilters =
    filterDescription !== '' ||
    filterCreditor !== 'all' ||
    filterContract !== 'all' ||
    filterCategory !== 'all' ||
    filterStatus !== 'all' ||
    filterType !== 'all' ||
    filterValueMin !== '' ||
    filterValueMax !== '' ||
    filterMonth !== ''

  function clearFilters() {
    setFilterDescription('')
    setFilterCreditor('all')
    setFilterContract('all')
    setFilterCategory('all')
    setFilterStatus('all')
    setFilterType('all')
    setFilterValueMin('')
    setFilterValueMax('')
    setFilterMonth('')
    setCurrentPage(1)
  }

  // Volta à pág 1 ao mudar qualquer filtro
  useEffect(() => { setCurrentPage(1) }, [
    filterDescription, filterCreditor, filterContract, filterCategory,
    filterStatus, filterType, filterValueMin, filterValueMax, filterMonth,
  ])

  const sortedFiltered = useMemo(() => {
    const minVal = filterValueMin !== '' ? parseFloat(filterValueMin.replace(',', '.')) : null
    const maxVal = filterValueMax !== '' ? parseFloat(filterValueMax.replace(',', '.')) : null

    return [...expenses]
      .filter((e) => {
        if (filterDescription && !e.description.toLowerCase().includes(filterDescription.toLowerCase())) return false
        if (filterCreditor !== 'all' && e.creditorId !== filterCreditor) return false
        if (filterContract !== 'all') {
          if (filterContract === '__none__') {
            if (e.contractId) return false
          } else if (e.contractId !== filterContract) return false
        }
        if (filterCategory !== 'all') {
          if (filterCategory === '__none__') {
            if (e.categoryId) return false
          } else if (e.categoryId !== filterCategory) return false
        }
        if (filterStatus !== 'all' && e.status !== filterStatus) return false
        if (filterType !== 'all' && e.type !== filterType) return false
        if (minVal !== null && !isNaN(minVal) && e.amount < minVal) return false
        if (maxVal !== null && !isNaN(maxVal) && e.amount > maxVal) return false
        if (filterMonth && !e.month.toLowerCase().includes(filterMonth.toLowerCase())) return false
        return true
      })
      .sort((a, b) => expenseNumberSortKey(a.number) - expenseNumberSortKey(b.number))
  }, [
    expenses, filterDescription, filterCreditor, filterContract,
    filterCategory, filterStatus, filterType, filterValueMin, filterValueMax, filterMonth,
  ])
  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sortedFiltered.slice(start, start + pageSize)
  }, [sortedFiltered, safePage, pageSize])

  // Botões de página: mostra no máximo 7, com reticências
  const pageRange = useMemo((): (number | -1)[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const left = Math.max(2, safePage - 2)
    const right = Math.min(totalPages - 1, safePage + 2)
    const pages: (number | -1)[] = [1]
    if (left > 2) pages.push(-1)
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push(-1)
    pages.push(totalPages)
    return pages
  }, [totalPages, safePage])
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display">Gerenciar Despesas</CardTitle>
            <CardDescription>Cadastre e acompanhe todas as despesas</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters((v) => !v)}
              className="gap-2"
            >
              <FunnelSimple size={16} weight="bold" />
              Filtros
              {hasActiveFilters && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px]">
                  {[
                    filterDescription !== '',
                    filterCreditor !== 'all',
                    filterContract !== 'all',
                    filterCategory !== 'all',
                    filterStatus !== 'all',
                    filterType !== 'all',
                    filterValueMin !== '',
                    filterValueMax !== '',
                    filterMonth !== '',
                  ].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            <Button onClick={onNewExpense}>
              <Plus className="mr-2" size={18} weight="bold" />
              Nova Despesa
            </Button>
          </div>
        </div>

        {/* Painel de filtros */}
        {showFilters && (
          <div className="mt-4 rounded-lg border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">Filtros de busca</span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <X size={12} />
                  Limpar filtros
                </Button>
              )}
            </div>

            {/* Linha 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Input
                  placeholder="Buscar por descrição..."
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Credor</Label>
                <Select value={filterCreditor} onValueChange={setFilterCreditor}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Todos os credores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os credores</SelectItem>
                    {creditors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Contrato</Label>
                <Select value={filterContract} onValueChange={setFilterContract}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Todos os contratos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os contratos</SelectItem>
                    <SelectItem value="__none__">Sem contrato</SelectItem>
                    {contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.number} – {c.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="__none__">Sem categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="fixed">Fixa</SelectItem>
                    <SelectItem value="variable">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mês de referência</Label>
                <Input
                  placeholder="Ex: 03/2026"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Linha 3 – valor */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Valor mínimo (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={filterValueMin}
                  onChange={(e) => setFilterValueMin(e.target.value)}
                  className="h-8 text-sm"
                  type="number"
                  min={0}
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Valor máximo (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={filterValueMax}
                  onChange={(e) => setFilterValueMax(e.target.value)}
                  className="h-8 text-sm"
                  type="number"
                  min={0}
                  step="0.01"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex items-end pb-0.5">
                <span className="text-xs text-muted-foreground">
                  {sortedFiltered.length} despesa{sortedFiltered.length !== 1 ? 's' : ''} encontrada{sortedFiltered.length !== 1 ? 's' : ''}
                  {hasActiveFilters && ` de ${expenses.length}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhuma despesa cadastrada ainda.</p>
            <p className="text-sm">Clique em "Nova Despesa" para começar.</p>
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FunnelSimple size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhuma despesa encontrada com os filtros aplicados.</p>
            <Button variant="link" className="mt-1 text-sm" onClick={clearFilters}>Limpar filtros</Button>
          </div>
        ) : (
          <>
            <ResizableExpensesTable
              sortedFiltered={paginated}
              creditors={creditors}
              onEditExpense={onEditExpense}
              onToggleStatus={onToggleStatus}
              onDeleteConfirm={onDeleteConfirm}
            />

            {/* ── Paginação ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t gap-4 flex-wrap">
              {/* Seletor de itens por página */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Exibir</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1) }}
                >
                  <SelectTrigger className="h-8 w-20 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>por página</span>
                <span className="text-foreground font-medium">
                  · {sortedFiltered.length} despesa{sortedFiltered.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Botões de navegação */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm"
                  className="h-8 w-8 p-0 text-base"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="Primeira página"
                >«</Button>
                <Button
                  variant="outline" size="sm"
                  className="h-8 w-8 p-0 text-base"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Página anterior"
                >‹</Button>

                {pageRange.map((p, idx) =>
                  p === -1 ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === safePage ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0 text-sm"
                      onClick={() => setCurrentPage(p)}
                    >{p}</Button>
                  )
                )}

                <Button
                  variant="outline" size="sm"
                  className="h-8 w-8 p-0 text-base"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Próxima página"
                >›</Button>
                <Button
                  variant="outline" size="sm"
                  className="h-8 w-8 p-0 text-base"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Última página"
                >»</Button>
              </div>

              {/* Info de página atual */}
              <span className="text-sm text-muted-foreground">
                Página <span className="font-medium text-foreground">{safePage}</span> de <span className="font-medium text-foreground">{totalPages}</span>
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}