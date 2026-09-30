/**
 * profile.service.ts
 * Real response shape: { success: true, data: Profile[], meta: { total, total_in_page }, message }
 */

import { apiPost, apiPatch, apiDelete } from './api'

export interface ProfileScope { id?: string; code: string }

export interface Profile {
  id: string
  name?: string
  description?: string
  is_manager_profile?: boolean
  is_admin_profile?: boolean
  is_operator_profile?: boolean
  scopes?: ProfileScope[]
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

export interface GetAllProfilesPayload {
  columns?: Record<string, any>
  filters?: Record<string, any>
  offset?: number
}

export async function getAllProfiles(payload: GetAllProfilesPayload = { columns: { id: true, name: true, description: true, scopes: { id: true, code: true } }, filters: {}, offset: 0 }): Promise<PaginatedResult<Profile>> {
  return unwrap<Profile>(await apiPost<any>('/v1/profile/list', payload))
}

export interface CreateProfilePayload {
  name: string
  description?: string
  is_manager_profile?: boolean
  is_admin_profile?: boolean
  is_operator_profile?: boolean
  scopes?: { code: string }[]
}

export function createProfile(payload: CreateProfilePayload): Promise<Profile> {
  return apiPost<Profile>('/v1/profile/', {
    ...payload,
    description: payload.description || `Perfil ${payload.name}`,
    scopes: (payload.scopes || []).map((s: any) => typeof s === 'string' ? { code: s } : s)
  })
}

export function updateProfile(id: string, payload: { name?: string; description?: string; is_manager_profile?: boolean; is_admin_profile?: boolean; is_operator_profile?: boolean; scopes?: { code: string }[] }): Promise<Profile> {
  return apiPatch<Profile>(`/v1/profile/${id}`, {
    ...payload,
    description: payload.description || `Perfil`,
    scopes: payload.scopes ? payload.scopes.map((s: any) => typeof s === 'string' ? { code: s } : s) : undefined
  })
}

export function deleteProfiles(ids: string[]): Promise<unknown> {
  return apiDelete<unknown>('/v1/profile/', { ids })
}
