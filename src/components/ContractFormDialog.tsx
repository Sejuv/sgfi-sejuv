import { useState, useEffect, useRef } from 'react'
import { FloatingWindow } from '@/components/FloatingWindow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Contract, ContractItem, ContractStatus, Creditor, CatalogItem } from '@/lib/types'
import { Plus, Trash, CurrencyCircleDollar, BellRinging, Package } from '@phosphor-icons/react'
import { formatCurrency } from '@/lib/calculations'

interface ContractFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (contract: Omit<Contract, 'id' | 'createdAt'>) => void
  creditors: Creditor[]
  catalogItems?: CatalogItem[]
  initialData?: Contract | null
}

const statusLabels: Record<ContractStatus, string> = {
  active: 'Vigente',
  pending: 'Pendente',
  expired: 'Encerrado',
  cancelled: 'Cancelado',
}

const emptyItem = (): ContractItem => ({
  id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  description: '',
  quantity: 1,
  consumed: 0,
  unit: 'un',
  unitPrice: 0,
})

export function ContractFormDialog({
  open,
  onOpenChange,
  onSave,
  creditors,
  catalogItems = [],
  initialData,
}: ContractFormDialogProps) {
  const [number, setNumber] = useState('')
  const [description, setDescription] = useState('')
  const [creditorId, setCreditorId] = useState('')
  const [status, setStatus] = useState<ContractStatus>('pending')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ContractItem[]>([emptyItem()])
  const [alertNewContract, setAlertNewContract] = useState<string>('')
  const [alertAdditive, setAlertAdditive] = useState<string>('')
  const [activeAC, setActiveAC] = useState<string | null>(null)
  const acRef = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (acRef.current && !acRef.current.contains(e.target as Node)) setActiveAC(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const catalogSuggestions = (query: string) =>
    catalogItems
      .filter(ci => ci.description.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10)

  useEffect(() => {
    if (initialData) {
      setNumber(initialData.number)
      setDescription(initialData.description)
      setCreditorId(initialData.creditorId)
      setStatus(initialData.status)
      setStartDate(initialData.startDate)
      setEndDate(initialData.endDate)
      setNotes(initialData.notes || '')
      setItems(initialData.items.length > 0 ? initialData.items : [emptyItem()])
      setAlertNewContract(initialData.alertNewContract != null ? String(initialData.alertNewContract) : '')
      setAlertAdditive(initialData.alertAdditive != null ? String(initialData.alertAdditive) : '')
    } else {
      resetForm()
    }
  }, [initialData, open])

  function resetForm() {
    setNumber('')
    setDescription('')
    setCreditorId('')
    setStatus('pending')
    setStartDate('')
    setEndDate('')
    setNotes('')
    setItems([emptyItem()])
    setAlertNewContract('')
    setAlertAdditive('')
  }

  const totalValue = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)

  const addItem = () => setItems((prev) => [...prev, emptyItem()])

  const pickCatalogItem = (itemId: string, ci: CatalogItem) => {
    setItems(prev => prev.map(i =>
      i.id === itemId
        ? { ...i, catalogItemId: ci.id, description: ci.description, unit: ci.unit, unitPrice: ci.unitPrice }
        : i
    ))
    setActiveAC(null)
  }

  const removeItem = (id: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev))

  const updateItem = (id: string, field: keyof ContractItem, value: string | number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))

  const handleSave = () => {
    if (!number.trim() || !description.trim() || !startDate || !endDate) return
    onSave({
      number, description, creditorId, status, startDate, endDate, notes, items,
      alertNewContract: alertNewContract !== '' ? parseInt(alertNewContract) : undefined,
      alertAdditive: alertAdditive !== '' ? parseInt(alertAdditive) : undefined,
    })
    resetForm()
    onOpenChange(false)
  }

  return (
    <FloatingWindow
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? 'Editar Contrato' : 'Novo Contrato'}
      description="Preencha os dados do contrato e seus itens"
    >
      <div className="h-full flex flex-col gap-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-1 space-y-6">
          {/* Dados Gerais */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="c-number">Nº do Contrato <span className="text-destructive">*</span></Label>
              <Input
                id="c-number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Ex: 001/2026"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContractStatus)}>
                <SelectTrigger id="c-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(statusLabels) as ContractStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="c-desc">Descrição / Objeto <span className="text-destructive">*</span></Label>
              <Input
                id="c-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Prestação de serviços de manutenção predial"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-creditor">Fornecedor / Credor</Label>
              <Select value={creditorId} onValueChange={setCreditorId}>
                <SelectTrigger id="c-creditor">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {creditors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="c-start">Data Início <span className="text-destructive">*</span></Label>
                <Input
                  id="c-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-end">Data Fim <span className="text-destructive">*</span></Label>
                <Input
                  id="c-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="c-notes">Observações</Label>
              <Textarea
                id="c-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais, cláusulas relevantes..."
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Alertas de Vencimento */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BellRinging size={16} weight="duotone" className="text-amber-500" />
              <h3 className="text-sm font-semibold">Alertas de Vencimento</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Defina com quantos dias de antecedência deseja ser alertado antes do término do contrato.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="c-alert-new" className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  Alerta — Nova Contratação
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="c-alert-new"
                    type="number"
                    min={1}
                    value={alertNewContract}
                    onChange={(e) => setAlertNewContract(e.target.value)}
                    placeholder="Ex: 90"
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">dias antes do fim</span>
                </div>
                {alertNewContract && endDate && (
                  <p className="text-xs text-amber-600">
                    Alerta em: {new Date(new Date(endDate).getTime() - parseInt(alertNewContract) * 86400000).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-alert-add" className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                  Alerta — Aditivo de Prazo
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="c-alert-add"
                    type="number"
                    min={1}
                    value={alertAdditive}
                    onChange={(e) => setAlertAdditive(e.target.value)}
                    placeholder="Ex: 30"
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">dias antes do fim</span>
                </div>
                {alertAdditive && endDate && (
                  <p className="text-xs text-blue-600">
                    Alerta em: {new Date(new Date(endDate).getTime() - parseInt(alertAdditive) * 86400000).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Itens do Contrato */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Itens do Contrato</h3>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus size={15} weight="bold" className="mr-1" />
                Adicionar Item
              </Button>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[260px]">Item / Descrição</TableHead>
                    <TableHead className="w-20 text-center">Qtd</TableHead>
                    <TableHead className="w-24">Unidade</TableHead>
                    <TableHead className="w-32 text-right">Vlr Unitário</TableHead>
                    <TableHead className="w-32 text-right">Total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="relative flex flex-col gap-1" ref={activeAC === item.id ? acRef : undefined}>
                          <div className="flex items-center gap-1">
                            <Input
                              value={item.description}
                              onChange={(e) => {
                                updateItem(item.id, 'description', e.target.value)
                                setActiveAC(e.target.value.length >= 1 ? item.id : null)
                              }}
                              onFocus={() => {
                                if (item.description.length >= 1) setActiveAC(item.id)
                              }}
                              placeholder="Pesquise pelo catálogo ou descreva..."
                              className="h-8 flex-1"
                            />
                            {item.catalogItemId && (
                              <Badge variant="secondary" className="h-8 shrink-0 text-xs gap-1 px-2">
                                <Package size={11} />
                                Catálogo
                              </Badge>
                            )}
                          </div>
                          {activeAC === item.id && catalogSuggestions(item.description).length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-auto rounded-md border bg-popover shadow-md">
                              {catalogSuggestions(item.description).map(ci => (
                                <button
                                  key={ci.id}
                                  type="button"
                                  className="w-full flex flex-col items-start px-3 py-2 text-left hover:bg-accent gap-0.5"
                                  onMouseDown={(e) => { e.preventDefault(); pickCatalogItem(item.id, ci) }}
                                >
                                  <span className="text-xs font-medium leading-tight">{ci.description}</span>
                                  <span className="text-xs text-muted-foreground">{ci.unit}{ci.category ? ` · ${ci.category}` : ''}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="h-8 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          placeholder="un"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="h-8 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash size={15} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end items-center gap-3 px-1">
              <CurrencyCircleDollar size={20} weight="duotone" className="text-primary" />
              <span className="text-sm text-muted-foreground">Valor Total do Contrato:</span>
              <span className="text-lg font-bold font-display tabular-nums text-primary">
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-4 border-t mt-2">
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false) }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!number.trim() || !description.trim() || !startDate || !endDate}
          >
            {initialData ? 'Salvar Alterações' : 'Criar Contrato'}
          </Button>
        </div>
      </div>
    </FloatingWindow>
  )
}
