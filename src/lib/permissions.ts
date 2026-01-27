import { Usuario, PermissaoModulo, NivelAcesso } from "./types"

/**
 * Verifica se o usuário tem permissão para acessar um módulo
 */
export function hasPermission(
  usuario: Usuario | null,
  modulo: PermissaoModulo,
  nivelMinimo: NivelAcesso = "leitura"
): boolean {
  // Modo desenvolvimento: sem usuário logado = acesso total
  if (!usuario) return true
  
  // Admin tem acesso total
  const permissao = usuario.permissoes.find(p => p.modulo === modulo)
  if (!permissao) return false
  
  // Hierarquia de permissões: admin > escrita > leitura
  const niveis = { leitura: 1, escrita: 2, admin: 3 }
  const nivelUsuario = niveis[permissao.nivel]
  const nivelRequerido = niveis[nivelMinimo]
  
  return nivelUsuario >= nivelRequerido
}

/**
 * Verifica se o usuário pode visualizar um módulo
 */
export function canView(usuario: Usuario | null, modulo: PermissaoModulo): boolean {
  // Modo desenvolvimento: sem usuário logado = acesso total
  if (!usuario) return true
  return hasPermission(usuario, modulo, "leitura")
}

/**
 * Verifica se o usuário pode editar em um módulo
 */
export function canEdit(usuario: Usuario | null, modulo: PermissaoModulo): boolean {
  // Modo desenvolvimento: sem usuário logado = acesso total
  if (!usuario) return true
  return hasPermission(usuario, modulo, "escrita")
}

/**
 * Verifica se o usuário é admin de um módulo
 */
export function isAdmin(usuario: Usuario | null, modulo: PermissaoModulo): boolean {
  // Modo desenvolvimento: sem usuário logado = acesso total
  if (!usuario) return true
  return hasPermission(usuario, modulo, "admin")
}

/**
 * Obtém o nível de acesso do usuário em um módulo
 */
export function getAccessLevel(usuario: Usuario | null, modulo: PermissaoModulo): NivelAcesso | null {
  if (!usuario) return null
  const permissao = usuario.permissoes.find(p => p.modulo === modulo)
  return permissao ? permissao.nivel : null
}
