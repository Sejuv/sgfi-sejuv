import { useState, useMemo, useEffect } from "react"
import { useFirebaseKV } from "@/hooks/useFirebaseKV"
import { ProcessoDespesa, Usuario, SessaoUsuario } from "@/lib/types"
import { validarCredenciais, criarSessao, criarUsuarioInicial } from "@/lib/auth-service"
import { Login } from "@/components/Login"
import { ProcessoForm } from "@/components/ProcessoForm"
import { WorkflowDialog } from "@/components/WorkflowDialog"
import { ImportProcessosDialog } from "@/components/ImportProcessosDialog"
import { FiltrosPanel, Filtros } from "@/components/FiltrosPanel"
import { ProcessosTable } from "@/components/ProcessosTable"
import { ResumoFinanceiro } from "@/components/ResumoFinanceiro"
import { PainelMetricas } from "@/components/PainelMetricas"
import { PainelCadastros } from "@/components/PainelCadastros"
import { PainelUsuarios } from "@/components/PainelUsuarios"
import { PainelLogs } from "@/components/PainelLogs"
import { SyncPanel } from "@/components/SyncPanel"
import { MigracaoFirebase } from "@/components/MigracaoFirebase"
import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Plus, FileArrowUp, SignOut } from "@phosphor-icons/react"
import { toast, Toaster } from "sonner"
import { logService } from "@/lib/log-service"

function App() {
  const [processos, setProcessos] = useFirebaseKV<ProcessoDespesa[]>("processos-despesas", [])
  const [usuarios, setUsuarios] = useFirebaseKV<Usuario[]>("usuarios", [])
  const [sessao, setSessao] = useFirebaseKV<SessaoUsuario | null>("sessao-atual", null)
  const [erroLogin, setErroLogin] = useState<string>("")
  const [formOpen, setFormOpen] = useState(false)
  const [workflowOpen, setWorkflowOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [processoEditando, setProcessoEditando] = useState<ProcessoDespesa | undefined>()
  const [processoWorkflow, setProcessoWorkflow] = useState<ProcessoDespesa | undefined>()
  const [filtros, setFiltros] = useState<Filtros>({ apenaspendentes: false })
  const [abaAtiva, setAbaAtiva] = useState("processos")

  const processosArray = processos || []

  const processosFiltrados = useMemo(() => {
    return processosArray.filter((processo) => {
      if (filtros.ano && processo.ano !== filtros.ano) return false
      if (filtros.secretaria && processo.secretaria !== filtros.secretaria) return false
      if (filtros.mes && processo.mes !== filtros.mes) return false
      if (filtros.recurso && processo.recurso !== filtros.recurso) return false
      if (filtros.credor && processo.credor !== filtros.credor) return false
      if (filtros.did && (!processo.did || !processo.did.toLowerCase().includes(filtros.did.toLowerCase()))) return false
      if (filtros.nf && (!processo.nf || !processo.nf.toLowerCase().includes(filtros.nf.toLowerCase()))) return false
      if (filtros.apenaspendentes && processo.dataTesouraria) return false
      return true
    })
  }, [processosArray, filtros])

  const estatisticas = useMemo(() => {
    const total = processosFiltrados.reduce((acc, p) => acc + p.valor, 0)
    const pendentes = processosFiltrados.filter((p) => !p.dataTesouraria).length
    return { total, pendentes, quantidade: processosFiltrados.length }
  }, [processosFiltrados])

  useEffect(() => {
    const inicializarUsuarios = async () => {
      const usuariosExistentes = usuarios || []
      
      if (usuariosExistentes.length === 0) {
        const usuarioAdmin = await criarUsuarioInicial()
        setUsuarios([usuarioAdmin])
      }
    }
    
    // Só inicializa uma vez quando o componente monta
    inicializarUsuarios()
  }, [])

  const handleLogin = async (email: string, senha: string): Promise<boolean> => {
    const usuariosArray = usuarios || []
    
    const usuario = await validarCredenciais(email, senha, usuariosArray)
    
    if (usuario) {
      const novaSessao = criarSessao(usuario)
      setSessao(novaSessao)
      
      setUsuarios((current) =>
        (current || []).map((u) =>
          u.id === usuario.id ? { ...u, ultimoAcesso: new Date().toISOString() } : u
        )
      )
      
      // Registrar log de login
      logService.registrarLog(
        usuario.id,
        usuario.nome,
        usuario.email,
        'login',
        'Login',
        `Login realizado com sucesso`
      )
      
      setErroLogin("")
      toast.success(`Bem-vindo, ${usuario.nome}!`)
      return true
    } else {
      setErroLogin("Email ou senha inválidos")
      return false
    }
  }

  const handleLogout = () => {
    if (sessao) {
      logService.registrarLog(
        sessao.usuarioId,
        sessao.nome,
        sessao.email,
        'logout',
        'Login',
        `Logout realizado`
      )
    }
    setSessao(null)
    toast.info("Você saiu do sistema")
  }

  const handleAtualizarUsuario = (usuarioAtualizado: Usuario) => {
    setUsuarios((current) => 
      (current || []).map((u) => u.id === usuarioAtualizado.id ? usuarioAtualizado : u)
    )
  }

  if (!sessao) {
    return (
      <>
        <Toaster richColors position="top-right" />
        <Login 
          onLogin={handleLogin} 
          erro={erroLogin} 
          usuarios={usuarios || []}
          onAtualizarUsuario={handleAtualizarUsuario}
        />
      </>
    )
  }

  const handleSaveProcesso = (processoData: Omit<ProcessoDespesa, "id"> & { id?: string }) => {
    const isEdit = !!processoData.id
    
    setProcessos((current) => {
      const currentArray = current || []
      if (processoData.id) {
        return currentArray.map((p) => (p.id === processoData.id ? (processoData as ProcessoDespesa) : p))
      } else {
        const novoProcesso: ProcessoDespesa = {
          ...processoData,
          id: Date.now().toString(),
        }
        return [...currentArray, novoProcesso]
      }
    })
    
    // Registrar log
    if (sessao) {
      logService.registrarLog(
        sessao.usuarioId,
        sessao.nome,
        sessao.email,
        isEdit ? 'editar' : 'criar',
        'Processos',
        `Processo ${processoData.nf || 'S/N'} - ${isEdit ? 'editado' : 'criado'}`
      )
    }
    
    toast.success(processoData.id ? "Processo atualizado com sucesso" : "Processo criado com sucesso")
    setProcessoEditando(undefined)
  }

  const handleDeleteProcesso = (id: string) => {
    const processo = processosArray.find(p => p.id === id)
    
    setProcessos((current) => (current || []).filter((p) => p.id !== id))
    
    // Registrar log
    if (sessao && processo) {
      logService.registrarLog(
        sessao.usuarioId,
        sessao.nome,
        sessao.email,
        'excluir',
        'Processos',
        `Processo ${processo.nf || 'S/N'} excluído`
      )
    }
    
    toast.success("Processo excluído com sucesso")
  }

  const handleEditProcesso = (processo: ProcessoDespesa) => {
    setProcessoEditando(processo)
    setFormOpen(true)
  }

  const handleNovoProcesso = () => {
    setProcessoEditando(undefined)
    setFormOpen(true)
  }

  const handleWorkflow = (processo: ProcessoDespesa) => {
    setProcessoWorkflow(processo)
    setWorkflowOpen(true)
  }

  const handleSaveWorkflow = (processoAtualizado: ProcessoDespesa) => {
    setProcessos((current) => (current || []).map((p) => (p.id === processoAtualizado.id ? processoAtualizado : p)))
    toast.success("Trâmite atualizado com sucesso")
  }

  const handleImportProcessos = (processosImportados: Omit<ProcessoDespesa, "id">[]) => {
    setProcessos((current) => {
      const currentArray = current || []
      const novosProcessos = processosImportados.map((p, index) => ({
        ...p,
        id: `${Date.now()}-${index}`,
      }))
      return [...currentArray, ...novosProcessos]
    })
  }

  return (
    <SidebarProvider>
      <Toaster richColors position="top-right" />
      
      <AppSidebar abaAtiva={abaAtiva} onAbaChange={setAbaAtiva} estatisticas={estatisticas} />
      
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2 px-3 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-base md:text-lg font-semibold text-primary">
                Sistema de Gestão de Processos
              </h1>
              <p className="text-xs text-muted-foreground hidden lg:block">
                {sessao.nome} - {sessao.email}
              </p>
            </div>
            {abaAtiva === "processos" && (
              <div className="flex gap-2">
                <Button onClick={() => setImportOpen(true)} variant="outline" size="default" className="gap-2">
                  <FileArrowUp className="h-4 w-4" weight="bold" />
                  Importar
                </Button>
                <Button onClick={handleNovoProcesso} size="default" className="gap-2">
                  <Plus className="h-4 w-4" weight="bold" />
                  Novo Processo
                </Button>
              </div>
            )}
            <Button onClick={handleLogout} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <SignOut className="h-5 w-5" weight="bold" />
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-3 md:p-4 bg-gradient-to-br from-background via-primary/5 to-background overflow-y-scroll min-h-0">
          {abaAtiva === "processos" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 shrink-0">
                <Card className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Filtrado
                  </p>
                  <p className="text-lg font-bold text-primary mt-0.5 tabular-nums">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      estatisticas.total
                    )}
                  </p>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Processos
                  </p>
                  <p className="text-lg font-bold text-accent mt-0.5 tabular-nums">
                    {estatisticas.quantidade}
                  </p>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-amber-100/50 to-amber-50/50 border-amber-200">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pendentes
                  </p>
                  <p className="text-lg font-bold text-amber-700 mt-0.5 tabular-nums">
                    {estatisticas.pendentes}
                  </p>
                </Card>
              </div>

              <div className="shrink-0">
                <FiltrosPanel filtros={filtros} onFiltrosChange={setFiltros} />
              </div>
            </>
          )}

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {abaAtiva === "processos" && (
              <ProcessosTable
                processos={processosFiltrados}
                onEdit={handleEditProcesso}
                onDelete={handleDeleteProcesso}
                onWorkflow={handleWorkflow}
              />
            )}

            {abaAtiva === "metricas" && (
              <PainelMetricas processos={processosFiltrados} />
            )}

            {abaAtiva === "resumo" && (
              <ResumoFinanceiro processos={processosFiltrados} />
            )}

            {abaAtiva === "cadastros" && (
              <PainelCadastros />
            )}

            {abaAtiva === "usuarios" && (
              <PainelUsuarios />
            )}

            {abaAtiva === "logs" && (
              <PainelLogs />
            )}

            {abaAtiva === "sincronizacao" && (
              <SyncPanel />
            )}

            {abaAtiva === "firebase" && (
              <div className="p-6 max-w-2xl">
                <MigracaoFirebase />
              </div>
            )}
          </div>
        </main>

        <ProcessoForm
          open={formOpen}
          onOpenChange={setFormOpen}
          processo={processoEditando}
          onSave={handleSaveProcesso}
        />

        <ImportProcessosDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImport={handleImportProcessos}
        />

        {processoWorkflow && (
          <WorkflowDialog
            open={workflowOpen}
            onOpenChange={setWorkflowOpen}
            processo={processoWorkflow}
            onSave={handleSaveWorkflow}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App