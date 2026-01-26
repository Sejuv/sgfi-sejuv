import { useEffect, useState } from "react"
import { SyncService } from "@/lib/sync-service"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ArrowsClockwise, 
  CheckCircle, 
  Clock,
  Warning 
} from "@phosphor-icons/react"

declare const spark: {
  kv: {
    get: <T>(key: string) => Promise<T | undefined>
    set: <T>(key: string, value: T) => Promise<void>
  }
}

interface AutoSyncSettings {
  enabled: boolean
  interval: number
}

export function AutoSyncCard() {
  const [settings, setSettings] = useState<AutoSyncSettings>({
    enabled: false,
    interval: 300000
  })
  const [lastAutoSync, setLastAutoSync] = useState<number | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await spark.kv.get<AutoSyncSettings>("auto-sync-settings")
      if (saved) {
        setSettings(saved)
      }
    }
    loadSettings()
  }, [])

  useEffect(() => {
    if (!settings.enabled) return

    const syncNow = async () => {
      setIsSyncing(true)
      try {
        await SyncService.downloadBackup()
        setLastAutoSync(Date.now())
        await spark.kv.set("auto-sync-last", Date.now())
      } catch (error) {
        console.error("Auto-sync failed:", error)
      } finally {
        setIsSyncing(false)
      }
    }

    const intervalId = setInterval(syncNow, settings.interval)
    return () => clearInterval(intervalId)
  }, [settings.enabled, settings.interval])

  const handleToggle = async (enabled: boolean) => {
    const newSettings = { ...settings, enabled }
    setSettings(newSettings)
    await spark.kv.set("auto-sync-settings", newSettings)
    
    if (enabled) {
      toast.success("Sincronização automática ativada")
    } else {
      toast.info("Sincronização automática desativada")
    }
  }

  const handleIntervalChange = async (interval: string) => {
    const newSettings = { ...settings, interval: parseInt(interval) }
    setSettings(newSettings)
    await spark.kv.set("auto-sync-settings", newSettings)
    toast.success("Intervalo de sincronização atualizado")
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      await SyncService.downloadBackup()
      setLastAutoSync(Date.now())
      await spark.kv.set("auto-sync-last", Date.now())
      toast.success("Sincronização manual concluída")
    } catch (error) {
      toast.error("Erro ao sincronizar")
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "Nunca"
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `${diffMins}min atrás`
    
    const diffHours = Math.floor(diffMs / 3600000)
    if (diffHours < 24) return `${diffHours}h atrás`
    
    return date.toLocaleDateString("pt-BR")
  }

  const getIntervalLabel = (ms: number) => {
    const minutes = ms / 60000
    if (minutes < 60) return `${minutes} minutos`
    const hours = minutes / 60
    return `${hours} hora${hours > 1 ? 's' : ''}`
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${settings.enabled ? 'bg-green-100' : 'bg-muted'}`}>
            <ArrowsClockwise 
              className={`h-6 w-6 ${settings.enabled ? 'text-green-600' : 'text-muted-foreground'}`} 
              weight="bold" 
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Sincronização Automática</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure backups automáticos em intervalos regulares
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-sync-toggle" className="text-sm font-medium">
                Ativar sincronização automática
              </Label>
              <p className="text-xs text-muted-foreground">
                Backups serão criados automaticamente
              </p>
            </div>
            <Switch
              id="auto-sync-toggle"
              checked={settings.enabled}
              onCheckedChange={handleToggle}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sync-interval" className="text-sm font-medium">
                  Intervalo de sincronização
                </Label>
                <Select
                  value={settings.interval.toString()}
                  onValueChange={handleIntervalChange}
                >
                  <SelectTrigger id="sync-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300000">5 minutos</SelectItem>
                    <SelectItem value="600000">10 minutos</SelectItem>
                    <SelectItem value="900000">15 minutos</SelectItem>
                    <SelectItem value="1800000">30 minutos</SelectItem>
                    <SelectItem value="3600000">1 hora</SelectItem>
                    <SelectItem value="7200000">2 horas</SelectItem>
                    <SelectItem value="14400000">4 horas</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Backup será criado a cada {getIntervalLabel(settings.interval)}
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                {isSyncing ? (
                  <>
                    <ArrowsClockwise className="h-4 w-4 text-primary animate-spin" weight="bold" />
                    <span className="text-sm text-muted-foreground">Sincronizando...</span>
                  </>
                ) : lastAutoSync ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" weight="bold" />
                    <span className="text-sm text-muted-foreground">
                      Última sincronização: {formatLastSync(lastAutoSync)}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-amber-600" weight="bold" />
                    <span className="text-sm text-muted-foreground">
                      Aguardando primeiro backup automático
                    </span>
                  </>
                )}
              </div>
            </>
          )}

          <Button
            onClick={handleManualSync}
            disabled={isSyncing}
            variant="outline"
            className="w-full gap-2"
          >
            <ArrowsClockwise className="h-4 w-4" weight="bold" />
            {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
          </Button>

          {!settings.enabled && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Warning className="h-4 w-4 text-amber-600 mt-0.5" weight="bold" />
              <p className="text-xs text-amber-800">
                A sincronização automática está desativada. Seus dados não serão salvos automaticamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
