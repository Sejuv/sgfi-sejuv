import { Usuario, SessaoUsuario } from "./types"

export async function hashSenha(senha: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(senha)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function validarCredenciais(
  email: string, 
  senha: string, 
  usuarios: Usuario[]
): Promise<Usuario | null> {
  const senhaHash = await hashSenha(senha)

  const usuario = usuarios.find(u =>
    u.email === email && u.senha === senhaHash && u.ativo
  )

  return usuario || null
}

export function criarSessao(usuario: Usuario): SessaoUsuario {
  return {
    usuarioId: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    permissoes: usuario.permissoes,
    dataLogin: new Date().toISOString(),
    usuario: usuario
  }
}

export function verificarPermissao(
  sessao: SessaoUsuario | null,
  modulo: string,
  nivelRequerido: "leitura" | "escrita" | "admin" = "leitura"
): boolean {
  if (!sessao) return false
  
  const permissao = sessao.permissoes.find(p => p.modulo === modulo)
  if (!permissao) return false
  
  if (nivelRequerido === "leitura") return true
  if (nivelRequerido === "escrita") return permissao.nivel === "escrita" || permissao.nivel === "admin"
  if (nivelRequerido === "admin") return permissao.nivel === "admin"
  
  return false
}

export async function criarUsuarioInicial(): Promise<Usuario> {
  return {
    id: "admin-inicial",
    nome: "Administrador",
    email: "admin@iraucuba.ce.gov.br",
    senha: await hashSenha("admin123"),
    cargo: "Administrador do Sistema",
    ativo: true,
    permissoes: [
      { modulo: "processos", nivel: "admin" },
      { modulo: "metricas", nivel: "admin" },
      { modulo: "previsoes", nivel: "admin" },
      { modulo: "resumo", nivel: "admin" },
      { modulo: "cadastros", nivel: "admin" },
      { modulo: "sincronizacao", nivel: "admin" },
      { modulo: "usuarios", nivel: "admin" },
      { modulo: "firebase", nivel: "admin" },
    ],
    dataCriacao: new Date().toISOString(),
  }
}
