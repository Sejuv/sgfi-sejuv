import { LogAcesso, TipoAcao, TipoTela } from './log-types'

class LogService {
  private logs: LogAcesso[] = []
  
  registrarLog(
    usuarioId: string,
    usuarioNome: string,
    usuarioEmail: string,
    acao: TipoAcao,
    tela: TipoTela,
    detalhes?: string
  ) {
    const log: LogAcesso = {
      id: Date.now().toString(),
      usuarioId,
      usuarioNome,
      usuarioEmail,
      acao,
      tela,
      detalhes,
      ip: this.getIP(),
      navegador: this.getNavegador(),
      timestamp: new Date()
    }

    this.logs.push(log)
    this.salvarNoLocalStorage(log)
    console.log('📝 Log registrado:', log)
    
    return log
  }

  private getIP(): string {
    // Em produção, isso seria obtido do backend
    return 'N/A'
  }

  private getNavegador(): string {
    const ua = navigator.userAgent
    let navegador = 'Desconhecido'
    
    if (ua.includes('Firefox')) navegador = 'Firefox'
    else if (ua.includes('Chrome')) navegador = 'Chrome'
    else if (ua.includes('Safari')) navegador = 'Safari'
    else if (ua.includes('Edge')) navegador = 'Edge'
    
    return navegador
  }

  private salvarNoLocalStorage(log: LogAcesso) {
    try {
      const logsExistentes = this.getLogs()
      logsExistentes.push(log)
      
      // Manter apenas os últimos 1000 logs
      if (logsExistentes.length > 1000) {
        logsExistentes.shift()
      }
      
      localStorage.setItem('sistema-logs', JSON.stringify(logsExistentes))
    } catch (error) {
      console.error('Erro ao salvar log:', error)
    }
  }

  getLogs(): LogAcesso[] {
    try {
      const logsStr = localStorage.getItem('sistema-logs')
      if (logsStr) {
        const logs = JSON.parse(logsStr)
        // Converter timestamps de string para Date
        return logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
    return []
  }

  limparLogs() {
    localStorage.removeItem('sistema-logs')
    this.logs = []
  }

  exportarLogs(): string {
    const logs = this.getLogs()
    return JSON.stringify(logs, null, 2)
  }
}

export const logService = new LogService()
