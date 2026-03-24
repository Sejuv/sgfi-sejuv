import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Wallet, TrendUp, CurrencyCircleDollar, Warning, FileText, Drop, Lightning } from '@phosphor-icons/react'
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Expense, Creditor, Contract } from '@/lib/types'
import {
  calculateDashboardMetrics,
  calculateForecast,
  getExpensesByType,
  getExpensesByClassification,
  getContractStats,
  formatCurrency,
  updateExpenseStatus,
} from '@/lib/calculations'
import { motion } from 'framer-motion'
import { useTheme } from '@/lib/theme-context'

interface DashboardProps {
  expenses: Expense[]
  creditors: Creditor[]
  contracts: Contract[]
}

export function Dashboard({ expenses, creditors, contracts }: DashboardProps) {
  const { isDark } = useTheme()
  const updatedExpenses = useMemo(() => updateExpenseStatus(expenses), [expenses])

  // Cores dos gráficos adaptadas ao tema
  const chartColorsType  = isDark
    ? ['oklch(0.65 0.18 255)', 'oklch(0.55 0.18 195)']
    : ['oklch(0.38 0.14 255)', 'oklch(0.58 0.18 195)']
  const chartColorsClass = isDark
    ? ['oklch(0.55 0.18 220)', 'oklch(0.68 0.17 68)', 'oklch(0.60 0.10 255)']
    : ['oklch(0.45 0.15 220)', 'oklch(0.60 0.18 80)', 'oklch(0.50 0.08 250)']
  const lineColorActual    = isDark ? 'oklch(0.65 0.18 255)' : 'oklch(0.38 0.14 255)'
  const lineColorProjected = isDark ? 'oklch(0.55 0.18 195)' : 'oklch(0.58 0.18 195)'
  const gridStroke  = isDark ? 'oklch(0.26 0.03 255)' : 'oklch(0.88 0.008 240)'
  const axisStroke  = isDark ? 'oklch(0.58 0.02 240)' : 'oklch(0.52 0.02 240)'
  const tooltipBg   = isDark ? '#1e2035' : '#ffffff'
  const tooltipBorder = isDark ? '#2e3155' : '#e2e8f0'

  const metrics = useMemo(
    () => calculateDashboardMetrics(updatedExpenses, contracts),
    [updatedExpenses, contracts]
  )

  const forecastData = useMemo(() => calculateForecast(updatedExpenses), [updatedExpenses])
  const expensesByType = useMemo(() => getExpensesByType(updatedExpenses), [updatedExpenses])
  const expensesByClass = useMemo(() => getExpensesByClassification(updatedExpenses), [updatedExpenses])
  const contractStats = useMemo(() => getContractStats(contracts), [contracts])

  const upcomingExpenses = useMemo(() => {
    const now = new Date()
    const limit = new Date()
    limit.setDate(limit.getDate() + 7)
    return updatedExpenses
      .filter((e) => {
        if (e.status === 'paid') return false
        const d = new Date(e.dueDate)
        return d >= now && d <= limit
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
  }, [updatedExpenses])

  const overdueExpenses = useMemo(
    () => updatedExpenses.filter((e) => e.status === 'overdue'),
    [updatedExpenses]
  )

  const contractUsagePct =
    contractStats.totalValue > 0
      ? Math.round((contractStats.consumedValue / contractStats.totalValue) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Dashboard Financeiro</h1>
        <p className="text-muted-foreground mt-1">Visão geral das finanças institucionais</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            delay: 0, borderColor: 'border-l-primary',
            title: 'Total Gasto (Mês)', value: formatCurrency(metrics.totalSpentThisMonth),
            sub: 'Despesas pagas no mês atual',
            icon: <Wallet className="h-5 w-5 text-primary" weight="duotone" />,
          },
          {
            delay: 0.08, borderColor: 'border-l-warning',
            title: 'Total a Pagar', value: formatCurrency(metrics.totalPending),
            sub: 'Despesas pendentes e vencidas',
            icon: <CurrencyCircleDollar className="h-5 w-5 text-warning" weight="duotone" />,
          },
          {
            delay: 0.16, borderColor: 'border-l-accent',
            title: 'Saldo Disponível', value: formatCurrency(metrics.availableBalance),
            sub: contractStats.totalValue > 0 ? 'Saldo dos contratos ativos' : 'Nenhum contrato ativo',
            icon: <TrendUp className="h-5 w-5 text-accent" weight="duotone" />,
          },
          {
            delay: 0.24, borderColor: 'border-l-destructive',
            title: 'Vencimentos Próximos', value: String(metrics.upcomingDueCount),
            sub: 'Próximos 7 dias',
            icon: <Warning className="h-5 w-5 text-destructive" weight="duotone" />,
          },
        ].map(({ delay, borderColor, title, value, sub, icon }) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.45 }}
          >
            <Card className={`border-l-4 ${borderColor} card-hover`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display tabular-nums">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Card de contratos ativos */}
      {contracts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="font-display flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" weight="duotone" />
                  Contratos Ativos
                </CardTitle>
                <CardDescription>Execução orçamentária dos contratos vigentes</CardDescription>
              </div>
              <Badge variant="outline" className="text-sm font-semibold">
                {contractStats.activeCount} ativo{contractStats.activeCount !== 1 ? 's' : ''}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Consumido</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(contractStats.consumedValue)}{' '}
                  <span className="text-muted-foreground font-normal">
                    / {formatCurrency(contractStats.totalValue)}
                  </span>
                </span>
              </div>
              <Progress value={contractUsagePct} className="h-3" />
              <p className="text-xs text-muted-foreground">{contractUsagePct}% do valor total já foi consumido</p>

              {contractStats.expiringSoon.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-warning">
                    ⚠ {contractStats.expiringSoon.length} contrato(s) vencem em até 30 dias:
                  </p>
                  {contractStats.expiringSoon.map((c) => (
                    <div key={c.id} className="flex justify-between items-center text-sm border rounded p-2">
                      <span className="font-medium">{c.number} – {c.description}</span>
                      <Badge variant="outline">
                        {new Date(c.endDate).toLocaleDateString('pt-BR')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Alerta de despesas vencidas */}
      {overdueExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Alert variant="destructive">
            <Warning className="h-5 w-5" />
            <AlertDescription className="ml-2">
              <strong>Atenção!</strong> Você tem {overdueExpenses.length} despesa(s) vencida(s){' '}
              totalizando {formatCurrency(overdueExpenses.reduce((sum, e) => sum + e.amount, 0))}.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Gráficos */}
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
              {expensesByType.every((d) => d.value === 0) ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  Nenhuma despesa registrada
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    >
                      {expensesByType.map((_, index) => (
                        <Cell key={`type-${index}`} fill={chartColorsType[index % chartColorsType.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Gastos por Classificação</CardTitle>
              <CardDescription>Água, energia e outros</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByClass.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  Nenhuma despesa classificada
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByClass}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    >
                      {expensesByClass.map((_, index) => (
                        <Cell key={`class-${index}`} fill={chartColorsClass[index % chartColorsClass.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Projeção de Gastos</CardTitle>
              <CardDescription>Baseado na média dos últimos 3 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" tick={{ fill: axisStroke }} />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} tick={{ fill: axisStroke }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke={lineColorActual}
                    strokeWidth={2}
                    name="Real"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke={lineColorProjected}
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

      {/* Despesas a vencer */}
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
                  const ClassIcon =
                    expense.classification === 'agua'
                      ? Drop
                      : expense.classification === 'energia'
                      ? Lightning
                      : null

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-1">
                          {ClassIcon && <ClassIcon className="h-4 w-4 text-muted-foreground" />}
                          {expense.description}
                          {expense.number && (
                            <span className="text-xs text-muted-foreground ml-1">#{expense.number}</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {creditor?.name || 'Credor não encontrado'}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-semibold tabular-nums">{formatCurrency(expense.amount)}</p>
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
