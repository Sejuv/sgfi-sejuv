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
import { FileText, ChartPie, ChartBar, Building, ClockCounterClockwise, CheckCircle, Database, CloudArrowDown, Users, Cloud, ClipboardText, ChartLineUp } from "@phosphor-icons/react"
import { canView } from "@/lib/permissions"
import type { Usuario } from "@/lib/types"

interface AppSidebarProps {
  abaAtiva: string
  onAbaChange: (aba: string) => void
  estatisticas: {
    total: number
    pendentes: number
    quantidade: number
  }
  usuario?: Usuario | null
}

export function AppSidebar({ abaAtiva, onAbaChange, estatisticas, usuario }: AppSidebarProps) {
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
      modulo: "sincronizacao" as const, // Usa mesma permissão de sincronização
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
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Building className="h-6 w-6 text-primary-foreground" weight="bold" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Gestão de Processos</h2>
            <p className="text-xs text-muted-foreground">Irauçuba</p>
          </div>
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
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">Prefeitura de Irauçuba</p>
          <p className="mt-1">Sistema Municipal</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
