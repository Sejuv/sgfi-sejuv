export interface Secretaria {
  id: string
  nome: string
  sigla: string
  responsavel?: string
  ativo: boolean
}

export interface Setor {
  id: string
  nome: string
  secretariaId: string
  descricao?: string
  ativo: boolean
  ordem: number
}

export interface Conta {
  id: string
  tipo: string
  descricao?: string
  ativo: boolean
}

export interface Credor {
  id: string
  nome: string
  cpfCnpj: string
  tipo: "Pessoa Física" | "Pessoa Jurídica"
  telefone?: string
  email?: string
  endereco?: string
  ativo: boolean
}

export interface Objeto {
  id: string
  descricao: string
  categoria?: string
  ativo: boolean
}

export interface Mes {
  id: string
  nome: string
  numero: number
  ativo: boolean
}

export interface Recurso {
  id: string
  nome: string
  secretariaId: string
  ativo: boolean
}


