export interface ProcessoDespesa {
  id: string
  ano: number
  secretaria: string
  setor: string
  conta: string
  credor: string
  objeto: string
  mes: string
  valor: number
  recurso: string
  did: string
  nf: string
  dataControladoria?: string
  dataContabilidade?: string
  dataCompras?: string
  dataSefin?: string
  dataTesouraria?: string
  // Campos de devolução
  devolvido?: boolean
  motivoDevolucao?: string
  secretariaDevolucao?: string
  dataDevolucao?: string
  usuarioDevolucao?: string
  recebidoNovamente?: boolean
  dataRecebimento?: string
  usuarioRecebimento?: string
}

export interface ResumoFinanceiro {
  credor: string
  objetos: {
    objeto: string
    total: number
  }[]
  totalGeral: number
}

export type PermissaoModulo = 
  | "processos"
  | "metricas"
  | "resumo"
  | "cadastros"
  | "sincronizacao"
  | "usuarios"
  | "previsoes"

export interface Usuario {
  id: string
  nome: string
  email: string
  senha: string
  cargo: string
  ativo: boolean
  permissoes: Permissao[]
  dataCriacao: string
  ultimoAcesso?: string
}

export interface SessaoUsuario {
  usuarioId: string
  email: string
  nome: string
  permissoes: Permissao[]
  dataLogin: string
  usuario?: Usuario
}
