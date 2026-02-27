export type UserRole = 'admin' | 'finance_manager' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
}

export interface Creditor {
  id: string
  name: string
  documentNumber: string
  contact: string
  email?: string
  cep?: string
  street?: string
  neighborhood?: string
  city?: string
  uf?: string
}

export type ExpenseType = 'fixed' | 'variable'
export type ExpenseStatus = 'paid' | 'pending' | 'overdue'

export interface Expense {
  id: string
  description: string
  amount: number
  type: ExpenseType
  dueDate: string
  month: string
  status: ExpenseStatus
  creditorId: string
  categoryId?: string
  contractId?: string
  createdAt: string
  paidAt?: string
}

export interface Category {
  id: string
  name: string
  type: ExpenseType
  color?: string
}

export type ContractStatus = 'active' | 'expired' | 'cancelled' | 'pending'

export interface CatalogItem {
  id: string
  description: string
  category?: string
  unit: string
  unitPrice: number
  pncpCatalog?: string
  pncpClassification?: string
  pncpSubclassification?: string
  specification?: string
  keyword1?: string
  keyword2?: string
  keyword3?: string
  keyword4?: string
  notes?: string
}

export interface ContractItem {
  id: string
  catalogItemId?: string
  description: string
  quantity: number
  consumed: number
  unitPrice: number
  unit: string
}

export interface Contract {
  id: string
  number: string
  description: string
  creditorId: string
  status: ContractStatus
  startDate: string
  endDate: string
  items: ContractItem[]
  createdAt: string
  notes?: string
  alertNewContract?: number   // dias antes do fim para alerta de nova contratação
  alertAdditive?: number      // dias antes do fim para alerta de aditivo de prazo
}

export interface DashboardMetrics {
  totalSpentThisMonth: number
  totalPending: number
  availableBalance: number
  upcomingDueCount: number
}

export interface MonthlyData {
  month: string
  actual: number
  projected: number
}
