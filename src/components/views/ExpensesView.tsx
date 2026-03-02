import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Wallet, Trash, Drop, Lightning, PencilSimple } from '@phosphor-icons/react'
import { Expense, Creditor } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/calculations'

interface DeleteConfirm {
  type: 'expense' | 'creditor' | 'contract'
  id: string
  label: string
}

interface ExpensesViewProps {
  expenses: Expense[]
  creditors: Creditor[]
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

export function ExpensesView({
  expenses,
  creditors,
  onNewExpense,
  onEditExpense,
  onToggleStatus,
  onDeleteConfirm,
}: ExpensesViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display">Gerenciar Despesas</CardTitle>
            <CardDescription>Cadastre e acompanhe todas as despesas</CardDescription>
          </div>
          <Button onClick={onNewExpense}>
            <Plus className="mr-2" size={18} weight="bold" />
            Nova Despesa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhuma despesa cadastrada ainda.</p>
            <p className="text-sm">Clique em "Nova Despesa" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Nº Despesa</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Credor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Mês</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const creditor = creditors.find((c) => c.id === expense.creditorId)
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold text-primary">
                          {expense.number || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-0.5">
                          <span>{expense.description}</span>
                          <ClassificationBadge classification={expense.classification} />
                        </div>
                      </TableCell>
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
                          className="cursor-pointer"
                          onClick={() => onToggleStatus(expense.id)}
                        >
                          {expense.status === 'paid'
                            ? 'Pago'
                            : expense.status === 'overdue'
                            ? 'Vencido'
                            : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditExpense(expense)}
                            className="gap-1 text-primary border-primary/40 hover:bg-primary/10"
                          >
                            <PencilSimple size={14} weight="bold" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onDeleteConfirm({
                                type: 'expense',
                                id: expense.id,
                                label: `${expense.number ? expense.number + ' – ' : ''}${expense.description}`,
                              })
                            }
                            title="Excluir despesa"
                          >
                            <Trash size={16} className="text-destructive" />
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
  )
}