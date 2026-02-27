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
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { expensesApi, creditorsApi, categoriesApi, contractsApi } from '@/lib/api'
import { Expense, Creditor, Category, Contract, ContractItem, CatalogItem } from '@/lib/types'
import { formatCurrency, updateExpenseStatus } from '@/lib/calculations'
import {
  ChartPieSlice, Plus, SignOut, Wallet, Users, DownloadSimple,
  Gear, FileText,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { catalogItemsApi } from '@/lib/api'

// â”€â”€ Tipos compartilhados â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type DeleteConfirm = { type: 'expense' | 'creditor' | 'contract'; id: string; label: string }

// â”€â”€ Componente principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AppContent() {
  const { currentUser, logout, isAuthenticated } = useAuth()

  // Estado global
  const [expenses,     setExpenses]     = useState<Expense[]>([])
  const [creditors,    setCreditors]    = useState<Creditor[]>([])
  const [categories,   setCategories]   = useState<Category[]>([])
  const [contracts,    setContracts]    = useState<Contract[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [loading,      setLoading]      = useState(true)

  // Navegação
  const [activeView, setActiveView] = useState('dashboard')

  // Diálogos
  const [expenseDialogOpen,       setExpenseDialogOpen]       = useState(false)
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
  const handleSaveExpense = async (
    expenseData: Omit<Expense, 'id' | 'createdAt'>,
    consumedItems: ConsumedItemEntry[] = []
  ) => {
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard',  icon: ChartPieSlice },
    { id: 'expenses',  label: 'Despesas',   icon: Wallet },
    { id: 'creditors', label: 'Credores',   icon: Users },
    { id: 'contratos', label: 'Contratos',  icon: FileText },
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard expenses={updatedExpenses} creditors={creditors} />
      case 'expenses':
        return (
          <ExpensesView
            expenses={updatedExpenses}
            creditors={creditors}
            onNewExpense={() => setExpenseDialogOpen(true)}
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
      <div className="flex min-h-screen w-full bg-gradient-to-br from-muted/20 via-background to-primary/5">
        {/* â”€â”€ Sidebar â”€â”€ */}
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Wallet size={24} weight="duotone" className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold font-display">SGFI</h1>
                <p className="text-xs text-muted-foreground">Sistema Financeiro</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Módulos</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map(({ id, label, icon: Icon }) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(id)}
                        isActive={activeView === id}
                        tooltip={label}
                      >
                        <Icon size={20} weight={activeView === id ? 'fill' : 'regular'} />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Ações Rápidas</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setExpenseDialogOpen(true)} tooltip="Nova Despesa">
                      <Plus size={20} weight="bold" />
                      <span>Nova Despesa</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => { setEditingCreditor(null); setCreditorDialogOpen(true) }}
                      tooltip="Novo Credor"
                    >
                      <Plus size={20} weight="bold" />
                      <span>Novo Credor</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setReportsDialogOpen(true)} tooltip="Relatórios">
                      <DownloadSimple size={20} weight="bold" />
                      <span>Relatórios</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setSettingsDialogOpen(true)} tooltip="Configurações">
                      <Gear size={20} weight="fill" />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-3 px-4 py-3 border-t">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{currentUser?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize truncate">
                      {currentUser?.role?.replace('_', ' ')}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={logout} title="Sair">
                    <SignOut size={18} />
                  </Button>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* â”€â”€ Main â”€â”€ */}
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1" />
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
          <div className="p-6">{renderContent()}</div>
        </main>
      </div>

      {/* Diálogos globais */}
      <ExpenseFormDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        onSave={handleSaveExpense}
        creditors={creditors}
        contracts={contracts}
        categories={categories}
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
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  )
}

