import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarBlank, MagnifyingGlass, Warning, CheckCircle } from '@phosphor-icons/react'
import { Expense, Creditor, ExpenseType, ExpenseStatus, Contract, ContractItem } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'
import { toast } from 'sonner'
import { FloatingWindow } from '@/components/FloatingWindow'

export interface ConsumedItemEntry {
  itemId: string
  qty: number
}

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (expense: Omit<Expense, 'id' | 'createdAt'>, consumedItems: ConsumedItemEntry[]) => void
  creditors: Creditor[]
  contracts: Contract[]
  categories?: { id: string; name: string }[]
  expense?: Expense
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  onSave,
  creditors,
  contracts,
  expense,
}: ExpenseFormDialogProps) {
  // Contrato selecionado
  const [contractSearch, setContractSearch] = useState('')
  const [selectedContractId, setSelectedContractId] = useState(expense?.contractId || '')
  const [showContractList, setShowContractList] = useState(false)

  // Quantidades por item do contrato
  const [itemQtys, setItemQtys] = useState<Record<string, string>>({})

  // Demais campos
  const [type, setType] = useState<ExpenseType>(expense?.type || 'fixed')
  const [dueDate, setDueDate] = useState<Date | undefined>(
    expense?.dueDate ? new Date(expense.dueDate) : undefined
  )
  const [month, setMonth] = useState(expense?.month || '')
  const [status, setStatus] = useState<ExpenseStatus>(expense?.status || 'pending')
  const [creditorId, setCreditorId] = useState(expense?.creditorId || '')

  // Controle de alterações não salvas
  const [isDirty, setIsDirty] = useState(false)

  // Contrato selecionado
  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === selectedContractId) || null,
    [contracts, selectedContractId]
  )

  // Filtro de contratos na busca
  const filteredContracts = useMemo(() => {
    const q = contractSearch.toLowerCase()
    if (!q) return contracts
    return contracts.filter(
      (c) =>
        c.number.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (creditors.find((cr) => cr.id === c.creditorId)?.name || '').toLowerCase().includes(q)
    )
  }, [contracts, creditors, contractSearch])

  // Ao selecionar contrato, preenche credor automaticamente
  useEffect(() => {
    if (selectedContract) {
      setCreditorId(selectedContract.creditorId)
      setItemQtys({})
    }
  }, [selectedContract])

  // Calcula saldo disponível de cada item
  const itemBalance = (item: ContractItem) => {
    const consumed = item.consumed ?? 0
    return item.quantity - consumed
  }

  // Calcula o valor total a partir das quantidades informadas
  const computedAmount = useMemo(() => {
    if (!selectedContract) return 0
    return selectedContract.items.reduce((acc, item) => {
      const qty = parseFloat(itemQtys[item.id] || '0') || 0
      return acc + qty * item.unitPrice
    }, 0)
  }, [selectedContract, itemQtys])

  const handleSelectContract = (contract: Contract) => {
    setSelectedContractId(contract.id)
    setContractSearch(`${contract.number} – ${contract.description}`)
    setShowContractList(false)
    setIsDirty(true)
  }

  const handleItemQtyChange = (item: ContractItem, value: string) => {
    const balance = itemBalance(item)
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed > balance) {
      toast.warning(`Saldo disponível para "${item.description}" é ${balance} ${item.unit}`)
      setItemQtys((prev) => ({ ...prev, [item.id]: String(balance) }))
      return
    }
    setItemQtys((prev) => ({ ...prev, [item.id]: value }))
    setIsDirty(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedContractId || !selectedContract) {
      toast.error('Selecione um contrato')
      return
    }

    if (computedAmount <= 0) {
      toast.error('Informe a quantidade de pelo menos um item')
      return
    }

    // Valida saldos
    for (const item of selectedContract.items) {
      const qty = parseFloat(itemQtys[item.id] || '0') || 0
      if (qty < 0) { toast.error(`Quantidade inválida para "${item.description}"`); return }
      if (qty > itemBalance(item)) {
        toast.error(`Saldo insuficiente para "${item.description}". Disponível: ${itemBalance(item)} ${item.unit}`)
        return
      }
    }

    if (!dueDate) {
      toast.error('Data de vencimento é obrigatória')
      return
    }

    if (!creditorId) {
      toast.error('Selecione um credor')
      return
    }

    if (!month.trim()) {
      toast.error('Mês de referência é obrigatório')
      return
    }

    const consumedItems: ConsumedItemEntry[] = selectedContract.items
      .filter((item) => (parseFloat(itemQtys[item.id] || '0') || 0) > 0)
      .map((item) => ({ itemId: item.id, qty: parseFloat(itemQtys[item.id]) }))

    onSave(
      {
        description: `${selectedContract.number} – ${selectedContract.description}`,
        amount: computedAmount,
        type,
        dueDate: dueDate.toISOString(),
        month,
        status,
        creditorId,
        contractId: selectedContractId,
        paidAt: status === 'paid' ? new Date().toISOString() : undefined,
      },
      consumedItems
    )

    // Reset
    handleClose()
  }

  const handleClose = () => {
    setSelectedContractId('')
    setContractSearch('')
    setItemQtys({})
    setType('fixed')
    setDueDate(undefined)
    setMonth('')
    setStatus('pending')
    setCreditorId('')
    setIsDirty(false)
    onOpenChange(false)
  }

  return (
    <FloatingWindow
      open={open}
      onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true) }}
      title={expense ? 'Editar Despesa' : 'Nova Despesa'}
      description="Preencha os dados da despesa institucional"
      confirmClose={isDirty}
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="grid gap-4">

            {/* ── Seleção de Contrato ── */}
            <div className="grid gap-2">
              <Label>Contrato</Label>
              <div className="relative">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por número, objeto ou fornecedor..."
                    value={contractSearch}
                    onChange={(e) => {
                      setContractSearch(e.target.value)
                      setShowContractList(true)
                      if (!e.target.value) setSelectedContractId('')
                    }}
                    onFocus={() => setShowContractList(true)}
                    onBlur={() => setTimeout(() => setShowContractList(false), 180)}
                  />
                </div>

                {showContractList && filteredContracts.length > 0 && (
                  <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-background border rounded-md shadow-lg max-h-52 overflow-y-auto">
                    {filteredContracts.map((c) => {
                      const creditor = creditors.find((cr) => cr.id === c.creditorId)
                      const total = c.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent border-b last:border-b-0 grid grid-cols-1 gap-0.5"
                          onMouseDown={() => handleSelectContract(c)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-primary">{c.number}</span>
                            <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-[10px] py-0">
                              {c.status === 'active' ? 'Vigente' : c.status === 'pending' ? 'Pendente' : c.status === 'expired' ? 'Encerrado' : 'Cancelado'}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground truncate">{c.description}</span>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{creditor?.name || '—'}</span>
                            <span>{formatCurrency(total)}</span>
                            <span>{c.items.length} itens</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {showContractList && filteredContracts.length === 0 && contractSearch && (
                  <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-background border rounded-md shadow-lg px-4 py-3 text-sm text-muted-foreground">
                    Nenhum contrato encontrado para "{contractSearch}"
                  </div>
                )}
              </div>

              {selectedContract && (
                <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm space-y-1 mt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-green-600 shrink-0" />
                    <span className="font-semibold">{selectedContract.number}</span>
                    <span className="text-muted-foreground">–</span>
                    <span className="truncate">{selectedContract.description}</span>
                  </div>
                  <div className="text-muted-foreground text-xs flex gap-4">
                    <span>Vigência: {selectedContract.startDate} → {selectedContract.endDate}</span>
                    <span>Fornecedor: {creditors.find((c) => c.id === selectedContract.creditorId)?.name || '—'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Itens do Contrato ── */}
            {selectedContract && selectedContract.items.length > 0 && (
              <div className="grid gap-2">
                <Label>Itens do Contrato <span className="text-muted-foreground font-normal">(informe a quantidade consumida)</span></Label>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Item</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground w-16">Und.</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground w-24">Saldo</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground w-24">Unit.</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground w-28">Qtde.</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedContract.items.map((item) => {
                        const balance = itemBalance(item)
                        const qty = parseFloat(itemQtys[item.id] || '0') || 0
                        const subtotal = qty * item.unitPrice
                        const isExhausted = balance <= 0
                        const isLow = balance > 0 && balance / item.quantity <= 0.3
                        return (
                          <tr key={item.id} className={`border-t ${isExhausted ? 'opacity-50' : ''}`}>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{item.description}</span>
                                {isExhausted && <Badge variant="destructive" className="text-[10px] py-0">Esgotado</Badge>}
                                {isLow && !isExhausted && <Badge variant="outline" className="text-[10px] py-0 border-orange-400 text-orange-600">Baixo</Badge>}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center text-muted-foreground">{item.unit}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              <span className={balance <= 0 ? 'text-destructive font-semibold' : isLow ? 'text-orange-600 font-semibold' : ''}>
                                {balance}
                              </span>
                              <span className="text-muted-foreground text-xs ml-0.5">/{item.quantity}</span>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                max={balance}
                                step="0.01"
                                disabled={isExhausted}
                                value={itemQtys[item.id] || ''}
                                onChange={(e) => handleItemQtyChange(item, e.target.value)}
                                className="h-8 text-center text-sm"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">
                              {qty > 0 ? formatCurrency(subtotal) : <span className="text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2">
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-right font-semibold">Total desta despesa:</td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold text-primary">{formatCurrency(computedAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {computedAmount <= 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Warning size={13} className="text-orange-500" />
                    Informe a quantidade de pelo menos um item para calcular o valor da despesa.
                  </div>
                )}
              </div>
            )}

            {selectedContract && selectedContract.items.length === 0 && (
              <div className="rounded-md border border-orange-300 bg-orange-50 dark:bg-orange-950/20 px-4 py-3 text-sm text-orange-700 flex items-center gap-2">
                <Warning size={15} />
                Este contrato não possui itens cadastrados.
              </div>
            )}

            <Separator />

            {/* ── Credor ── */}
            <div className="grid gap-2">
              <Label htmlFor="creditor">Credor</Label>
              <Select value={creditorId} onValueChange={(v) => { setCreditorId(v); setIsDirty(true) }}>
                <SelectTrigger id="creditor">
                  <SelectValue placeholder="Selecione um credor" />
                </SelectTrigger>
                <SelectContent>
                  {creditors.map((creditor) => (
                    <SelectItem key={creditor.id} value={creditor.id}>
                      {creditor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Tipo de Conta ── */}
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Conta</Label>
              <Select value={type} onValueChange={(v) => { setType(v as ExpenseType); setIsDirty(true) }}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixa</SelectItem>
                  <SelectItem value="variable">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Data de Vencimento ── */}
            <div className="grid gap-2">
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarBlank className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => { setDueDate(d); setIsDirty(true) }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* ── Mês de Referência ── */}
            <div className="grid gap-2">
              <Label htmlFor="month">Mês de Referência</Label>
              <Select value={month} onValueChange={(v) => { setMonth(v); setIsDirty(true) }}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Janeiro">Janeiro</SelectItem>
                  <SelectItem value="Fevereiro">Fevereiro</SelectItem>
                  <SelectItem value="Março">Março</SelectItem>
                  <SelectItem value="Abril">Abril</SelectItem>
                  <SelectItem value="Maio">Maio</SelectItem>
                  <SelectItem value="Junho">Junho</SelectItem>
                  <SelectItem value="Julho">Julho</SelectItem>
                  <SelectItem value="Agosto">Agosto</SelectItem>
                  <SelectItem value="Setembro">Setembro</SelectItem>
                  <SelectItem value="Outubro">Outubro</SelectItem>
                  <SelectItem value="Novembro">Novembro</SelectItem>
                  <SelectItem value="Dezembro">Dezembro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Status ── */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => { setStatus(v as ExpenseStatus); setIsDirty(true) }}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>

        <div className="flex gap-3 justify-end pt-6 border-t mt-6">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={computedAmount <= 0 || !selectedContractId}>
            Salvar
          </Button>
        </div>
      </form>
    </FloatingWindow>
  )
}
