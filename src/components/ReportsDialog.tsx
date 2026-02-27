import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Expense, Creditor, Category, ExpenseStatus, ExpenseType } from '@/lib/types'
import { SystemEntity, SystemConfig } from '@/lib/config-types'
import { exportToExcel, exportToPDF } from '@/lib/export'
import { formatCurrency, formatDate } from '@/lib/calculations'
import { FileXls, FilePdf, Printer, FunnelSimple, X, Check, Eye } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { FloatingWindow } from '@/components/FloatingWindow'
import { useAuth } from '@/lib/auth-context'
import { entitiesApi, settingsApi } from '@/lib/api'

interface ReportsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expenses: Expense[]
  creditors: Creditor[]
  categories?: Category[]
}

interface ReportFilters {
  startDate: string
  endDate: string
  status: ExpenseStatus | 'all'
  type: ExpenseType | 'all'
  creditorId: string
  month: string
  minAmount: string
  maxAmount: string
}

export function ReportsDialog({ open, onOpenChange, expenses, creditors, categories }: ReportsDialogProps) {
  const { currentUser } = useAuth()
  const [activeEntity, setActiveEntity] = useState<SystemEntity | undefined>(undefined)
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    headerText: 'SGFI - Sistema de Gestão Financeira Institucional',
    footerText: '© 2024 - Todos os direitos reservados',
  })

  useEffect(() => {
    entitiesApi.list().then(list => { if (list.length > 0) setActiveEntity(list[0]) }).catch(() => {})
    settingsApi.list().then(s => {
      if (s.headerText || s.footerText) {
        setSystemConfig(prev => ({
          ...prev,
          headerText: s.headerText || prev.headerText,
          footerText: s.footerText || prev.footerText,
        }))
      }
    }).catch(() => {})
  }, [])

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    status: 'all',
    type: 'all',
    creditorId: 'all',
    month: 'all',
    minAmount: '',
    maxAmount: '',
  })

  const [showPreview, setShowPreview] = useState(false)
  const [includeMetrics, setIncludeMetrics] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const filteredExpenses = expenses.filter((expense) => {
    if (filters.startDate) {
      const expenseDate = new Date(expense.dueDate)
      const startDate = new Date(filters.startDate)
      if (expenseDate < startDate) return false
    }

    if (filters.endDate) {
      const expenseDate = new Date(expense.dueDate)
      const endDate = new Date(filters.endDate)
      if (expenseDate > endDate) return false
    }

    if (filters.status !== 'all' && expense.status !== filters.status) {
      return false
    }

    if (filters.type !== 'all' && expense.type !== filters.type) {
      return false
    }

    if (filters.creditorId !== 'all' && expense.creditorId !== filters.creditorId) {
      return false
    }

    if (filters.month !== 'all' && expense.month !== filters.month) {
      return false
    }

    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount)
      if (expense.amount < minAmount) return false
    }

    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount)
      if (expense.amount > maxAmount) return false
    }

    return true
  })

  const totalPaid = filteredExpenses
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalPending = filteredExpenses
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalOverdue = filteredExpenses
    .filter(e => e.status === 'overdue')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalFixed = filteredExpenses
    .filter(e => e.type === 'fixed')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalVariable = filteredExpenses
    .filter(e => e.type === 'variable')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  const uniqueMonths = Array.from(new Set(expenses.map(e => e.month))).sort()

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: 'all',
      type: 'all',
      creditorId: 'all',
      month: 'all',
      minAmount: '',
      maxAmount: '',
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'all')

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setIsExporting(true)

      const options = {
        expenses: filteredExpenses,
        creditors,
        categories,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        includeMetrics,
        entity: activeEntity,
        config: systemConfig,
        generatedBy: currentUser?.name,
      }

      let fileName: string

      if (format === 'excel') {
        fileName = exportToExcel(options)
        toast.success(`Arquivo Excel exportado: ${fileName}`)
      } else {
        fileName = exportToPDF(options)
        toast.success(`Arquivo PDF exportado: ${fileName}`)
      }
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar arquivo. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) {
      toast.error('Não foi possível abrir janela de impressão')
      return
    }

    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n')
        } catch (e) {
          return ''
        }
      })
      .join('\n')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Despesas - SGFI</title>
          <style>
            ${styles}
            @media print {
              body { 
                margin: 0; 
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              }
              .no-print { display: none !important; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)

    toast.success('Preparando impressão...')
  }

  return (
    <FloatingWindow
      open={open}
      onOpenChange={onOpenChange}
      title="Relatórios e Exportações"
      description="Configure filtros, visualize e exporte relatórios detalhados"
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          {!showPreview ? (
            <div className="grid gap-6">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <FunnelSimple size={24} weight="duotone" className="text-primary" />
                  <div>
                    <p className="font-semibold">Filtros de Relatório</p>
                    <p className="text-xs text-muted-foreground">
                      {filteredExpenses.length} de {expenses.length} despesas selecionadas
                    </p>
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="gap-2"
                  >
                    <X size={16} />
                    Limpar Filtros
                  </Button>
                )}
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="filter-start-date">Data Início</Label>
                    <Input
                      id="filter-start-date"
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="filter-end-date">Data Fim</Label>
                    <Input
                      id="filter-end-date"
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      min={filters.startDate}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="filter-status">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
                    >
                      <SelectTrigger id="filter-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="overdue">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="filter-type">Tipo</Label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger id="filter-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="fixed">Fixa</SelectItem>
                        <SelectItem value="variable">Variável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="filter-creditor">Credor</Label>
                    <Select
                      value={filters.creditorId}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, creditorId: value }))}
                    >
                      <SelectTrigger id="filter-creditor">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {creditors.map(creditor => (
                          <SelectItem key={creditor.id} value={creditor.id}>
                            {creditor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="filter-month">Mês</Label>
                    <Select
                      value={filters.month}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}
                    >
                      <SelectTrigger id="filter-month">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {uniqueMonths.map(month => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="filter-min-amount">Valor Mínimo</Label>
                    <Input
                      id="filter-min-amount"
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      value={filters.minAmount}
                      onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="filter-max-amount">Valor Máximo</Label>
                    <Input
                      id="filter-max-amount"
                      type="number"
                      step="0.01"
                      placeholder="R$ 999.999,99"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox
                  id="include-metrics-report"
                  checked={includeMetrics}
                  onCheckedChange={(checked) => setIncludeMetrics(checked as boolean)}
                />
                <Label
                  htmlFor="include-metrics-report"
                  className="text-sm font-normal cursor-pointer leading-none"
                >
                  Incluir resumo financeiro no relatório
                </Label>
              </div>

              {includeMetrics && filteredExpenses.length > 0 && (
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Resumo Atual</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pago:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pendente:</span>
                      <span className="font-semibold text-yellow-600">{formatCurrency(totalPending)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Vencido:</span>
                      <span className="font-semibold text-red-600">{formatCurrency(totalOverdue)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Despesas Fixas:</span>
                      <span className="font-semibold">{formatCurrency(totalFixed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Despesas Variáveis:</span>
                      <span className="font-semibold">{formatCurrency(totalVariable)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total Geral:</span>
                      <span className="font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div ref={printRef} className="print-preview">
              <div className="bg-white p-8 rounded-lg">
                {activeEntity && (
                  <div className="text-center mb-6 pb-6 border-b-2">
                    <div className="flex items-center justify-center gap-8 mb-4">
                      {activeEntity.logoUrl && (
                        <img src={activeEntity.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
                      )}
                      <div>
                        <h1 className="text-2xl font-bold font-display">{activeEntity.fullName}</h1>
                        {activeEntity.documentNumber && (
                          <p className="text-sm text-muted-foreground">CNPJ: {activeEntity.documentNumber}</p>
                        )}
                      </div>
                      {activeEntity.brasaoUrl && (
                        <img src={activeEntity.brasaoUrl} alt="Brasão" className="h-16 w-16 object-contain" />
                      )}
                    </div>
                    {activeEntity.address && <p className="text-xs">{activeEntity.address}</p>}
                    {(activeEntity.phone || activeEntity.email) && (
                      <p className="text-xs text-muted-foreground">
                        {[activeEntity.phone, activeEntity.email].filter(Boolean).join(' | ')}
                      </p>
                    )}
                  </div>
                )}

                <div className="text-center mb-6">
                  {(filters.startDate || filters.endDate) && (
                    <p className="text-sm text-muted-foreground">
                      Período: {filters.startDate ? formatDate(filters.startDate) : 'Início'} até {filters.endDate ? formatDate(filters.endDate) : 'Hoje'}
                    </p>
                  )}
                </div>

                {includeMetrics && (
                  <div className="mb-6 grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Total Pago</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Total Pendente</p>
                        <p className="text-lg font-bold text-yellow-600">{formatCurrency(totalPending + totalOverdue)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Total Geral</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Credor</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Mês</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => {
                        const creditor = creditors.find((c) => c.id === expense.creditorId)
                        return (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell>{creditor?.name || '-'}</TableCell>
                            <TableCell className="tabular-nums font-semibold">
                              {formatCurrency(expense.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {expense.type === 'fixed' ? 'Fixa' : 'Variável'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(expense.dueDate)}</TableCell>
                            <TableCell className="font-medium">{expense.month}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  expense.status === 'paid'
                                    ? 'default'
                                    : expense.status === 'overdue'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {expense.status === 'paid'
                                  ? 'Pago'
                                  : expense.status === 'overdue'
                                  ? 'Vencido'
                                  : 'Pendente'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
                  <p className="font-semibold text-sm text-foreground mb-1">{systemConfig?.headerText || 'SGFI - Sistema de Gestão Financeira Institucional'}</p>
                  <p>{systemConfig?.footerText || '© 2024 - Todos os direitos reservados'}</p>
                  <div className="flex justify-between mt-2 text-[11px]">
                    <span>Gerado em: {new Date().toLocaleString('pt-BR')}{currentUser ? ` — Gerado por: ${currentUser.name}` : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-between pt-6 border-t mt-6">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? (
              <>
                <FunnelSimple size={18} />
                Voltar aos Filtros
              </>
            ) : (
              <>
                <Eye size={18} />
                Visualizar
              </>
            )}
          </Button>

          <div className="flex gap-2">
            {showPreview && (
              <Button
                onClick={handlePrint}
                disabled={isExporting || filteredExpenses.length === 0}
                variant="outline"
                className="gap-2"
              >
                <Printer size={18} weight="bold" />
                Imprimir
              </Button>
            )}
            <Button
              onClick={() => handleExport('excel')}
              disabled={isExporting || filteredExpenses.length === 0}
              className="bg-accent hover:bg-accent/90 gap-2"
            >
              <FileXls size={18} weight="fill" />
              Excel
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting || filteredExpenses.length === 0}
              className="bg-destructive hover:bg-destructive/90 gap-2"
            >
              <FilePdf size={18} weight="fill" />
              PDF
            </Button>
          </div>
        </div>
      </div>
    </FloatingWindow>
  )
}
