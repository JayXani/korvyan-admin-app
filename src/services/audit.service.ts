import { firebaseApp } from './firebase.config'
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { apiPost } from './api'

let cachedIp: string | null = null

async function getUserIp(): Promise<string> {
  if (cachedIp) return cachedIp
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    cachedIp = data.ip
    return data.ip
  } catch {
    return 'unknown'
  }
}

const db = getFirestore(firebaseApp)
const AUDIT_COLLECTION = 'audit_logs'

export interface AuditLogData {
  log_action: string        // ex: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
  entity_type?: string      // ex: 'contrato', 'usuario', 'plano'
  entity_name?: string      // ex: 'João Silva' (nome do item afetado)
  log_row_id?: string | null
  log_old_data?: any | null
  log_reason?: string | null
}

// Mapa de ações → verbo em português
const ACTION_VERBS: Record<string, string> = {
  CREATE: 'Cadastrou',
  UPDATE: 'Editou',
  DELETE: 'Excluiu',
  LOGIN:  'Realizou login',
}

// Mapa de entidade → nome no feminino/masculino
const ENTITY_LABELS: Record<string, string> = {
  contrato:  'contrato',
  usuario:   'usuário',
  perfil:    'perfil',
  plano:     'plano',
  banco:     'banco',
  escopo:    'escopo',
  tenant:    'empresa',
  beneficio: 'benefício',
  religiao:  'religião',
  status:    'status',
  solicitante: 'solicitante',
  relatorio: 'relatório',
}

export function buildAuditLabel(action: string, entity_type?: string, entity_name?: string): string {
  const verb = ACTION_VERBS[action] ?? action
  if (!entity_type) return verb
  const entity = ENTITY_LABELS[entity_type] ?? entity_type
  if (action === 'LOGIN') return verb
  return entity_name
    ? `${verb} ${entity}: ${entity_name}`
    : `${verb} ${entity}`
}

function getUserInfo(): { id: string; username: string } {
  try {
    const raw = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
    if (raw) {
      const u = JSON.parse(raw)
      const rawName = u?.person?.name || u?.name || u?.username || u?.email || 'unknown'
      const formatted = (typeof rawName === 'string' && rawName.includes('.') && !rawName.includes(' '))
        ? rawName.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
        : rawName
      return {
        id: u.id || u.operator_id || u.user_id || u.uid || 'unknown',
        username: formatted,
      }
    }
  } catch { /* ignore */ }
  return { id: 'unknown', username: 'unknown' }
}

function getTenantPrefix(): string {
  const host = window.location.hostname
  if (host.includes('.korvyan.com')) return host.split('.')[0]
  return 'korvy'
}

export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const user = getUserInfo()
    const ip = await getUserIp()
    const label = buildAuditLabel(data.log_action, data.entity_type, data.entity_name)
    const tenant = getTenantPrefix()
    const payload = {
      tenant,
      log_action:    data.log_action,
      log_row_id:    data.log_row_id    || null,
      log_user_ip:   ip,
      log_old_data:  data.log_old_data  || null,
      log_reason:    data.log_reason    || null,
      entity_type:   data.entity_type   || null,
      entity_name:   data.entity_name   || null,
      label,
      username:      user.username,
      fk_log_use_id: user.id,
      created_at:    serverTimestamp(),
    }
    // Salva na coleção do tenant específico
    await addDoc(collection(db, 'tenants', tenant, AUDIT_COLLECTION), payload)
  } catch (err) {
    console.debug('[Audit] Falha ao salvar log de auditoria:', err)
  }
}

export async function getAuditLogs(filters?: { user_id?: string, action?: string, date_from?: Date, date_to?: Date, max_results?: number, resource?: string }): Promise<any[]> {
  try {
    const raw = await apiPost<any>('/v1/logs/audit/list/', {
      resource: filters?.resource || 'users',
      offset: 0,
      columns: {
        action: true,
        username: true,
        path: true,
        timestamp: true,
        user_ip: true,
        request_id: true
      },
      filters: filters?.user_id ? { user_id: { operation: 'equal', value: filters.user_id } } : {}
    })
    const list = raw.data?.data ?? raw.data ?? raw
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item: any) => {
        let actionStr = item.log_action || 'UNKNOWN'
        if (item.action !== undefined && item.action !== null) {
          if (item.action === 0) actionStr = 'CREATE'
          else if (item.action === 1) actionStr = 'UPDATE'
          else if (item.action === 2) actionStr = 'DELETE'
          else if (item.action === 3) actionStr = 'ACCESS'
          else actionStr = String(item.action)
        }

        return {
          id: item.request_id || item.id || item.pk,
          log_action: actionStr,
          log_user_ip: item.user_ip || item.log_user_ip || '—',
          username: item.username || item.user_name || 'Usuário',
          fk_log_use_id: item.user_id || item.fk_log_use_id,
          created_at: item.timestamp || item.request_started_at || item.created_at || new Date().toISOString(),
          entity_name: item.path || item.entity || item.entity_name,
          entity_type: item.path || item.entity || item.entity_type,
          label: buildAuditLabel(actionStr, item.path || item.entity, item.entity_name)
        }
      })
    }
  } catch (err) {
    console.error('Error fetching audit logs', err)
  }
  return []
}

export async function getAccessLogs(offset = 0): Promise<any[]> {
  try {
    const raw = await apiPost<any>('/v1/logs/access/list/', {
      offset,
      columns: {
        id: true,
        path: true,
        user_name: true,
        user_ip: true,
        success: true,
        request_started_at: true
      },
      filters: {}
    })
    const list = raw.data?.data ?? raw.data ?? raw
    if (Array.isArray(list)) return list
  } catch {
    // silence
  }
  return []
}
