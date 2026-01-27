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
  console.log('🔐 Validando credenciais...')
  console.log('📧 Email recebido:', email)
  console.log('👥 Total de usuários:', usuarios.length)
  console.log('📋 Lista de usuários:', usuarios.map(u => ({ email: u.email, id: u.id })))
  
  const senhaHash = await hashSenha(senha)
  console.log('🔑 Hash da senha digitada:', senhaHash)
  
  const usuario = usuarios.find(u => {
    const emailMatch = u.email === email
    const senhaMatch = u.senha === senhaHash
    const ativoCheck = u.ativo
    
    console.log(`Verificando usuário ${u.email}:`, {
      emailMatch,
      senhaMatch,
      ativoCheck,
      senhaEsperada: u.senha
    })
    
    return emailMatch && senhaMatch && ativoCheck
  })
  
  console.log('✅ Usuário encontrado:', usuario ? `Sim (${usuario.nome})` : 'Não')
  
  // Fallback apenas se for admin padrão E não houver usuários
  if (!usuario && usuarios.length === 0 && email === "admin@iraucuba.ce.gov.br" && senha === "admin123") {
    console.log('⚠️ Usando credenciais padrão (nenhum usuário cadastrado)')
    const adminPadrao = await criarUsuarioInicial()
    return adminPadrao
  }
  
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
      { modulo: "resumo", nivel: "admin" },
      { modulo: "cadastros", nivel: "admin" },
      { modulo: "sincronizacao", nivel: "admin" },
      { modulo: "usuarios", nivel: "admin" },
    ],
    dataCriacao: new Date().toISOString(),
  }
}
