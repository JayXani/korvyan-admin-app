/**
 * tenant.service.ts — Serviço de Tenants (Portais/Instâncias)
 *
 * Estratégia dupla:
 *   - API REST (/v1/tenant/) → cria tenant (só aceita tenant_prefix)
 *   - Firestore              → armazena configs extras (logo, cor, plano, telefone)
 *
 * Endpoints (api.json — Korvyan Insurance Management):
 *   POST /v1/tenant/         → Criar tenant (requer apenas tenant_prefix)
 *   POST /v1/tenant/list/    → Listar tenants
 *   PATCH /v1/tenant/:id     → Atualizar tenant
 *   DELETE /v1/tenant/       → Deletar tenants
 */
import { apiGet, apiPost, apiPatch, apiDelete } from './api'
import { db, storage } from './firebase.config'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { ref as refStorage, uploadBytes, getDownloadURL } from 'firebase/storage'
import {
  saveTenantConfig,
  getTenantConfig,
  getAllTenantConfigs,
  deleteTenantConfig,
  uploadTenantLogo,
} from './firebase.service'

export async function updateUserAvatar(tenant: string, userId: string, file: File): Promise<string> {
  try {
    const ext = file.name.split('.').pop() || 'png'
    const storagePath = `tenants/${tenant}/users/${userId}/avatar_${Date.now()}.${ext}`
    const fileRef = refStorage(storage, storagePath)
    await uploadBytes(fileRef, file)
    const downloadUrl = await getDownloadURL(fileRef)

    const userDocRef = doc(db, 'tenants', tenant, 'users', userId)
    await setDoc(userDocRef, {
      avatarUrl: downloadUrl,
      updated_at: new Date().toISOString()
    }, { merge: true })

    return downloadUrl
  } catch (err) {
    console.error('[Firebase] Erro ao atualizar avatar:', err)
    throw err
  }
}

export async function deleteReportFirestore(reportId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'reports', reportId))
  } catch (err) {
    console.warn('[Firebase] Erro ao deletar relatório no Firestore:', err)
  }
}

export interface TenantConfig {
  id?: string | number
  tenant_prefix: string
  name?: string
  primary_color?: string
  support_phone?: string
  plan?: string
  logo_url?: string
  email?: string
  tenant_public_key?: string
  ten_public_key?: string
  tenant_css?: string
  ten_css?: string
  tenant_enabled?: boolean
  tenant_is_template?: boolean
  created_at?: string
  addons?: Record<string, boolean>
  addon_values?: Record<string, any>
  [key: string]: any
}

export type Tenant = TenantConfig

export interface CreateTenantPayload {
  tenant_prefix: string
  name?: string
  primary_color?: string
  support_phone?: string
  plan?: string
  logo_url?: string
  logo_file?: File
  email?: string
  tenant_public_key?: string
  ten_public_key?: string
  tenant_css?: string
  ten_css?: string
  addons?: Record<string, boolean>
  addon_values?: Record<string, any>
  [key: string]: any
}

// Remove campos undefined para evitar erro do Firestore
function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>
}

// ─── Helper: normaliza resposta da API para array ─────────────────────────────

function extractTenants(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.items)) return raw.items
  return []
}

// ─── CRUD Tenant ──────────────────────────────────────────────────────────────

/**
 * Cria um tenant:
 *   1. Chama POST /v1/tenant/ com apenas o tenant_prefix (requisito da API)
 *   2. Se houver logo_file, faz upload para o Firebase Storage
 *   3. Salva todos os campos extras no Firestore
 */
export async function createTenant(payload: CreateTenantPayload): Promise<TenantConfig> {
  const { logo_file, ...rest } = payload

  // 1. Criar na API REST (campo obrigatório: tenant_prefix)
  const apiResult = await apiPost<any>('/v1/tenant/', {
    tenant_prefix: payload.tenant_prefix,
  })

  let logo_url = rest.logo_url || ''

  // 2. Upload de logo se fornecido
  if (logo_file) {
    try {
      logo_url = await uploadTenantLogo(payload.tenant_prefix, logo_file)
    } catch (err) {
      console.warn('[TenantService] Falha no upload do logo:', err)
    }
  }

  // 3. Salvar configurações extras no Firestore (sem undefined)
  const config = stripUndefined<Partial<TenantConfig>>({
    tenant_prefix: payload.tenant_prefix,
    name: rest.name,
    primary_color: rest.primary_color || '#D4AF37',
    support_phone: rest.support_phone,
    plan: rest.plan || 'basic',
    logo_url: logo_url || '',
    email: rest.email || '',
    tenant_public_key: rest.tenant_public_key || rest.ten_public_key || '',
    ten_public_key: rest.ten_public_key || rest.tenant_public_key || '',
    tenant_css: rest.tenant_css || rest.ten_css || '',
    ten_css: rest.ten_css || rest.tenant_css || '',
    addons: rest.addons,
    addon_values: rest.addon_values,
    status: 'ACTIVE',
  })
  await saveTenantConfig(payload.tenant_prefix, config)

  return { ...config, ...(apiResult?.data || {}) } as TenantConfig
}

export async function getAllTenants(onEnriched?: (enriched: TenantConfig[]) => void): Promise<TenantConfig[]> {
  // ── Estratégia: Firestore-first com API como enriquecimento ──────────────────
  // O Firestore é sempre a fonte primária (resposta imediata).
  // A API REST é chamada em paralelo para enriquecer os dados com campos
  // estruturais (id, enabled, is_template). Se a API falhar (400, 5xx, rede),
  // o sistema continua funcionando 100% com os dados do Firestore.

  // 1. Carrega o Firestore imediatamente (fonte principal)
  let fsTenants: TenantConfig[] = []
  try {
    const configs = await getAllTenantConfigs()
    fsTenants = Array.isArray(configs) ? configs : []
  } catch (e) {
    console.warn('[TenantService] Falha ao buscar tenants do Firestore:', e)
  }

  // Exibe imediatamente o que temos do Firestore enquanto a API carrega
  if (onEnriched && fsTenants.length > 0) {
    onEnriched(fsTenants)
  }

  // 2. Tenta a API em paralelo para enriquecimento (falha silenciosa)
  try {
    const body: any = {
      columns: {
        id: true,
        tenant_prefix: true,
        tenant_enterprise_name: true,
        tenant_enabled: true,
        tenant_is_template: true,
        tenant_logo: true,
        tenant_public_key: true,
        tenant_css: true,
        schema_version: true,
      },
      filters: {},
      offset: 0,
      limit: 100
    }
    const apiRaw = await apiPost<any>('/v1/tenant/list/', body)
    const apiTenants = extractTenants(apiRaw)

    if (apiTenants.length > 0) {
      // Merge: Firestore tem precedência nos campos de configuração (name, cor, addons, etc.)
      const fsMap = new Map<string, TenantConfig>()
      for (const cfg of fsTenants) fsMap.set(cfg.tenant_prefix, cfg)

      const enriched = apiTenants.map((t: any) => {
        const prefix = t.tenant_prefix || ''
        const fsCfg = fsMap.get(prefix) || {}
        const logo = fsCfg.logo_url || t.tenant_logo || t.ten_logo_url || ''
        const publicKey = fsCfg.tenant_public_key || fsCfg.ten_public_key || t.tenant_public_key || t.ten_public_key || ''
        const css = fsCfg.tenant_css || fsCfg.ten_css || t.tenant_css || t.ten_css || ''
        const email = fsCfg.email || t.email || ''
        const name = fsCfg.name || t.tenant_enterprise_name || t.ten_enterprise_name || prefix

        return {
          ...t,
          ...fsCfg,
          name,
          logo_url: logo,
          tenant_public_key: publicKey,
          ten_public_key: publicKey,
          tenant_css: css,
          ten_css: css,
          email,
        }
      })

      // Adiciona tenants que só existem no Firestore (ex: pendentes de sincronização)
      const apiPrefixes = new Set(apiTenants.map((t: any) => t.tenant_prefix))
      const firestoreOnly = fsTenants
        .filter(t => !apiPrefixes.has(t.tenant_prefix))
        .map(t => ({
          ...t,
          name: t.name || t.tenant_prefix,
          tenant_public_key: t.tenant_public_key || t.ten_public_key || '',
          ten_public_key: t.ten_public_key || t.tenant_public_key || '',
          tenant_css: t.tenant_css || t.ten_css || '',
          ten_css: t.ten_css || t.tenant_css || '',
          email: t.email || '',
        }))
      const final = [...enriched, ...firestoreOnly]

      if (onEnriched) onEnriched(final)
      return final
    }
  } catch (e) {
    // API com problema — Firestore já foi exibido, falha silenciosa
    console.warn('[TenantService] API /v1/tenant/list/ indisponível, usando Firestore como fallback:', e)
  }

  // Retorna o que temos do Firestore (API falhou ou retornou vazio)
  return fsTenants
}

/**
 * Atualiza configurações extras de um tenant existente.
 * Só atualiza o Firestore (a API não suporta PATCH de tenant).
 * Se houver logo_file, faz upload e atualiza logo_url.
 */
export async function updateTenantConfig(
  tenantPrefix: string,
  payload: Partial<Omit<CreateTenantPayload, 'tenant_prefix'>>,
): Promise<void> {
  const { logo_file, ...rest } = payload

  let logo_url = rest.logo_url

  if (logo_file) {
    try {
      logo_url = await uploadTenantLogo(tenantPrefix, logo_file)
    } catch (err) {
      console.warn('[TenantService] Falha no upload do logo:', err)
    }
  }

  const toSave = stripUndefined({
    ...rest,
    ...(logo_url ? { logo_url } : {}),
    ...(rest.tenant_public_key || rest.ten_public_key ? {
      tenant_public_key: rest.tenant_public_key || rest.ten_public_key,
      ten_public_key: rest.ten_public_key || rest.tenant_public_key,
    } : {}),
    ...(rest.tenant_css !== undefined || rest.ten_css !== undefined ? {
      tenant_css: rest.tenant_css ?? rest.ten_css,
      ten_css: rest.ten_css ?? rest.tenant_css,
    } : {}),
    ...(rest.email !== undefined ? { email: rest.email } : {}),
  })

  await saveTenantConfig(tenantPrefix, toSave)
}

/**
 * Busca configurações de um tenant específico do Firestore.
 */
export async function getTenantByPrefix(prefix: string): Promise<TenantConfig | null> {
  return getTenantConfig(prefix)
}

/**
 * Remove um tenant do Firestore (não afeta a API REST).
 */
export async function removeTenantConfig(tenantPrefix: string): Promise<void> {
  return deleteTenantConfig(tenantPrefix)
}

/**
 * Atualiza o status/enabled de um tenant na API REST
 */
export async function updateTenantApiStatus(id: string, enabled: boolean): Promise<any> {
  return apiPatch(`/v1/tenant/${id}`, { tenant_enabled: enabled })
}

/**
 * Exclui tenants da API REST
 */
export async function deleteTenantsApi(ids: string[]): Promise<any> {
  return apiDelete('/v1/tenant/', { ids })
}

/**
 * Obtém dados públicos do portal do tenant ativo (GET /v1/tenant/public/portal/)
 */
export async function getPublicTenantPortal(): Promise<any> {
  try {
    const res = await apiGet<any>('/v1/tenant/public/portal/')
    return res?.data ?? res
  } catch (e) {
    console.warn('[TenantService] Erro ao buscar portal público do tenant:', e)
    return null
  }
}

/**
 * Resolve o prefixo ou configuração do tenant a partir de um hostname/domínio customizado
 */
export async function resolveTenantByDomain(domain: string): Promise<string> {
  if (!domain || domain === 'localhost' || domain === '127.0.0.1') return 'default'
  
  // Tenta extrair subdomínio primário
  const parts = domain.split('.')
  if (parts.length >= 3 && !domain.includes('web.app') && !domain.includes('firebaseapp.com')) {
    return parts[0]
  }

  // Tenta consultar a API do portal público para domínios customizados
  try {
    const portal = await getPublicTenantPortal()
    if (portal?.tenant_prefix) return portal.tenant_prefix
  } catch {
    console.warn('[TenantService] Resolução de domínio customizado retornou fallback.')
  }

  return 'default'
}
