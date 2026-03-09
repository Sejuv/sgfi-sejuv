import { useState, useEffect, useRef } from 'react'
import { FloatingWindow } from '@/components/FloatingWindow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Contract, ContractItem, CatalogItem } from '@/lib/types'
import { Plus, Trash, CurrencyCircleDollar, ListBullets, Package } from '@phosphor-icons/react'
import { formatCurrency } from '@/lib/calculations'
import { toast } from 'sonner'

interface ContractItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract: Contract | null
  onSave: (contractId: string, items: ContractItem[]) => Promise<void>
  catalogItems?: CatalogItem[]
}

const emptyItem = (): ContractItem => ({
  id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  description: '',
  quantity: 1,
  unit: 'un',
  unitPrice: 0,
  consumed: 0,
})

export function ContractItemsDialog({
  open,
  onOpenChange,
  contract,
  onSave,
  catalogItems = [],
}: ContractItemsDialogProps) {
  const [items, setItems] = useState<ContractItem[]>([emptyItem()])
  const [saving, setSaving] = useState(false)
  const [activeAC, setActiveAC] = useState<string | null>(null)
  const acRef = useRef<HTMLDivElement>(null)

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

  const pickCatalogItem = (itemId: string, ci: CatalogItem) => {
    setItems(prev => prev.map(i =>
      i.id === itemId
        ? { ...i, catalogItemId: ci.id, description: ci.description, unit: ci.unit, unitPrice: ci.unitPrice }
        : i
    ))
    setActiveAC(null)
  }

  useEffect(() => {
    if (contract) {
      setItems(contract.items.length > 0 ? [...contract.items] : [emptyItem()])
    }
  }, [contract, open])

  const totalValue = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)

  const addItem = () => setItems((prev) => [...prev, emptyItem()])

  const removeItem = (id: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev))

  const updateItem = (id: string, field: keyof ContractItem, value: string | number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))

  const handleSave = async () => {
    if (!contract) return
    const valid = items.filter((i) => i.description.trim())
    if (valid.length === 0) {
      toast.error('Adicione pelo menos um item com descrição')
      return
    }
    setSaving(true)
    try {
      await onSave(contract.id, valid)
      toast.success('Itens salvos com sucesso!')
      onOpenChange(false)
    } catch {
      toast.error('Erro ao salvar itens')
    } finally {
      setSaving(false)
    }
  }

  if (!contract) return null

  return (
    <FloatingWindow
      open={open}
      onOpenChange={onOpenChange}
      title="Itens do Contrato"
      description={`Contrato ${contract.number} — ${contract.description}`}
    >
      <div className="h-full flex flex-col gap-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-1 space-y-4">

          {/* Cabeçalho info */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <ListBullets size={16} className="text-primary shrink-0" />
            <span className="text-muted-foreground">
              Gerencie os itens, quantidades e valores deste contrato. O valor total é calculado automaticamente.
            </span>
          </div>

          {/* Botão Adicionar */}
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus size={15} weight="bold" className="mr-1" />
              Adicionar Item
            </Button>
          </div>

          {/* Tabela de itens */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Descrição</TableHead>
                  <TableHead className="w-24 text-center">Qtd</TableHead>
                  <TableHead className="w-24">Unidade</TableHead>
                  <TableHead className="w-36 text-right">Vlr Unitário (R$)</TableHead>
                  <TableHead className="w-36 text-right">Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="relative flex items-center gap-2" ref={activeAC === item.id ? acRef : undefined}>
                        <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{idx + 1}.</span>
                        <div className="relative flex-1 flex items-center gap-1">
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
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
                        disabled={items.length === 1}
                      >
                        <Trash size={15} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="flex justify-end items-center gap-3 px-1 pt-1">
            <CurrencyCircleDollar size={20} weight="duotone" className="text-primary" />
            <span className="text-sm text-muted-foreground">Valor Total do Contrato:</span>
            <span className="text-xl font-bold tabular-nums text-primary">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-between items-center pt-4 border-t mt-2">
          <span className="text-xs text-muted-foreground">
            {items.filter(i => i.description.trim()).length} {items.filter(i => i.description.trim()).length === 1 ? 'item' : 'itens'} cadastrado{items.filter(i => i.description.trim()).length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Itens'}
            </Button>
          </div>
        </div>
      </div>
    </FloatingWindow>
  )
}
