import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { LoginPage } from '@/components/LoginPage'
import { Dashboard } from '@/components/Dashboard'
import { ExpenseFormDialog, type ConsumedItemEntry } from '@/components/ExpenseFormDialog'
import { CreditorFormDialog } from '@/components/CreditorFormDialog'
import { ReportsDialog } from '@/components/ReportsDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import { ContractFormDialog } from '@/components/ContractFormDialog'
import { ContractItemsDialog } from '@/components/ContractItemsDialog'
import { ContractBalanceDialog } from '@/components/ContractBalanceDialog'
import { ExpensesView } from '@/components/views/ExpensesView'
import { CreditorsView } from '@/components/views/CreditorsView'
import { ContratosView } from '@/components/views/ContratosView'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { expensesApi, creditorsApi, categoriesApi, contractsApi } from '@/lib/api'
import { BottomBar } from '@/components/BottomBar'
import { AIAssistant } from '@/components/AIAssistant'
import { Expense, Creditor, Category, Contract, ContractItem, CatalogItem } from '@/lib/types'
import { formatCurrency, updateExpenseStatus } from '@/lib/calculations'
import {
  ChartPieSlice, Plus, SignOut, Wallet, Users, DownloadSimple,
  Gear, FileText, Sun, Moon, Bell,
} from '@phosphor-icons/react'
import { ThemeProvider, useTheme } from '@/lib/theme-context'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { catalogItemsApi } from '@/lib/api'

// â”€â”€ Tipos compartilhados â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type DeleteConfirm = { type: 'expense' | 'creditor' | 'contract'; id: string; label: string }

// â”€â”€ Componente principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AppContent() {
  const { currentUser, logout, isAuthenticated } = useAuth()
  const { toggleTheme, isDark } = useTheme()

  // Estado global
  const [expenses,     setExpenses]     = useState<Expense[]>([])
  const [creditors,    setCreditors]    = useState<Creditor[]>([])
  const [categories,   setCategories]   = useState<Category[]>([])
  const [contracts,    setContracts]    = useState<Contract[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [loading,      setLoading]      = useState(isAuthenticated) // true só se já autenticado

  // Navegação
  const [activeView, setActiveView] = useState('dashboard')

  // Diálogos
  const [expenseDialogOpen,       setExpenseDialogOpen]       = useState(false)
  const [editingExpense,          setEditingExpense]          = useState<Expense | null>(null)
  const [creditorDialogOpen,      setCreditorDialogOpen]      = useState(false)
  const [editingCreditor,         setEditingCreditor]         = useState<Creditor | null>(null)
  const [contractDialogOpen,      setContractDialogOpen]      = useState(false)
  const [editingContract,         setEditingContract]         = useState<Contract | null>(null)
  const [contractItemsDialogOpen, setContractItemsDialogOpen] = useState(false)
  const [contractForItems,        setContractForItems]        = useState<Contract | null>(null)
  const [balanceDialogOpen,       setBalanceDialogOpen]       = useState(false)
  const [contractForBalance,      setContractForBalance]      = useState<Contract | null>(null)
  const [reportsDialogOpen,       setReportsDialogOpen]       = useState(false)
  const [settingsDialogOpen,      setSettingsDialogOpen]      = useState(false)
  const [deleteConfirm,           setDeleteConfirm]           = useState<DeleteConfirm | null>(null)

  // Carrega dados ao autenticar
  useEffect(() => {
    if (!isAuthenticated) return
    setLoading(true)
    Promise.all([
      expensesApi.list().then(setExpenses),
      creditorsApi.list().then(setCreditors),
      categoriesApi.list().then(setCategories),
      contractsApi.list().then(setContracts),
      catalogItemsApi.list().then(setCatalogItems),
    ]).finally(() => setLoading(false))
  }, [isAuthenticated])

  if (!isAuthenticated) return <LoginPage />

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando dados...</p>
        </div>
      </div>
    )
  }

  // â”€â”€ Handlers: Despesas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ── Número sequencial de despesa ─────────────────────────
  const nextExpenseNumber = (() => {
    const year = new Date().getFullYear()
    const thisYear = expenses.filter((e) => e.number?.endsWith(`/${year}`))
    if (!thisYear.length) return `0001/${year}`
    const max = Math.max(...thisYear.map((e) => parseInt(e.number?.split('/')[0] || '0') || 0))
    return `${String(max + 1).padStart(4, '0')}/${year}`
  })()

  const handleSaveExpense = async (
    expenseData: Omit<Expense, 'id' | 'createdAt'>,
    consumedItems: ConsumedItemEntry[] = []
  ) => {
    // ── EDIÇÃO ──────────────────────────────────────────────
    if (editingExpense) {
      try {
        const updated: Expense = { ...editingExpense, ...expenseData }
        const saved = await expensesApi.update(editingExpense.id, updated)
        setExpenses((prev) => prev.map((e) => (e.id === saved.id ? saved : e)))
        toast.success('Despesa atualizada com sucesso!')
      } catch (e: any) { toast.error(e.message) }
      setEditingExpense(null)
      return
    }

    // ── CRIAÇÃO ──────────────────────────────────────────────
    const newExpense: Expense = {
      ...expenseData,
      id: `expense_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    try {
      const saved = await expensesApi.create(newExpense)
      setExpenses((prev) => [...prev, saved])

      if (expenseData.contractId && consumedItems.length > 0) {
        const contract = contracts.find((c) => c.id === expenseData.contractId)
        if (contract) {
          await Promise.all(
            consumedItems.map(async ({ itemId, qty }) => {
              const item = contract.items.find((i) => i.id === itemId)
              if (!item) return
              const newConsumed = (item.consumed ?? 0) + qty
              const updatedItem = await contractsApi.updateConsumed(contract.id, itemId, newConsumed)
              setContracts((prev) =>
                prev.map((c) =>
                  c.id !== contract.id
                    ? c
                    : { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, consumed: updatedItem.consumed } : i)) }
                )
              )
            })
          )
        }
      }
      toast.success('Despesa cadastrada com sucesso!')
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await expensesApi.remove(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
      toast.success('Despesa excluída')
    } catch (e: any) { toast.error(e.message) }
    setDeleteConfirm(null)
  }

  const handleToggleExpenseStatus = async (id: string) => {
    const expense = expenses.find((e) => e.id === id)
    if (!expense) return
    const updated = {
      ...expense,
      status: (expense.status === 'paid' ? 'pending' : 'paid') as Expense['status'],
      paidAt: expense.status === 'paid' ? undefined : new Date().toISOString(),
    }
    try {
      const saved = await expensesApi.update(id, updated)
      setExpenses((prev) => prev.map((e) => (e.id === id ? saved : e)))
      toast.success('Status atualizado')
    } catch (e: any) { toast.error(e.message) }
  }

  // â”€â”€ Handlers: Credores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCreditorSaved = (creditor: Creditor, isEdit: boolean) => {
    if (isEdit) {
      setCreditors((prev) => prev.map((c) => (c.id === creditor.id ? creditor : c)))
    } else {
      setCreditors((prev) => [...prev, creditor])
    }
  }

  const handleDeleteCreditor = async (id: string) => {
    try {
      await creditorsApi.remove(id)
      setCreditors((prev) => prev.filter((c) => c.id !== id))
      toast.success('Credor excluído')
    } catch (e: any) { toast.error(e.message || 'Erro ao excluir credor') }
  }

  // â”€â”€ Handlers: Contratos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSaveContract = async (data: Omit<Contract, 'id' | 'createdAt'>) => {
    try {
      if (editingContract) {
        const saved = await contractsApi.update(editingContract.id, data)
        setContracts((prev) => prev.map((c) => (c.id === saved.id ? saved : c)))
        toast.success('Contrato atualizado!')
      } else {
        const newContract: Contract = { ...data, id: `contract_${Date.now()}`, createdAt: new Date().toISOString() }
        const saved = await contractsApi.create(newContract)
        setContracts((prev) => [...prev, saved])
        toast.success('Contrato criado com sucesso!')
      }
    } catch (e: any) { toast.error(e.message) }
    setEditingContract(null)
  }

  const handleDeleteContract = async (id: string) => {
    try {
      await contractsApi.remove(id)
      setContracts((prev) => prev.filter((c) => c.id !== id))
      toast.success('Contrato excluído')
    } catch (e: any) { toast.error(e.message) }
    setDeleteConfirm(null)
  }

  const handleSaveContractItems = async (contractId: string, items: ContractItem[]) => {
    const contract = contracts.find((c) => c.id === contractId)
    if (!contract) return
    const updated = await contractsApi.update(contractId, { ...contract, items })
    setContracts((prev) => prev.map((c) => (c.id === contractId ? updated : c)))
  }

  const handleUpdateConsumed = async (contractId: string, itemId: string, consumed: number) => {
    const updatedItem = await contractsApi.updateConsumed(contractId, itemId, consumed)
    setContracts((prev) =>
      prev.map((c) =>
        c.id !== contractId
          ? c
          : { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, consumed: updatedItem.consumed } : i)) }
      )
    )
    setContractForBalance((prev) => {
      if (!prev || prev.id !== contractId) return prev
      return { ...prev, items: prev.items.map((i) => (i.id === itemId ? { ...i, consumed: updatedItem.consumed } : i)) }
    })
  }

  // â”€â”€ ConfirmaÃ§Ã£o de exclusÃ£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'expense')  handleDeleteExpense(deleteConfirm.id)
    else if (deleteConfirm.type === 'creditor') { handleDeleteCreditor(deleteConfirm.id); setDeleteConfirm(null) }
    else if (deleteConfirm.type === 'contract') handleDeleteContract(deleteConfirm.id)
  }

  const updatedExpenses = updateExpenseStatus(expenses)

  const overdueCount  = updatedExpenses.filter(e => e.status === 'overdue').length
  const pendingCount  = updatedExpenses.filter(e => e.status === 'pending').length

  // Saudação personalizada por horário
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  })()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard',  icon: ChartPieSlice, badge: 0 },
    { id: 'expenses',  label: 'Despesas',   icon: Wallet,        badge: overdueCount },
    { id: 'creditors', label: 'Credores',   icon: Users,         badge: 0 },
    { id: 'contratos', label: 'Contratos',  icon: FileText,      badge: 0 },
  ]

  const activeItem  = menuItems.find(m => m.id === activeView)
  const activeLabel = activeItem?.label ?? 'Dashboard'
  const ActiveIcon  = activeItem?.icon ?? ChartPieSlice

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard expenses={updatedExpenses} creditors={creditors} contracts={contracts} />
      case 'expenses':
        return (
          <ExpensesView
            expenses={updatedExpenses}
            creditors={creditors}
            categories={categories}
            contracts={contracts}
            onNewExpense={() => { setEditingExpense(null); setExpenseDialogOpen(true) }}
            onEditExpense={(e) => { setEditingExpense(e); setExpenseDialogOpen(true) }}
            onToggleStatus={handleToggleExpenseStatus}
            onDeleteConfirm={setDeleteConfirm}
          />
        )
      case 'creditors':
        return (
          <CreditorsView
            creditors={creditors}
            onNewCreditor={() => { setEditingCreditor(null); setCreditorDialogOpen(true) }}
            onEditCreditor={(c) => { setEditingCreditor(c); setCreditorDialogOpen(true) }}
            onDeleteConfirm={setDeleteConfirm}
          />
        )
      case 'contratos':
        return (
          <ContratosView
            contracts={contracts}
            creditors={creditors}
            catalogItems={catalogItems}
            onNewContract={() => { setEditingContract(null); setContractDialogOpen(true) }}
            onEditContract={(c) => { setEditingContract(c); setContractDialogOpen(true) }}
            onDeleteConfirm={setDeleteConfirm}
            onShowBalance={(c) => { setContractForBalance(c); setBalanceDialogOpen(true) }}
            onCatalogItemsChange={setCatalogItems}
          />
        )
      default:
        return null
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* â”€â”€ Sidebar â”€â”€ */}
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center justify-center px-3 py-4">
              <img
                src="/Logo SGFI.png"
                alt="Logo SGFI"
                className="w-full max-h-14 object-contain"
              />
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-2 overflow-hidden">
            <SidebarGroup>
              <SidebarGroupLabel>Módulos</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map(({ id, label, icon: Icon, badge }) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(id)}
                        isActive={activeView === id}
                        tooltip={label}
                        className="h-9 gap-3 rounded-lg"
                      >
                        <Icon size={18} weight={activeView === id ? 'fill' : 'regular'} />
                        <span className="flex-1 text-sm">{label}</span>
                        {badge > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] leading-none">
                            {badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="my-2" />

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1">Ações Rápidas</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setExpenseDialogOpen(true)} tooltip="Nova Despesa">
                      <Plus size={18} weight="bold" />
                      <span>Nova Despesa</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => { setEditingCreditor(null); setCreditorDialogOpen(true) }}
                      tooltip="Novo Credor"
                    >
                      <Plus size={18} weight="bold" />
                      <span>Novo Credor</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setReportsDialogOpen(true)} tooltip="Relatórios">
                      <DownloadSimple size={18} weight="bold" />
                      <span>Relatórios</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setSettingsDialogOpen(true)} tooltip="Configurações">
                      <Gear size={18} weight="fill" />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Alerta de vencidas */}
          {overdueCount > 0 && (
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                <Bell size={13} weight="fill" className="shrink-0" />
                <span className="font-medium">
                  {overdueCount} despesa{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          <SidebarFooter className="border-t border-sidebar-border p-3 pb-12">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{currentUser?.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize truncate">
                  {currentUser?.role === 'admin' ? 'âš¡ Administrador' : currentUser?.role?.replace('_', ' ')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Sair"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <SignOut size={16} />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* ── Main ── */}
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-3 px-6">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <div className="h-5 w-px bg-border mx-1" />
              <div className="flex items-center gap-2">
                <ActiveIcon size={18} weight="fill" className="text-primary" />
                <span className="font-display font-semibold text-sm text-foreground tracking-tight">
                  {activeLabel}
                </span>
              </div>
              <div className="flex-1" />
              <span className="hidden md:block text-xs text-muted-foreground">
                {greeting}, <span className="font-medium text-foreground">{currentUser?.name?.split(' ')[0]}</span>
              </span>
              <div className="hidden md:block h-4 w-px bg-border" />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={isDark ? 'Modo claro' : 'Modo escuro'}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                {isDark ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportsDialogOpen(true)}
                className="gap-2"
              >
                <DownloadSimple size={18} weight="bold" />
                Relatórios
              </Button>
            </div>
          </header>
          <div className="p-6 pb-14 min-h-full">{renderContent()}</div>
        </main>
      </div>

      {/* Diálogos globais */}
      <ExpenseFormDialog
        open={expenseDialogOpen}
        onOpenChange={(v) => { setExpenseDialogOpen(v); if (!v) setEditingExpense(null) }}
        onSave={handleSaveExpense}
        creditors={creditors}
        contracts={contracts}
        categories={categories}
        nextNumber={nextExpenseNumber}
        expense={editingExpense ?? undefined}
      />

      <CreditorFormDialog
        open={creditorDialogOpen}
        onOpenChange={setCreditorDialogOpen}
        editingCreditor={editingCreditor}
        onSaved={handleCreditorSaved}
      />

      <ContractFormDialog
        open={contractDialogOpen}
        onOpenChange={(v) => { setContractDialogOpen(v); if (!v) setEditingContract(null) }}
        onSave={handleSaveContract}
        creditors={creditors}
        initialData={editingContract}
        catalogItems={catalogItems}
      />

      <ContractItemsDialog
        open={contractItemsDialogOpen}
        onOpenChange={setContractItemsDialogOpen}
        contract={contractForItems}
        onSave={handleSaveContractItems}
        catalogItems={catalogItems}
      />

      <ContractBalanceDialog
        open={balanceDialogOpen}
        onOpenChange={setBalanceDialogOpen}
        contract={contractForBalance}
        onUpdateConsumed={handleUpdateConsumed}
      />

      <ReportsDialog
        open={reportsDialogOpen}
        onOpenChange={setReportsDialogOpen}
        expenses={updatedExpenses}
        creditors={creditors}
        categories={categories}
      />

      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />

      {/* â”€â”€ ConfirmaÃ§Ã£o de exclusÃ£o â”€â”€ */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(v) => { if (!v) setDeleteConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>&ldquo;{deleteConfirm?.label}&rdquo;</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AIAssistant
        activeView={activeView}
        expenses={updatedExpenses}
        creditors={creditors}
        contracts={contracts}
        userName={currentUser?.name}
      />
      <BottomBar />
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

