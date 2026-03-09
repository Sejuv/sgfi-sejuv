import { useState } from 'react'
import { FloatingWindow } from '@/components/FloatingWindow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Contract, ContractItem } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'
import { WarningCircle, CheckCircle, Plus, Minus } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ContractBalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract: Contract | null
  onUpdateConsumed: (contractId: string, itemId: string, consumed: number) => Promise<void>
}

function getBalanceStatus(consumed: number, quantity: number): 'ok' | 'warning' | 'critical' | 'exceeded' {
  if (quantity === 0) return 'ok'
  const remaining = quantity - consumed
  const pct = remaining / quantity
  if (consumed > quantity) return 'exceeded'
  if (pct <= 0.1) return 'critical'   // ≤ 10% restante
  if (pct <= 0.3) return 'warning'    // ≤ 30% restante
  return 'ok'
}

const statusConfig = {
  ok:       { label: 'Normal',    variant: 'secondary'   as const, color: 'text-green-600',  bar: 'bg-green-500' },
  warning:  { label: 'Alerta',    variant: 'outline'     as const, color: 'text-amber-600',  bar: 'bg-amber-500' },
  critical: { label: 'Crítico',   variant: 'destructive' as const, color: 'text-red-600',    bar: 'bg-red-500'   },
  exceeded: { label: 'Excedido',  variant: 'destructive' as const, color: 'text-purple-600', bar: 'bg-purple-500'},
}

export function ContractBalanceDialog({ open, onOpenChange, contract, onUpdateConsumed }: ContractBalanceDialogProps) {
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  if (!contract) return null

  const itemsWithBalance = contract.items.map(item => {
    const consumed = item.consumed ?? 0
    const remaining = item.quantity - consumed
    const pct = item.quantity > 0 ? (consumed / item.quantity) * 100 : 0
    const status = getBalanceStatus(consumed, item.quantity)
    return { ...item, consumed, remaining, pct, status }
  })

  const handleAdd = async (item: ContractItem & { consumed: number; remaining: number }, delta: number) => {
    const key = item.id
    const inputVal = editing[key]
    const amount = inputVal !== undefined ? parseFloat(inputVal) || 0 : delta
    if (amount <= 0) { toast.error('Informe um valor maior que zero'); return }

    const newConsumed = Math.max(0, item.consumed + (delta > 0 ? amount : -amount))
    setSaving(key)
    try {
      await onUpdateConsumed(contract.id, item.id, newConsumed)
      setEditing(prev => { const n = { ...prev }; delete n[key]; return n })
      toast.success(`Consumo ${delta > 0 ? 'registrado' : 'estornado'}: ${amount} ${item.unit}`)
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar consumo')
    } finally {
      setSaving(null)
    }
  }

  const handleSetExact = async (item: ContractItem & { consumed: number }) => {
    const key = item.id
    const val = parseFloat(editing[key] ?? '') 
    if (isNaN(val) || val < 0) { toast.error('Valor inválido'); return }
    setSaving(key)
    try {
      await onUpdateConsumed(contract.id, item.id, val)
      setEditing(prev => { const n = { ...prev }; delete n[key]; return n })
      toast.success('Saldo atualizado!')
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar')
    } finally { setSaving(null) }
  }

  const hasAlerts = itemsWithBalance.some(i => i.status === 'warning' || i.status === 'critical' || i.status === 'exceeded')

  return (
    <FloatingWindow
      open={open}
      onOpenChange={onOpenChange}
      title="Controle de Saldo"
      description={`Contrato ${contract.number} — ${contract.description}`}
    >
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-1 space-y-4">

          {/* Banner de alertas */}
          {hasAlerts && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 flex gap-2 items-start">
              <WarningCircle size={18} className="text-amber-500 mt-0.5 shrink-0" weight="duotone" />
              <div className="text-sm">
                <span className="font-semibold">Atenção: </span>
                {itemsWithBalance.filter(i => i.status !== 'ok').map(i => (
                  <span key={i.id} className="mr-2">
                    <strong>{i.description}</strong> — {(100 - i.pct).toFixed(0)}% restante{i.status === 'exceeded' ? ' (excedido!)' : ''};
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instrução */}
          <p className="text-xs text-muted-foreground px-1">
            Use o campo de quantidade para registrar consumo (+) ou estornar (−). O alerta vermelha quando restar ≤ 30% do saldo contratado.
          </p>

          {/* Tabela */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Item</TableHead>
                  <TableHead className="w-28 text-center">Contratado</TableHead>
                  <TableHead className="w-28 text-center">Consumido</TableHead>
                  <TableHead className="w-28 text-center">Saldo</TableHead>
                  <TableHead className="min-w-[180px]">Progresso</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-52">Lançar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsWithBalance.map(item => {
                  const cfg = statusConfig[item.status]
                  const isSavingThis = saving === item.id
                  return (
                    <TableRow key={item.id} className={item.status !== 'ok' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm leading-tight">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}/{item.unit}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        <span className="font-medium">{item.quantity}</span>
                        <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        <span className={`font-medium ${item.consumed > 0 ? cfg.color : 'text-muted-foreground'}`}>
                          {item.consumed}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        <span className={`font-bold ${item.status !== 'ok' ? cfg.color : ''}`}>
                          {Math.max(0, item.remaining).toFixed(item.remaining % 1 !== 0 ? 2 : 0)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[140px]">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Consumo</span>
                            <span className={item.status !== 'ok' ? cfg.color : ''}>{Math.min(item.pct, 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${cfg.bar}`}
                              style={{ width: `${Math.min(item.pct, 100)}%` }}
                            />
                          </div>
                          {item.status === 'exceeded' && (
                            <p className="text-[10px] text-purple-600 font-semibold">Quantidade excedida!</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="text-xs gap-1 whitespace-nowrap">
                          {item.status === 'ok'
                            ? <CheckCircle size={11} weight="fill" />
                            : <WarningCircle size={11} weight="fill" />}
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="Qtd"
                            value={editing[item.id] ?? ''}
                            onChange={e => setEditing(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="h-8 w-20 text-center text-sm"
                            disabled={isSavingThis}
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-green-700 border-green-300 hover:bg-green-50"
                            title="Registrar consumo"
                            disabled={isSavingThis}
                            onClick={() => handleAdd(item, 1)}
                          >
                            <Plus size={14} weight="bold" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-amber-700 border-amber-300 hover:bg-amber-50"
                            title="Estornar consumo"
                            disabled={isSavingThis}
                            onClick={() => handleAdd(item, -1)}
                          >
                            <Minus size={14} weight="bold" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 ml-0.5">
                          (+) consumir &nbsp;(−) estornar
                        </p>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Resumo financeiro */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { label: 'Valor Contratado', val: formatCurrency(contract.items.reduce((s,i) => s + i.quantity * i.unitPrice, 0)) },
              { label: 'Valor Consumido',  val: formatCurrency(contract.items.reduce((s,i) => s + (i.consumed ?? 0) * i.unitPrice, 0)) },
              { label: 'Saldo Financeiro', val: formatCurrency(contract.items.reduce((s,i) => s + Math.max(0, i.quantity - (i.consumed ?? 0)) * i.unitPrice, 0)) },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-lg border bg-card px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-bold tabular-nums mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </div>
    </FloatingWindow>
  )
}
