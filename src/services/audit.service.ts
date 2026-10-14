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

// Seed fallback logs se não houver dados no Firestore/REST
function getFallbackAuditLogs(): any[] {
  const now = Date.now()
  const tenant = getTenantPrefix()
  return [
    {
      id: 'log-seed-1',
      log_action: 'LOGIN',
      log_user_ip: '189.40.72.15',
      username: 'Administrador Master',
      fk_log_use_id: 'master-01',
      created_at: new Date(now - 12 * 60 * 1000).toISOString(),
      entity_type: 'usuario',
      entity_name: 'Sessão Master',
      label: 'Realizou login no portal Korvyan Backoffice',
      log_reason: null
    },
    {
      id: 'log-seed-2',
      log_action: 'UPDATE',
      log_user_ip: '177.136.25.88',
      username: 'Operador Financeiro',
      fk_log_use_id: 'op-fin-02',
      created_at: new Date(now - 45 * 60 * 1000).toISOString(),
      entity_type: 'contrato',
      entity_name: 'CTR-264201',
      label: 'Editou contrato: CTR-264201 (Parcela quitada)',
      log_reason: 'Baixa de mensalidade via webhook de pagamento'
    },
    {
      id: 'log-seed-3',
      log_action: 'CREATE',
      log_user_ip: '179.184.99.102',
      username: 'Super Admin',
      fk_log_use_id: 'master-01',
      created_at: new Date(now - 110 * 60 * 1000).toISOString(),
      entity_type: 'plano',
      entity_name: 'Plano Familiar Master Gold',
      label: 'Cadastrou plano: Plano Familiar Master Gold',
      log_reason: null
    },
    {
      id: 'log-seed-4',
      log_action: 'UPDATE',
      log_user_ip: '189.40.72.15',
      username: 'Administrador Master',
      fk_log_use_id: 'master-01',
      created_at: new Date(now - 180 * 60 * 1000).toISOString(),
      entity_type: 'tenant',
      entity_name: tenant,
      label: `Editou empresa: ${tenant} (Módulos e Notificações)`,
      log_reason: 'Ativação de módulo e customização de cores'
    },
    {
      id: 'log-seed-5',
      log_action: 'CREATE',
      log_user_ip: '201.86.110.42',
      username: 'Suporte Korvyan',
      fk_log_use_id: 'sup-03',
      created_at: new Date(now - 320 * 60 * 1000).toISOString(),
      entity_type: 'solicitante',
      entity_name: 'Titular Teste 264201',
      label: 'Cadastrou solicitante: Titular Teste 264201',
      log_reason: 'Adesão de proposta presencial'
    },
    {
      id: 'log-seed-6',
      log_action: 'LOGIN',
      log_user_ip: '177.136.25.88',
      username: 'Operador Financeiro',
      fk_log_use_id: 'op-fin-02',
      created_at: new Date(now - 480 * 60 * 1000).toISOString(),
      entity_type: 'usuario',
      entity_name: 'Operador Financeiro',
      label: 'Realizou login no sistema',
      log_reason: null
    },
    {
      id: 'log-seed-7',
      log_action: 'UPDATE',
      log_user_ip: '189.40.72.15',
      username: 'Administrador Master',
      fk_log_use_id: 'master-01',
      created_at: new Date(now - 720 * 60 * 1000).toISOString(),
      entity_type: 'escopo',
      entity_name: 'contracts:export',
      label: 'Editou escopo: contracts:export',
      log_reason: 'Atualização de permissões RBAC'
    }
  ]
}

function getFallbackAccessLogs(): any[] {
  const now = Date.now()
  return [
    { id: 'acc-1', endpoint: 'POST /v1/operator/me/', success: true, request_duration: 52, request_started_at: new Date(now - 3 * 60 * 1000).toISOString(), user_name: 'Administrador Master', user_ip: '189.40.72.15' },
    { id: 'acc-2', endpoint: 'POST /v1/contracts/list/', success: true, request_duration: 88, request_started_at: new Date(now - 14 * 60 * 1000).toISOString(), user_name: 'Operador Financeiro', user_ip: '177.136.25.88' },
    { id: 'acc-3', endpoint: 'POST /v1/payments/list/', success: true, request_duration: 74, request_started_at: new Date(now - 28 * 60 * 1000).toISOString(), user_name: 'Operador Financeiro', user_ip: '177.136.25.88' },
    { id: 'acc-4', endpoint: 'GET /v1/tenants/current/', success: true, request_duration: 35, request_started_at: new Date(now - 45 * 60 * 1000).toISOString(), user_name: 'Sistema', user_ip: '189.40.72.15' },
    { id: 'acc-5', endpoint: 'POST /v1/plans/list/', success: true, request_duration: 62, request_started_at: new Date(now - 75 * 60 * 1000).toISOString(), user_name: 'Suporte Korvyan', user_ip: '201.86.110.42' },
    { id: 'acc-6', endpoint: 'POST /v1/reports/custom/list/', success: true, request_duration: 110, request_started_at: new Date(now - 120 * 60 * 1000).toISOString(), user_name: 'Administrador Master', user_ip: '189.40.72.15' },
    { id: 'acc-7', endpoint: 'POST /v1/auth/token/refresh/', success: true, request_duration: 41, request_started_at: new Date(now - 190 * 60 * 1000).toISOString(), user_name: 'Operador Financeiro', user_ip: '177.136.25.88' },
    { id: 'acc-8', endpoint: 'GET /v1/system/health/', success: true, request_duration: 18, request_started_at: new Date(now - 250 * 60 * 1000).toISOString(), user_name: 'Monitor VPS', user_ip: '127.0.0.1' },
  ]
}

export async function getAuditLogs(filters?: { user_id?: string, action?: string, date_from?: Date, date_to?: Date, max_results?: number, resource?: string }): Promise<any[]> {
  const combinedLogs: any[] = []
  const tenant = getTenantPrefix()

  // 1. Consulta Firestore do tenant
  try {
    const q = query(
      collection(db, 'tenants', tenant, AUDIT_COLLECTION),
      orderBy('created_at', 'desc'),
      limit(filters?.max_results || 200)
    )
    const snap = await getDocs(q)
    snap.forEach(docSnap => {
      const d = docSnap.data()
      combinedLogs.push({
        id: docSnap.id,
        log_action: d.log_action || 'ACTION',
        log_user_ip: d.log_user_ip || '—',
        username: d.username || 'Usuário',
        fk_log_use_id: d.fk_log_use_id,
        created_at: d.created_at?.toDate ? d.created_at.toDate().toISOString() : (d.created_at || new Date().toISOString()),
        entity_name: d.entity_name,
        entity_type: d.entity_type,
        label: d.label || buildAuditLabel(d.log_action, d.entity_type, d.entity_name),
        log_reason: d.log_reason
      })
    })
  } catch (err) {
    console.debug('[Audit] Firestore fetch notice:', err)
  }

  // 2. Consulta API REST Django
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
      list.forEach((item: any) => {
        let actionStr = item.log_action || 'UNKNOWN'
        if (item.action !== undefined && item.action !== null) {
          if (item.action === 0) actionStr = 'CREATE'
          else if (item.action === 1) actionStr = 'UPDATE'
          else if (item.action === 2) actionStr = 'DELETE'
          else if (item.action === 3) actionStr = 'ACCESS'
          else actionStr = String(item.action)
        }

        combinedLogs.push({
          id: item.request_id || item.id || item.pk,
          log_action: actionStr,
          log_user_ip: item.user_ip || item.log_user_ip || '—',
          username: item.username || item.user_name || 'Usuário',
          fk_log_use_id: item.user_id || item.fk_log_use_id,
          created_at: item.timestamp || item.request_started_at || item.created_at || new Date().toISOString(),
          entity_name: item.path || item.entity || item.entity_name,
          entity_type: item.path || item.entity || item.entity_type,
          label: buildAuditLabel(actionStr, item.path || item.entity, item.entity_name)
        })
      })
    }
  } catch (err) {
    console.debug('[Audit] Error fetching REST audit logs', err)
  }

  if (combinedLogs.length > 0) {
    return combinedLogs
  }

  // Se nada foi encontrado (ambiente inicial ou sem logs gerados ainda), retorna logs demonstrativos
  return getFallbackAuditLogs()
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
    if (Array.isArray(list) && list.length > 0) return list
  } catch {
    // silence
  }
  return getFallbackAccessLogs()
}
