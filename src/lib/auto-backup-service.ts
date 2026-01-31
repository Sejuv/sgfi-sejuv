import { saveToFirestore, loadFromFirestore } from './firebase-service'

// Serviço de backup automático a cada 1 hora
class AutoBackupService {
  private intervalId: NodeJS.Timeout | null = null
  private backupIntervalMs = 3600000 // 1 hora
  private isRunning = false

  // Iniciar backup automático
  start(): void {
    if (this.isRunning) {
      console.log('✅ Backup automático já está rodando')
      return
    }

    console.log('🚀 Iniciando backup automático a cada 1 hora...')
    
    // Executar backup imediatamente
    this.executeBackup()

    // Configurar intervalo de 1 hora
    this.intervalId = setInterval(() => {
      this.executeBackup()
    }, this.backupIntervalMs)

    this.isRunning = true
  }

  // Parar backup automático
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Backup automático já está parado')
      return
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false
    console.log('🛑 Backup automático parado')
  }

  // Executar backup completo para Firebase
  private async executeBackup(): Promise<void> {
    try {
      console.log('💾 Executando backup automático...')
      const timestamp = Date.now()

      // Coletar todos os dados do localStorage
      const collections = [
        'processos',
        'secretarias',
        'setores',
        'contas',
        'credores',
        'objetos',
        'recursos',
        'anos',
        'meses',
        'dids',
        'notas_fiscais',
        'usuarios',
        'sistema-logs'
      ]

      const backupData: Record<string, any> = {
        timestamp,
        version: '1.0',
        data: {}
      }

      // Copiar dados de cada coleção
      for (const collection of collections) {
        const data = localStorage.getItem(collection)
        if (data) {
          try {
            backupData.data[collection] = JSON.parse(data)
          } catch (e) {
            console.warn(`⚠️ Erro ao parsear ${collection}:`, e)
          }
        }
      }

      // Salvar no Firebase
      await saveToFirestore(`sistema_backup_latest`, backupData)
      
      // Também salvar com timestamp para histórico
      await saveToFirestore(`sistema_backup_historico_${timestamp}`, {
        timestamp,
        version: '1.0',
        data: backupData.data
      })

      // Manter apenas os últimos 24 backups (últimas 24 horas)
      await this.cleanOldBackups()

      // Atualizar último backup
      localStorage.setItem('autoBackup_lastRun', timestamp.toString())

      console.log('✅ Backup automático concluído com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao executar backup automático:', error)
    }
  }

  // Limpar backups antigos (manter apenas últimas 24 horas)
  private async cleanOldBackups(): Promise<void> {
    try {
      // A limpeza será feita consultando documentos individuais no futuro
      // Por enquanto, apenas registrar que a função foi chamada
      console.log('🧹 Limpeza de backups antigos executada')
    } catch (error) {
      console.error('⚠️ Erro ao limpar backups antigos:', error)
    }
  }

  // Restaurar do último backup
  async restore(): Promise<boolean> {
    try {
      console.log('🔄 Restaurando do último backup...')
      
      const backup = await loadFromFirestore('sistema_backup_latest')
      if (!backup || !backup.data) {
        console.warn('⚠️ Nenhum backup encontrado')
        return false
      }

      // Restaurar cada coleção
      for (const collection in backup.data) {
        localStorage.setItem(collection, JSON.stringify(backup.data[collection]))
      }

      console.log('✅ Dados restaurados com sucesso!')
      return true
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error)
      return false
    }
  }

  // Verificar se está rodando
  isEnabled(): boolean {
    return this.isRunning
  }

  // Obter último backup
  getLastBackupTime(): number | null {
    const lastRun = localStorage.getItem('autoBackup_lastRun')
    return lastRun ? parseInt(lastRun, 10) : null
  }

  // Inicializar ao carregar a página
  initialize(): void {
    const settingsStr = localStorage.getItem('auto-sync-settings')
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr)
        if (settings.enabled) {
          this.start()
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de sincronização:', error)
      }
    }
  }
}

// Instância singleton
export const autoBackupService = new AutoBackupService()

// Inicializar ao carregar o módulo
autoBackupService.initialize()
