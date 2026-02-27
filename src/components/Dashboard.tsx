import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendUp, CurrencyCircleDollar, Warning } from '@phosphor-icons/react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Expense, Creditor } from '@/lib/types'
import { calculateDashboardMetrics, calculateForecast, getExpensesByType, formatCurrency, updateExpenseStatus } from '@/lib/calculations'
import { motion } from 'framer-motion'

interface DashboardProps {
  expenses: Expense[]
  creditors: Creditor[]
}

const COLORS = ['oklch(0.35 0.08 250)', 'oklch(0.65 0.15 190)']

export function Dashboard({ expenses, creditors }: DashboardProps) {
  const updatedExpenses = useMemo(() => updateExpenseStatus(expenses), [expenses])

  const metrics = useMemo(
    () => calculateDashboardMetrics(updatedExpenses, 50000),
    [updatedExpenses]
  )

  const forecastData = useMemo(() => calculateForecast(updatedExpenses), [updatedExpenses])

  const expensesByType = useMemo(() => getExpensesByType(updatedExpenses), [updatedExpenses])

  const upcomingExpenses = useMemo(() => {
    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    return updatedExpenses
      .filter((expense) => {
        if (expense.status === 'paid') return false
        const dueDate = new Date(expense.dueDate)
        return dueDate >= now && dueDate <= sevenDaysFromNow
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
  }, [updatedExpenses])

  const overdueExpenses = useMemo(
    () => updatedExpenses.filter((expense) => expense.status === 'overdue'),
    [updatedExpenses]
  )

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Dashboard Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das finanças institucionais
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial="hidden" animate="visible" variants={cardVariants} transition={{ delay: 0, duration: 0.5 }}>
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gasto (Mês)</CardTitle>
              <Wallet className="h-5 w-5 text-primary" weight="duotone" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display tabular-nums">
                {formatCurrency(metrics.totalSpentThisMonth)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Despesas pagas no mês atual
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={cardVariants} transition={{ delay: 0.08, duration: 0.5 }}>
          <Card className="border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
              <CurrencyCircleDollar className="h-5 w-5 text-warning" weight="duotone" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display tabular-nums">
                {formatCurrency(metrics.totalPending)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Despesas pendentes e vencidas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={cardVariants} transition={{ delay: 0.16, duration: 0.5 }}>
          <Card className="border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
              <TrendUp className="h-5 w-5 text-accent" weight="duotone" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display tabular-nums">
                {formatCurrency(metrics.availableBalance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Orçamento disponível
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={cardVariants} transition={{ delay: 0.24, duration: 0.5 }}>
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencimentos Próximos</CardTitle>
              <Warning className="h-5 w-5 text-destructive" weight="duotone" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display tabular-nums">
                {metrics.upcomingDueCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Próximos 7 dias
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {overdueExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Alert variant="destructive" className="animate-pulse-warning">
            <Warning className="h-5 w-5" />
            <AlertDescription className="ml-2">
              <strong>Atenção!</strong> Você tem {overdueExpenses.length} despesa(s) vencida(s)
              totalizando {formatCurrency(overdueExpenses.reduce((sum, e) => sum + e.amount, 0))}.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Gastos por Tipo</CardTitle>
              <CardDescription>Distribuição entre fixos e variáveis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  >
                    {expensesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Projeção de Gastos</CardTitle>
              <CardDescription>
                Baseado na média dos últimos 3 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="oklch(0.35 0.08 250)"
                    strokeWidth={2}
                    name="Real"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="oklch(0.65 0.15 190)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Projetado"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {upcomingExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Despesas a Vencer (7 dias)</CardTitle>
              <CardDescription>Pagamentos que requerem atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingExpenses.map((expense) => {
                  const creditor = creditors.find((c) => c.id === expense.creditorId)
                  const daysUntilDue = Math.ceil(
                    (new Date(expense.dueDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {creditor?.name || 'Credor não encontrado'}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-semibold tabular-nums">
                            {formatCurrency(expense.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Vence em {daysUntilDue} dia{daysUntilDue !== 1 && 's'}
                          </p>
                        </div>
                        <Badge variant={daysUntilDue <= 2 ? 'destructive' : 'outline'}>
                          {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
