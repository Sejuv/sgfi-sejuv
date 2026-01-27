import { ProcessoDespesa } from "./types"
import { Secretaria, Setor, Conta, Credor, Objeto, Recurso } from "./cadastros-types"

export interface SyncData {
  processos: ProcessoDespesa[]
  secretarias: Secretaria[]
  setores: Setor[]
  contas: Conta[]
  credores: Credor[]
  objetos: Objeto[]
  recursos: Recurso[]
  timestamp: number
  version: string
}

export interface SyncStatus {
  lastSync: number | null
  isSyncing: boolean
  error: string | null
}

const SYNC_VERSION = "1.0.0"
const SYNC_KEYS = {
  PROCESSOS: "processos-despesas",
  SECRETARIAS: "cadastro-secretarias",
  SETORES: "cadastro-setores",
  CONTAS: "cadastro-contas",
  CREDORES: "cadastro-credores",
  OBJETOS: "cadastro-objetos",
  RECURSOS: "cadastro-recursos",
  LAST_SYNC: "sync-last-timestamp",
  STATUS: "sync-status"
}

export class SyncService {
  private static getFromLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  private static setToLocalStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error)
    }
  }

  private static async getAllData(): Promise<SyncData> {
    const processos = this.getFromLocalStorage<ProcessoDespesa[]>(SYNC_KEYS.PROCESSOS) || []
    const secretarias = this.getFromLocalStorage<Secretaria[]>(SYNC_KEYS.SECRETARIAS) || []
    const setores = this.getFromLocalStorage<Setor[]>(SYNC_KEYS.SETORES) || []
    const contas = this.getFromLocalStorage<Conta[]>(SYNC_KEYS.CONTAS) || []
    const credores = this.getFromLocalStorage<Credor[]>(SYNC_KEYS.CREDORES) || []
    const objetos = this.getFromLocalStorage<Objeto[]>(SYNC_KEYS.OBJETOS) || []
    const recursos = this.getFromLocalStorage<Recurso[]>(SYNC_KEYS.RECURSOS) || []

    return {
      processos,
      secretarias,
      setores,
      contas,
      credores,
      objetos,
      recursos,
      timestamp: Date.now(),
      version: SYNC_VERSION
    }
  }

  private static async setAllData(data: SyncData): Promise<void> {
    this.setToLocalStorage(SYNC_KEYS.PROCESSOS, data.processos)
    this.setToLocalStorage(SYNC_KEYS.SECRETARIAS, data.secretarias)
    this.setToLocalStorage(SYNC_KEYS.SETORES, data.setores)
    this.setToLocalStorage(SYNC_KEYS.CONTAS, data.contas)
    this.setToLocalStorage(SYNC_KEYS.CREDORES, data.credores)
    this.setToLocalStorage(SYNC_KEYS.OBJETOS, data.objetos)
    this.setToLocalStorage(SYNC_KEYS.RECURSOS, data.recursos)
  }

  static async exportData(): Promise<string> {
    try {
      const data = await this.getAllData()
      return JSON.stringify(data, null, 2)
    } catch (error) {
      throw new Error(`Erro ao exportar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  static async importData(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString) as SyncData
      
      if (!data.version || !data.timestamp) {
        throw new Error("Formato de dados inválido")
      }

      await this.setAllData(data)
      this.setToLocalStorage(SYNC_KEYS.LAST_SYNC, Date.now())
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Arquivo JSON inválido")
      }
      throw new Error(`Erro ao importar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  static async downloadBackup(): Promise<void> {
    try {
      const jsonData = await this.exportData()
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      link.href = url
      link.download = `backup-sistema-${timestamp}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      this.setToLocalStorage(SYNC_KEYS.LAST_SYNC, Date.now())
    } catch (error) {
      throw new Error(`Erro ao fazer download do backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  static async uploadBackup(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          const jsonString = event.target?.result as string
          await this.importData(jsonString)
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error("Erro ao ler arquivo"))
      }
      
      reader.readAsText(file)
    })
  }

  static async getLastSyncTimestamp(): Promise<number | null> {
    return this.getFromLocalStorage<number>(SYNC_KEYS.LAST_SYNC)
  }

  static async clearAllData(): Promise<void> {
    localStorage.removeItem(SYNC_KEYS.PROCESSOS)
    localStorage.removeItem(SYNC_KEYS.SECRETARIAS)
    localStorage.removeItem(SYNC_KEYS.SETORES)
    localStorage.removeItem(SYNC_KEYS.CONTAS)
    localStorage.removeItem(SYNC_KEYS.CREDORES)
    localStorage.removeItem(SYNC_KEYS.OBJETOS)
    localStorage.removeItem(SYNC_KEYS.RECURSOS)
    localStorage.removeItem(SYNC_KEYS.LAST_SYNC)
  }

  static async getDataStatistics() {
    const data = await this.getAllData()
    
    return {
      totalProcessos: data.processos.length,
      totalSecretarias: data.secretarias.length,
      totalSetores: data.setores.length,
      totalContas: data.contas.length,
      totalCredores: data.credores.length,
      totalObjetos: data.objetos.length,
      totalRecursos: data.recursos.length,
      totalValorProcessos: data.processos.reduce((acc, p) => acc + (p.valor || 0), 0),
      processosPendentes: data.processos.filter(p => !p.dataTesouraria).length
    }
  }
}
