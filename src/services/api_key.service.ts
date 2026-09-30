/**
 * api_key.service.ts
 * Serviço de gerenciamento de Chaves de API externas (API Keys) e escopos associados.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './api'

export interface ApiKeyScope {
  id?: string
  code: string
  description?: string
}

export interface ApiKey {
  api_id?: string
  api_name: string
  api_key_hash?: string
  api_expired_at: string
  api_revoked?: boolean
  created_at?: string
  updated_at?: string
  scopes?: ApiKeyScope[]
}

export interface CreateApiKeyPayload {
  name: string
  expired_at: string
  scopes: { id?: string; code: string }[]
}

export interface UpdateApiKeyPayload {
  name?: string
  expired_at?: string
  api_revoked?: boolean
  scopes?: { id?: string; code: string }[]
}

/** Listar chaves de API */
export async function getApiKeys(payload: any = {
  columns: { api_id: true, api_name: true, api_expired_at: true, api_revoked: true, created_at: true },
  filters: {}
}): Promise<ApiKey[]> {
  try {
    const response = await apiPost<any>('/v1/operator/me/apikeys/list/', payload)
    if (Array.isArray(response)) return response
    return response?.data ?? []
  } catch (e) {
    console.warn('[ApiKeyService] Erro ao buscar chaves:', e)
    return []
  }
}

/** Criar nova chave de API */
export async function createApiKey(data: CreateApiKeyPayload): Promise<ApiKey> {
  const res = await apiPost<any>('/v1/operator/me/apikeys/', data)
  return res?.data ?? res
}

/** Atualizar chave de API */
export async function updateApiKey(id: string, data: UpdateApiKeyPayload): Promise<ApiKey> {
  const res = await apiPatch<any>(`/v1/operator/me/apikeys/${id}`, data)
  return res?.data ?? res
}

/** Revogar / Deletar chaves de API */
export async function deleteApiKeys(ids: string[]): Promise<void> {
  await apiDelete('/v1/operator/me/apikeys/', { ids })
}
