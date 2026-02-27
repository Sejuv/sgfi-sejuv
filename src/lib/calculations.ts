import { Expense, MonthlyData, DashboardMetrics } from './types'

export function calculateDashboardMetrics(
  expenses: Expense[],
  availableBalance: number
): DashboardMetrics {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const totalSpentThisMonth = expenses
    .filter((expense) => {
      if (expense.status !== 'paid') return false
      const paidDate = new Date(expense.paidAt || expense.createdAt)
      return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  const totalPending = expenses
    .filter((expense) => expense.status === 'pending' || expense.status === 'overdue')
    .reduce((sum, expense) => sum + expense.amount, 0)

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const upcomingDueCount = expenses.filter((expense) => {
    if (expense.status === 'paid') return false
    const dueDate = new Date(expense.dueDate)
    return dueDate >= now && dueDate <= sevenDaysFromNow
  }).length

  return {
    totalSpentThisMonth,
    totalPending,
    availableBalance,
    upcomingDueCount,
  }
}

export function calculateForecast(expenses: Expense[]): MonthlyData[] {
  const now = new Date()
  const monthlyTotals: Record<string, number> = {}

  expenses
    .filter((expense) => expense.status === 'paid')
    .forEach((expense) => {
      const paidDate = new Date(expense.paidAt || expense.createdAt)
      const monthKey = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount
    })

  const last3Months = []
  for (let i = 2; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    last3Months.push(monthlyTotals[monthKey] || 0)
  }

  const average = last3Months.reduce((sum, val) => sum + val, 0) / 3

  const result: MonthlyData[] = []

  for (let i = 0; i < 3; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

    result.push({
      month: monthName,
      actual: monthlyTotals[monthKey] || 0,
      projected: Math.round(average),
    })
  }

  return result
}

export function updateExpenseStatus(expenses: Expense[]): Expense[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  return expenses.map((expense) => {
    if (expense.status === 'paid') return expense

    const dueDate = new Date(expense.dueDate)
    dueDate.setHours(0, 0, 0, 0)

    if (dueDate < now) {
      return { ...expense, status: 'overdue' as const }
    }

    return expense
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function getExpensesByType(expenses: Expense[]) {
  const fixed = expenses.filter((e) => e.type === 'fixed').reduce((sum, e) => sum + e.amount, 0)
  const variable = expenses.filter((e) => e.type === 'variable').reduce((sum, e) => sum + e.amount, 0)

  return [
    { name: 'Fixos', value: fixed },
    { name: 'Variáveis', value: variable },
  ]
}
