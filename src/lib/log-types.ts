export interface LogAcesso {
  id: string
  usuarioId: string
  usuarioNome: string
  usuarioEmail: string
  acao: string
  tela: string
  detalhes?: string
  ip?: string
  navegador?: string
  timestamp: Date
}

export type TipoAcao = 
  | 'login'
  | 'logout'
  | 'criar'
  | 'editar'
  | 'excluir'
  | 'visualizar'
  | 'importar'
  | 'exportar'
  | 'acesso'
  | 'devolver'
  | 'receber'

export type TipoTela =
  | 'Processos'
  | 'Cadastros'
  | 'Usuários'
  | 'Logs'
  | 'Login'
  | 'Dashboard'
