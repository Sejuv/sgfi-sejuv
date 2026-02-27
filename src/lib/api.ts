/**
 * SGFI - Camada de serviço para comunicação com a API backend (PostgreSQL)
 *
 * Em desenvolvimento: VITE_API_URL não definida → Vite proxy /api → localhost:3001
 * Em produção (Vercel): VITE_API_URL definida com a URL da Firebase Function
 *   OU configure os rewrites no vercel.json apontando /api/* → Firebase Function URL
 */

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body:    body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return undefined as T
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro na requisição')
  return data
}

// ── Auth / Usuários ───────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) =>
    req<{ user: { id: string; name: string; email: string; role: string } }>('POST', '/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    req<{ user: { id: string } }>('POST', '/auth/register', data),
}

export const usersApi = {
  list:   ()                                                    => req<{ id: string; name: string; email: string; role: string }[]>('GET', '/auth/users'),
  create: (d: { name: string; email: string; password: string; role: string }) => req<{ user: { id: string } }>('POST', '/auth/register', d),
  update: (id: string, d: { name: string; email: string; password?: string; role: string }) => req<{ user: { id: string } }>('PUT', `/auth/users/${id}`, d),
  remove: (id: string)                                          => req<void>('DELETE', `/auth/users/${id}`),
}

// ── Credores ──────────────────────────────────────────────────
import type { Creditor } from './types'
export const creditorsApi = {
  list:   ()                  => req<Creditor[]>('GET',    '/creditors'),
  create: (c: Creditor)       => req<Creditor>  ('POST',   '/creditors',      c),
  update: (id: string, c: Creditor) => req<Creditor>('PUT', `/creditors/${id}`, c),
  remove: (id: string)        => req<void>       ('DELETE', `/creditors/${id}`),
}

// ── Despesas ──────────────────────────────────────────────────
import type { Expense } from './types'
export const expensesApi = {
  list:   ()                   => req<Expense[]>('GET',    '/expenses'),
  create: (e: Expense)         => req<Expense>  ('POST',   '/expenses',      e),
  update: (id: string, e: Partial<Expense>) => req<Expense>('PUT', `/expenses/${id}`, e),
  remove: (id: string)         => req<void>     ('DELETE', `/expenses/${id}`),
}

// ── Categorias ────────────────────────────────────────────────
import type { Category } from './types'
export const categoriesApi = {
  list:   ()                    => req<Category[]>('GET',    '/categories'),
  create: (c: Category)         => req<Category>  ('POST',   '/categories',      c),
  update: (id: string, c: Partial<Category>) => req<Category>('PUT', `/categories/${id}`, c),
  remove: (id: string)          => req<void>       ('DELETE', `/categories/${id}`),
}

// ── Contratos ─────────────────────────────────────────────────
import type { Contract } from './types'
export const contractsApi = {
  list:           ()                     => req<Contract[]>('GET',    '/contracts'),
  create:         (c: Contract)          => req<Contract>  ('POST',   '/contracts',      c),
  update:         (id: string, c: Omit<Contract, 'id' | 'createdAt'>) => req<Contract>('PUT', `/contracts/${id}`, c),
  remove:         (id: string)           => req<void>       ('DELETE', `/contracts/${id}`),
  updateConsumed: (contractId: string, itemId: string, consumed: number) =>
    req<import('./types').ContractItem>('PATCH', `/contracts/${contractId}/items/${itemId}/consumed`, { consumed }),
}

// ── Itens de Catálogo ────────────────────────────────────────
import type { CatalogItem } from './types'
export const catalogItemsApi = {
  list:   ()                          => req<CatalogItem[]>('GET',    '/catalog-items'),
  create: (c: CatalogItem)            => req<CatalogItem>  ('POST',   '/catalog-items',      c),
  update: (id: string, c: Partial<CatalogItem>) => req<CatalogItem>('PUT', `/catalog-items/${id}`, c),
  remove: (id: string)                => req<void>         ('DELETE', `/catalog-items/${id}`),
}

// ── Entidades ─────────────────────────────────────────────────
import type { SystemEntity } from './config-types'
export const entitiesApi = {
  list:   ()                         => req<SystemEntity[]>('GET',    '/entities'),
  create: (e: Omit<SystemEntity, 'id'>) => req<SystemEntity>('POST',  '/entities',      e),
  update: (id: string, e: Partial<SystemEntity>) => req<SystemEntity>('PUT', `/entities/${id}`, e),
  remove: (id: string)               => req<void>('DELETE', `/entities/${id}`),
}

// ── Catálogo PNCP (CATMAT / CATSERV) ──────────────────────────
export interface PncpCatalogItem {
  codigo:    string
  descricao: string
  unidade:   string
  classe:    string
  subclasse: string
  tipo:      'CATMAT' | 'CATSERV'
}
export const pncpCatalogApi = {
  search: (q: string, tipo: 'material' | 'servico', pagina = 1) =>
    req<{ itens: PncpCatalogItem[]; total: number }>(
      'GET', `/pncp-catalog/search?q=${encodeURIComponent(q)}&tipo=${tipo}&pagina=${pagina}`
    ),
}

// ── Configurações de Aparência ────────────────────────────────
export const settingsApi = {
  list: ()                              => req<Record<string, string>>('GET', '/settings'),
  save: (data: Record<string, string>)  => req<{ ok: boolean }>('PUT', '/settings', data),
}
