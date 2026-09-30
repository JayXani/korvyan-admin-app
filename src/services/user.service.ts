/**
 * user.service.ts
 * Real response shape: { success, data: [], meta: {total, total_in_page}, message }
 *
 * Endpoints (api.json — Korvyan Insurance Management):
 *   GET   /v1/operator/me/        → Dados do operador logado
 *   PATCH /v1/operator/me/        → Atualizar dados do operador logado
 *   POST  /v1/operator/           → Criar operador
 *   POST  /v1/operator/list/      → Listar operadores (paginado)
 *   PATCH /v1/operator/{id}       → Atualizar operador específico
 *   DELETE /v1/operator/          → Deletar operadores (bulk por ids)
 */
import { apiGet, apiPost, apiPatch, apiDelete, apiPutForm } from './api'
import { uploadFile } from './storage.service'
import { getCurrentTenantPrefix } from '@/composables/useTenantContext'

export interface UserContact { id?: string; type: string; idd: string; number: string }
export interface UserAddress {
  cep: string
  street?: string
  number: string
  city?: string
  country?: string
  state?: string
  neighborhood?: string
  reference: string
}

export interface CreateOperatorPayload {
  username: string
  user_login: string
  password: string
  person: {
    name: string
    email?: string
    date_birthday?: string
    dateBirthday?: string
    gender?: string
    deceased?: boolean
    date_deceased?: string
    is_applicant?: boolean
    documents?: { type: string; code: string }[]
    religion?: { name: string }
    contacts?: UserContact[]
    address?: UserAddress
  }
  profile_id?: string
  private_scopes?: string[]
}

export interface UpdateMePayload {
  username?: string
  address?: UserAddress
  person?: {
    avatar?: string
    name?: string
    email?: string
    gender?: string
    date_birthday?: string
    address?: UserAddress
  }
}

export interface UpdateOperatorPayload {
  username?: string
  user_login?: string
  password?: string
  is_active?: boolean
  enable_google_auth?: boolean
  profile_id?: string
  private_scopes?: string[]
  person?: {
    id?: string
    name?: string
    avatar?: string
    email?: string
    gender?: string
    date_birthday?: string
    dateBirthday?: string
    deceased?: boolean
    documents?: { id?: string; type: string; code: string }[]
  }
}

export interface User {
  id: string
  username?: string
  user_login?: string
  is_active?: boolean
  enable_google_auth?: boolean
  name?: string
  email?: string
  gender?: string
  date_birthday?: string
  dateBirthday?: string
  avatar?: string
  created_at?: string
  updated_at?: string
  person?: {
    name?: string
    email?: string
    gender?: string
    date_birthday?: string
    dateBirthday?: string
    avatar?: string
    documents?: { id?: string; type: string; code: string }[]
    contacts?: UserContact[]
    address?: UserAddress
  }
  profile?: { id?: string; name?: string; scopes?: { code: string }[]; is_manager_profile?: boolean }
  private_scopes?: { id: string; code: string }[]
  contacts?: UserContact[]
  address?: UserAddress
  [key: string]: unknown
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
}

function unwrap<T>(res: any): PaginatedResult<T> {
  let data: T[] = []
  let total = 0

  if (Array.isArray(res)) {
    data = res
    total = res.length
  } else if (res && typeof res === 'object') {
    if (Array.isArray(res.data)) data = res.data
    else if (Array.isArray(res.items)) data = res.items

    if (res.meta && typeof res.meta.total === 'number') total = res.meta.total
    else if (typeof res.total === 'number') total = res.total
    else total = data.length
  }
  return { data, total }
}

export interface GetAllOperatorsPayload {
  columns?: Record<string, any>
  filters?: Record<string, any>
  offset?: number
}

function normalizeFilters(filters?: Record<string, any>): Record<string, any> {
  if (!filters) return {}
  const normalized: Record<string, any> = {}
  for (const [key, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null) {
      if (typeof val === 'object' && 'operation' in val && 'value' in val) {
        normalized[key] = val
      } else if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        normalized[key] = { operation: 'equal', value: val }
      } else {
        normalized[key] = val
      }
    }
  }
  return normalized
}

/** Listar todos os operadores (paginado) */
export async function getAllOperators(payload: GetAllOperatorsPayload = {
  columns: {
    id: true,
    person: {
      name: true,
      email: true,
      date_birthday: true,
      gender: true
    },
    address: { 
      id: true,
      cep: true,
      street: true,
      number:true,
      city: true,
      country:true,
      state: true,
      neighborhood:true,
      reference: true
    },
    contacts: { 
      id: true,
      type: true,
      idd: true,
      number: true
    },
    documents: {
      id: true,
      code: true,
      type: true
    },
    private_scopes: {
      id: true,
      code: true
    },
    profile: {
      id: true,
      internal_code: true,
      name: true,
      description: true,
      created_at: true,
      updated_at: true,
      scopes: {
        id: true,
        code: true
      }
    }
  },
  filters: {},
  offset: 0,
}): Promise<PaginatedResult<User>> {
  const normalizedFilters = normalizeFilters(payload.filters)
  const body: any = {
    columns: payload.columns || { id: true },
    filters: Object.keys(normalizedFilters).length > 0 ? normalizedFilters : {},
    offset: payload.offset ?? 0,
    limit: 100
  }
  const res = await apiPost<any>('/v1/operator/list/', body)
  return unwrap<User>(res)
}

/** Criar novo operador */
export function createOperator(payload: CreateOperatorPayload): Promise<User> {
  return apiPost<User>('/v1/operator/', payload)
}

/** Atualizar operador específico por ID */
export function updateOperator(id: string, payload: UpdateOperatorPayload): Promise<User> {
  return apiPatch<User>(`/v1/operator/${id}`, payload)
}

/**
 * Habilitar ou desabilitar acesso de login e autenticação Google de um usuário/operador
 */
export function setUserLoginAccess(
  id: string,
  isActive: boolean,
  enableGoogleAuth: boolean = true
): Promise<User> {
  return updateOperator(id, {
    is_active: isActive,
    enable_google_auth: enableGoogleAuth
  })
}

/** Deletar operadores por IDs */
export async function deleteOperators(ids: string[]): Promise<unknown> {
  return Promise.all(ids.map(id => apiDelete<unknown>(`/v1/operator/${id}`)))
}

/** Dados do operador atualmente autenticado */
export async function getMe(): Promise<User> {
  const res = await apiGet<any>('/v1/operator/me/')
  return res.data ?? res
}

/** Atualizar dados do operador autenticado */
export async function updateMe(payload: UpdateMePayload): Promise<User> {
  const res = await apiPatch<any>('/v1/operator/me/', payload)
  return res.data ?? res
}

export async function getUserById(id: string): Promise<User> {
  const res = await getAllOperators({
    columns: { 
      id: true,
      username: true,
      user_login: true,
      person: {
        id: true,
        name: true,
        email: true,
        date_birthday: true,
        gender: true
      },
      address: { 
        id: true,
        cep: true,
        street: true,
        number:true,
        city: true,
        country:true,
        state: true,
        neighborhood:true,
        reference: true
      },
      contacts: { 
        id: true,
        type: true,
        idd: true,
        number: true
      },
      documents: {
        id: true,
        code: true,
        type: true
      },
      private_scopes: {
        id: true,
        code: true
      },
      profile: {
        id: true,
        internal_code: true,
        name: true,
        description: true,
        created_at: true,
        updated_at: true,
        scopes: {
          id: true,
          code: true
        }
      }
    },
    filters: { id: { operation: 'equal', value: id } },
    offset: 0,
  })
  const user = res.data[0]
  if (user) return user
  throw new Error('Usuário não encontrado.')
}

/** Upload do avatar do operador (Tentativa REST PUT /v1/operator/me/avatar/ com fallback para Firebase Storage) */
export async function uploadAvatar(file: File, userId?: string): Promise<string> {
  // 1. Tentativa REST Django
  try {
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await apiPutForm<any>('/v1/operator/me/avatar/', formData)
    const url = res.data?.file_url || res.data?.avatar_url || res.data?.avatar || res.file_url || res.avatar_url || res.avatar
    if (url && typeof url === 'string') {
      return url
    }
  } catch (err) {
    console.warn('[Avatar Upload] Rota REST /v1/operator/me/avatar/ indisponível ou com falha. Acionando fallback do Firebase Storage...', err)
  }

  // 2. Fallback Firebase Storage
  const tenant = getCurrentTenantPrefix()
  const ext = file.name.split('.').pop() || 'png'
  const id = userId || 'me'
  const path = `tenants/${tenant}/users/${tenant}_${id}/avatar_${Date.now()}.${ext}`
  return await uploadFile(file, path)
}

