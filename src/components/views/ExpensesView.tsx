import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Wallet, Trash } from '@phosphor-icons/react'
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
  onToggleStatus: (id: string) => void
  onDeleteConfirm: (confirm: DeleteConfirm) => void
}

export function ExpensesView({
  expenses,
  creditors,
  onNewExpense,
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onDeleteConfirm({
                              type: 'expense',
                              id: expense.id,
                              label: expense.description,
                            })
                          }
                        >
                          <Trash size={16} className="text-destructive" />
                        </Button>
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
