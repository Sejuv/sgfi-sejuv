import { ProcessoDespesa } from "./types"
import { Secretaria, Setor, Conta, Credor, Objeto, Recurso } from "./cadastros-types"

declare const spark: {
  kv: {
    get: <T>(key: string) => Promise<T | undefined>
    set: <T>(key: string, value: T) => Promise<void>
    delete: (key: string) => Promise<void>
  }
}

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
  private static async getAllData(): Promise<SyncData> {
    const [processos, secretarias, setores, contas, credores, objetos, recursos] = await Promise.all([
      spark.kv.get<ProcessoDespesa[]>(SYNC_KEYS.PROCESSOS),
      spark.kv.get<Secretaria[]>(SYNC_KEYS.SECRETARIAS),
      spark.kv.get<Setor[]>(SYNC_KEYS.SETORES),
      spark.kv.get<Conta[]>(SYNC_KEYS.CONTAS),
      spark.kv.get<Credor[]>(SYNC_KEYS.CREDORES),
      spark.kv.get<Objeto[]>(SYNC_KEYS.OBJETOS),
      spark.kv.get<Recurso[]>(SYNC_KEYS.RECURSOS)
    ])

    return {
      processos: processos || [],
      secretarias: secretarias || [],
      setores: setores || [],
      contas: contas || [],
      credores: credores || [],
      objetos: objetos || [],
      recursos: recursos || [],
      timestamp: Date.now(),
      version: SYNC_VERSION
    }
  }

  private static async setAllData(data: SyncData): Promise<void> {
    await Promise.all([
      spark.kv.set(SYNC_KEYS.PROCESSOS, data.processos),
      spark.kv.set(SYNC_KEYS.SECRETARIAS, data.secretarias),
      spark.kv.set(SYNC_KEYS.SETORES, data.setores),
      spark.kv.set(SYNC_KEYS.CONTAS, data.contas),
      spark.kv.set(SYNC_KEYS.CREDORES, data.credores),
      spark.kv.set(SYNC_KEYS.OBJETOS, data.objetos),
      spark.kv.set(SYNC_KEYS.RECURSOS, data.recursos)
    ])
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
      await spark.kv.set(SYNC_KEYS.LAST_SYNC, Date.now())
      
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
      
      await spark.kv.set(SYNC_KEYS.LAST_SYNC, Date.now())
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
    return await spark.kv.get<number>(SYNC_KEYS.LAST_SYNC) || null
  }

  static async clearAllData(): Promise<void> {
    await Promise.all([
      spark.kv.delete(SYNC_KEYS.PROCESSOS),
      spark.kv.delete(SYNC_KEYS.SECRETARIAS),
      spark.kv.delete(SYNC_KEYS.SETORES),
      spark.kv.delete(SYNC_KEYS.CONTAS),
      spark.kv.delete(SYNC_KEYS.CREDORES),
      spark.kv.delete(SYNC_KEYS.OBJETOS),
      spark.kv.delete(SYNC_KEYS.RECURSOS)
    ])
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
      totalValorProcessos: data.processos.reduce((acc, p) => acc + p.valor, 0),
      processosPendentes: data.processos.filter(p => !p.dataTesouraria).length
    }
  }
}
