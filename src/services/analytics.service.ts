/**
 * analytics.service.ts — Middleware de observabilidade (Firestore-backed)
 *
 * Registra automaticamente cada chamada de API no Firestore (coleção api_logs).
 * Todas as escritas são fire-and-forget — nunca bloqueiam o request principal.
 *
 * Estrutura do documento:
 * {
 *   route:       '/v1/operator/list/',
 *   method:      'POST',
 *   status:      200,
 *   duration_ms: 145,
 *   tenant:      'localhost',
 *   success:     true,
 *   error_msg:   null,
 *   timestamp:   ServerTimestamp,
 *   date_hour:   '2026-07-09T23',
 *   date_day:    '2026-07-09',
 * }
 */
import { firebaseApp } from './firebase.config'
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore'

const db = getFirestore(firebaseApp)
const LOGS_COLLECTION = 'api_logs'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ApiLogEntry {
  route: string
  method: string
  status: number
  duration_ms: number
  tenant: string
  success: boolean
  error_msg?: string | null
  timestamp?: any
  date_hour?: string
  date_day?: string
}

export interface ApiStats {
  total: number
  errors: number
  error_rate: number          // 0–100 (%)
  avg_duration_ms: number
  p95_duration_ms: number
  active_tenants: string[]
  top_routes: { route: string; count: number }[]
  by_status: { status: number; count: number }[]
  by_hour: { hour: string; count: number; errors: number }[]
  by_tenant: { tenant: string; count: number }[]
  recent: ApiLogEntry[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTenant(): string {
  try {
    const info = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
    if (info) {
      const parsed = JSON.parse(info)
      return parsed.tenant || parsed.tenant_prefix || 'default'
    }
  } catch { /* ignore */ }
  return 'default'
}

function getNow() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date_day:  `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,
    date_hour: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}`,
  }
}

function getTenantPrefix(): string {
  const host = window.location.hostname
  if (host.includes('.korvyan.com')) return host.split('.')[0]
  return 'korvy'
}

/**
 * Salva um log de API no Firestore sob o tenant específico.
 * Deve ser chamado de forma fire-and-forget.
 */
export async function logRequest(entry: Omit<ApiLogEntry, 'timestamp' | 'date_hour' | 'date_day' | 'tenant'>): Promise<void> {
  try {
    const { date_day, date_hour } = getNow()
    const tenant = getTenantPrefix()
    await addDoc(collection(db, 'tenants', tenant, LOGS_COLLECTION), {
      ...entry,
      tenant,
      date_day,
      date_hour,
      timestamp: serverTimestamp(),
    })
  } catch (err) {
    console.debug('[Analytics] Falha ao salvar log:', err)
  }
}

/**
 * Busca os últimos N logs com filtros opcionais para o tenant atual.
 */
export async function getRecentLogs(opts: {
  limitN?: number
  tenant?: string
  route?: string
  since_day?: string // 'YYYY-MM-DD'
} = {}): Promise<ApiLogEntry[]> {
  try {
    const tenant = opts.tenant || getTenantPrefix()
    const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc')]

    if (opts.since_day) constraints.push(where('date_day', '>=', opts.since_day))
    if (opts.route) constraints.push(where('route', '==', opts.route))
    constraints.push(limit(opts.limitN ?? 100))

    const q = query(collection(db, 'tenants', tenant, LOGS_COLLECTION), ...constraints)
    const snap = await getDocs(q)
    return snap.docs.map(d => {
      const data = d.data()
      return {
        ...data,
        timestamp: data.timestamp instanceof Timestamp
          ? data.timestamp.toDate().toISOString()
          : data.timestamp,
      } as ApiLogEntry
    })
  } catch {
    return []
  }
}

/**
 * Calcula estatísticas agregadas a partir dos logs das últimas N horas.
 */
export async function getStats(lastDays = 1): Promise<ApiStats> {
  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - lastDays)
  const pad = (n: number) => String(n).padStart(2, '0')
  const since_day = `${sinceDate.getFullYear()}-${pad(sinceDate.getMonth()+1)}-${pad(sinceDate.getDate())}`

  const logs = await getRecentLogs({ since_day, limitN: 500 })

  if (logs.length === 0) {
    return {
      total: 0, errors: 0, error_rate: 0, avg_duration_ms: 0,
      p95_duration_ms: 0, active_tenants: [], top_routes: [],
      by_status: [], by_hour: [], by_tenant: [], recent: [],
    }
  }

  // ── Métricas base ──
  const errors = logs.filter(l => !l.success).length
  const durations = logs.map(l => l.duration_ms).sort((a, b) => a - b)
  const avg_duration_ms = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
  const p95_duration_ms = durations[Math.floor(durations.length * 0.95)] ?? 0

  // ── Top Routes ──
  const routeCount = new Map<string, number>()
  for (const l of logs) {
    routeCount.set(l.route, (routeCount.get(l.route) || 0) + 1)
  }
  const top_routes = [...routeCount.entries()]
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // ── By Status ──
  const statusCount = new Map<number, number>()
  for (const l of logs) {
    statusCount.set(l.status, (statusCount.get(l.status) || 0) + 1)
  }
  const by_status = [...statusCount.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => a.status - b.status)

  // ── By Hour (últimas 24h) ──
  const hourMap = new Map<string, { count: number; errors: number }>()
  // Preenche todas as horas com zero
  for (let i = 23; i >= 0; i--) {
    const d = new Date(); d.setHours(d.getHours() - i)
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}`
    hourMap.set(key, { count: 0, errors: 0 })
  }
  for (const l of logs) {
    if (l.date_hour && hourMap.has(l.date_hour)) {
      const h = hourMap.get(l.date_hour)!
      h.count++
      if (!l.success) h.errors++
    }
  }
  const by_hour = [...hourMap.entries()].map(([hour, v]) => ({ hour, ...v }))

  // ── By Tenant ──
  const tenantCount = new Map<string, number>()
  for (const l of logs) {
    tenantCount.set(l.tenant, (tenantCount.get(l.tenant) || 0) + 1)
  }
  const by_tenant = [...tenantCount.entries()]
    .map(([tenant, count]) => ({ tenant, count }))
    .sort((a, b) => b.count - a.count)

  return {
    total: logs.length,
    errors,
    error_rate: Math.round((errors / logs.length) * 100),
    avg_duration_ms,
    p95_duration_ms,
    active_tenants: [...tenantCount.keys()],
    top_routes,
    by_status,
    by_hour,
    by_tenant,
    recent: logs.slice(0, 50),
  }
}
