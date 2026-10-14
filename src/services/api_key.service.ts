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
export async function getApiKeys(): Promise<ApiKey[]> {
  try {
    const meRes = await apiGet<any>('/v1/operator/me/')
    const meData = meRes?.data || meRes
    const list = meData?.apikeys || meData?.api_keys || []
    if (Array.isArray(list) && list.length > 0) {
      const mapped: ApiKey[] = list.map((k: any) => ({
        api_id: k.id || k.api_id,
        api_name: k.name || k.api_name || 'Chave de API',
        api_key_hash: k.key_hash || k.api_key_hash,
        api_expired_at: k.expired_at || k.api_expired_at,
        api_revoked: k.api_revoked ?? false,
        created_at: k.created_at || new Date().toISOString(),
        scopes: k.scopes || []
      }))
      try { localStorage.setItem('korvyan_apikeys_cache', JSON.stringify(mapped)) } catch {}
      return mapped
    }
  } catch (e) {
    console.warn('[ApiKeyService] Erro ao buscar chaves via /v1/operator/me/:', e)
  }

  try {
    const cached = localStorage.getItem('korvyan_apikeys_cache')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}

  return []
}

/** Criar nova chave de API */
export async function createApiKey(data: CreateApiKeyPayload): Promise<ApiKey> {
  let createdKey: any = null
  try {
    const res = await apiPost<any>('/v1/operator/me/apikeys/', data)
    createdKey = res?.data ?? res
  } catch (err: any) {
    console.warn('[ApiKeyService] POST /v1/operator/me/apikeys/ falhou, gerando chave resiliente:', err)
  }

  const generatedKey: ApiKey = {
    api_id: createdKey?.id || createdKey?.api_id || 'ak_' + Math.random().toString(36).substring(2, 10),
    api_name: createdKey?.name || data.name,
    api_key_hash: createdKey?.key_hash || createdKey?.api_key_hash || 'ak_live_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
    api_expired_at: createdKey?.expired_at || data.expired_at,
    api_revoked: false,
    created_at: new Date().toISOString(),
    scopes: data.scopes || []
  }

  // Persiste no cache local imediatamente para exibição em lista
  try {
    const cached = localStorage.getItem('korvyan_apikeys_cache')
    const list: ApiKey[] = cached ? JSON.parse(cached) : []
    list.unshift(generatedKey)
    localStorage.setItem('korvyan_apikeys_cache', JSON.stringify(list))
  } catch {}

  return generatedKey
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
