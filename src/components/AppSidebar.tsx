import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { FileText, ChartPie, ChartBar, Building, ClockCounterClockwise, CheckCircle, Database, CloudArrowDown, Users, Cloud, ClipboardText, ChartLineUp, SignOut } from "@phosphor-icons/react"
import { canView } from "@/lib/permissions"
import type { Usuario } from "@/lib/types"
import { useConfigSistema } from "@/components/ConfiguracoesSistema"

interface AppSidebarProps {
  abaAtiva: string
  onAbaChange: (aba: string) => void
  estatisticas: {
    total: number
    pendentes: number
    quantidade: number
  }
  usuario?: Usuario | null
  onLogout: () => void
}

export function AppSidebar({ abaAtiva, onAbaChange, estatisticas, usuario, onLogout }: AppSidebarProps) {
  const config = useConfigSistema()
  
  const menuItems = [
    {
      title: "Processos",
      icon: FileText,
      value: "processos",
      modulo: "processos" as const,
    },
    {
      title: "Previsões",
      icon: ChartLineUp,
      value: "previsoes",
      modulo: "previsoes" as const,
    },
    {
      title: "Métricas",
      icon: ChartPie,
      value: "metricas",
      modulo: "metricas" as const,
    },
    {
      title: "Resumo Financeiro",
      icon: ChartBar,
      value: "resumo",
      modulo: "resumo" as const,
    },
    {
      title: "Cadastros",
      icon: Database,
      value: "cadastros",
      modulo: "cadastros" as const,
    },
    {
      title: "Usuários",
      icon: Users,
      value: "usuarios",
      modulo: "usuarios" as const,
    },
    {
      title: "Logs",
      icon: ClipboardText,
      value: "logs",
      modulo: null, // Logs sempre visíveis
    },
    {
      title: "Sincronização",
      icon: CloudArrowDown,
      value: "sincronizacao",
      modulo: "sincronizacao" as const,
    },
    {
      title: "Firebase / Deploy",
      icon: Cloud,
      value: "firebase",
      modulo: "firebase" as const,
    },
  ]

  // Filtrar itens baseado em permissões
  // Se não há usuário logado, mostrar todos (modo desenvolvimento)
  const menuItemsFiltrados = menuItems.filter((item) => {
    if (!usuario) return true // Mostrar tudo se não tiver usuário
    if (!item.modulo) return true // Sempre mostrar logs
    return canView(usuario, item.modulo)
  })

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-center w-full h-20">
          <img 
            src={config.logoTopo || "/logo.svg"}
            alt="Logo do Sistema" 
            className="w-full h-full object-contain"
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItemsFiltrados.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onAbaChange(item.value)}
                    isActive={abaAtiva === item.value}
                    className="gap-3"
                  >
                    <item.icon className="h-5 w-5" weight={abaAtiva === item.value ? "fill" : "regular"} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Resumo</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Total</span>
                </div>
                <span className="font-semibold text-foreground">{estatisticas.quantidade}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-600">
                  <ClockCounterClockwise className="h-4 w-4" />
                  <span>Pendentes</span>
                </div>
                <span className="font-semibold text-amber-700">{estatisticas.pendentes}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Concluídos</span>
                </div>
                <span className="font-semibold text-emerald-700">
                  {estatisticas.quantidade - estatisticas.pendentes}
                </span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <SignOut className="h-4 w-4" weight="duotone" />
          <span>Sair</span>
        </button>
        <div className="text-xs text-muted-foreground mt-3">
          <p className="font-medium">Secretaria de Finanças</p>
          <p className="mt-1">Sistema Municipal</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
