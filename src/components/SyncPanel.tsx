import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SyncService } from "@/lib/sync-service"
import { AutoSyncCard } from "@/components/AutoSyncCard"
import {
  CloudArrowDown,
  CloudArrowUp,
  DownloadSimple,
  UploadSimple,
  Database,
  Clock,
  CheckCircle,
  WarningCircle
} from "@phosphor-icons/react"
import { formatCurrency } from "@/lib/utils"

interface DataStats {
  totalProcessos: number
  totalSecretarias: number
  totalSetores: number
  totalContas: number
  totalCredores: number
  totalObjetos: number
  totalRecursos: number
  totalValorProcessos: number
  processosPendentes: number
}

export function SyncPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<number | null>(null)
  const [stats, setStats] = useState<DataStats | null>(null)

  useEffect(() => {
    loadSyncInfo()
  }, [])

  const loadSyncInfo = async () => {
    try {
      const timestamp = await SyncService.getLastSyncTimestamp()
      const statistics = await SyncService.getDataStatistics()
      setLastSync(timestamp)
      setStats(statistics)
    } catch (error) {
      console.error("Erro ao carregar informações de sincronização:", error)
    }
  }

  const handleExport = async () => {
    setIsLoading(true)
    try {
      await SyncService.downloadBackup()
      toast.success("Backup exportado com sucesso!")
      await loadSyncInfo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao exportar dados")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsLoading(true)
      try {
        await SyncService.uploadBackup(file)
        toast.success("Dados importados com sucesso!")
        await loadSyncInfo()
        window.location.reload()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao importar dados")
      } finally {
        setIsLoading(false)
      }
    }

    input.click()
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "Nunca sincronizado"
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Agora mesmo"
    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`
    
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="space-y-6 overflow-y-scroll h-full" style={{scrollBehavior: 'smooth'}}>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Sincronização de Dados</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie backups e sincronize dados do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Database className="h-6 w-6 text-white" weight="bold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total de Processos</p>
              <p className="text-2xl font-bold text-blue-700">{stats?.totalProcessos || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" weight="bold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Valor Total</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(stats?.totalValorProcessos || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <WarningCircle className="h-6 w-6 text-white" weight="bold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Processos Pendentes</p>
              <p className="text-2xl font-bold text-amber-700">{stats?.processosPendentes || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Clock className="h-6 w-6 text-white" weight="bold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Último Backup</p>
              <p className="text-sm font-semibold text-purple-700">
                {formatLastSync(lastSync)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <AutoSyncCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CloudArrowDown className="h-6 w-6 text-primary" weight="bold" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Exportar Dados</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Faça o download de um backup completo de todos os dados do sistema em formato JSON
                </p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              disabled={isLoading}
              className="w-full gap-2"
              size="lg"
            >
              <DownloadSimple className="h-5 w-5" weight="bold" />
              {isLoading ? "Exportando..." : "Exportar Backup"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <CloudArrowUp className="h-6 w-6 text-accent" weight="bold" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Importar Dados</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Restaure um backup anterior ou importe dados de outro sistema
                </p>
              </div>
            </div>
            <Button
              onClick={handleImport}
              disabled={isLoading}
              variant="secondary"
              className="w-full gap-2"
              size="lg"
            >
              <UploadSimple className="h-5 w-5" weight="bold" />
              {isLoading ? "Importando..." : "Importar Backup"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-muted/30">
        <h3 className="text-lg font-semibold mb-4">Estatísticas do Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Secretarias</p>
            <p className="text-xl font-bold">{stats?.totalSecretarias || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Setores</p>
            <p className="text-xl font-bold">{stats?.totalSetores || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Credores</p>
            <p className="text-xl font-bold">{stats?.totalCredores || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Objetos</p>
            <p className="text-xl font-bold">{stats?.totalObjetos || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Contas</p>
            <p className="text-xl font-bold">{stats?.totalContas || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Recursos</p>
            <p className="text-xl font-bold">{stats?.totalRecursos || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
