/**
 * api.ts — Cliente HTTP centralizado para a API Korvyan
 * Base URL: https://development.korvyan.com
 *
 * Prioridade do token (Bearer):
 *  1. localStorage   (lembrar-me ativo)
 *  2. sessionStorage (sessão temporária)
 *  3. document.cookie (cookie de sessão retornado pela API)
 *
 * Também inclui credentials:'include' para enviar cookies automaticamente.
 *
 * [Analytics] Cada request é logado no Firestore via analytics.service.ts (fire-and-forget).
 */

import { useToast } from '@/composables/useToast'
import axios, { type AxiosResponse } from 'axios'

export function getBaseUrl(): string {
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1' || host === 'korvyan-front.web.app' || host === 'mundial-golden.web.app' || host === 'korvyan-50830.web.app' || host === 'korvyan-50830.firebaseapp.com') {
    return 'https://korvy.korvyan.com' // Master API para ambiente de dev local ou firebase host
  }
  // Em produção, a requisição é direcionada para o próprio subdomínio do tenant
  // Ex: https://(tenant_client).korvyan.com
  return `https://${host}`
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
    public errCode?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface DefaultResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    total_in_page?: number;
    [key: string]: any;
  };
  message?: string;
  error?: {
    status_code: number;
    err_code: string;
    details: any;
  };
}

// ─── Lê token do cookie por nome ───────────────────────────────────────────
function getCookieToken(name: string): string | undefined {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
}

// ─── getToken: autenticação via HttpOnly cookie ─────────────────────────────
// O backend usa cookies HttpOnly (invisíveis ao JS).
// A autenticação é garantida pelo withCredentials: true em todas as requests.
// Esta função retorna null intencionalmente — sem Bearer token no header.
function getToken(): string | null {
  return null
}

// ─── persistTokenFromCookie: mantido por compatibilidade ────────────────────
// No-op: o token é HttpOnly e não pode ser lido via JS.
// A sessão é controlada pelo browser via cookie automático (withCredentials).
export function persistTokenFromCookie(_rememberMe = false): void {
  console.debug('[API] Autenticação via HttpOnly cookie — sem leitura manual de token.')
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const csrf = getCookieToken('csrftoken') || getCookieToken('XSRF-TOKEN')
  if (csrf) {
    headers['X-CSRFToken'] = csrf
    headers['X-CSRF-Token'] = csrf
  }
  
  return headers
}

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (originalRequest?.url?.includes('/auth/')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          const csrf = getCookieToken('csrftoken') || getCookieToken('XSRF-TOKEN')
          if (csrf) {
            originalRequest.headers['X-CSRFToken'] = csrf
            originalRequest.headers['X-CSRF-Token'] = csrf
          }
          return axios(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await axios.post(`${getBaseUrl()}/v1/auth/refresh`, {}, {
          withCredentials: true,
          headers: buildHeaders()
        })
        
        isRefreshing = false
        processQueue(null, 'refreshed')
        
        const csrf = getCookieToken('csrftoken') || getCookieToken('XSRF-TOKEN')
        if (csrf) {
          originalRequest.headers['X-CSRFToken'] = csrf
          originalRequest.headers['X-CSRF-Token'] = csrf
        }
        return axios(originalRequest)
      } catch (err: any) {
        processQueue(err, null)
        isRefreshing = false
        
        // Se a rota de refresh falhar (como erro 500 ou 401), forçamos o logout apenas em páginas privadas
        if (err?.response?.status >= 400 && err?.response?.status <= 500) {
          localStorage.removeItem('user_info')
          sessionStorage.removeItem('user_info')
          const publicPaths = ['/landing', '/login', '/onboarding', '/find-workspace', '/portal-login', '/master-login', '/client-area', '/registrar', '/recuperar-senha', '/email-enviado']
          const isPublicPath = publicPaths.some(p => window.location.pathname.startsWith(p))
          if (!isPublicPath) {
            window.location.href = '/login'
          }
        }
        
        return Promise.reject(err)
      }
    }
    return Promise.reject(error)
  }
)

// ─── Analytics — fire-and-forget verdadeiro ──────────────────────────────────
// Usa queueMicrotask para garantir que o log NUNCA bloqueia a resposta da API.
// O módulo analytics é carregado lazy na primeira chamada.
let _logRequest: ((entry: any) => Promise<void>) | null = null

function trackRequest(path: string, method: string, status: number, duration_ms: number, success: boolean, error_msg?: string): void {
  // Desativado por padrão para evitar milhares de escritas no Firestore e cobranças indesejadas no Firebase.
  // Ative somente se necessitar de rastreamento completo de performance HTTP.
  return
}

// ─── Audit Logging — fire-and-forget verdadeiro ──────────────────────────────
let _logAudit: ((data: any) => Promise<void>) | null = null

function trackAudit(path: string, method: string, body?: any, responseData?: any): void {
  if (method === 'GET') return
  // Ignora endpoints de listagem/consulta que usam POST por convenção
  if (method === 'POST' && (path.endsWith('/list/') || path.endsWith('/list'))) return
  queueMicrotask(async () => {
    try {
      if (!_logAudit) {
        const mod = await import('./audit.service')
        _logAudit = mod.logAudit
      }
      let action = 'UPDATE'
      if (method === 'POST') action = 'CREATE'
      else if (method === 'DELETE') action = 'DELETE'
      // Tenta extrair entidade da rota: /v1/contract/ → 'contrato'
      const entityMap: Record<string, string> = {
        contract: 'contrato', operator: 'usuario', profile: 'perfil',
        plan: 'plano', bank: 'banco', scope: 'escopo', tenant: 'empresa',
        benefit: 'beneficio', religion: 'religiao', status: 'status',
        applicant: 'solicitante', report: 'relatorio',
      }
      const seg = path.split('/').find(s => entityMap[s])
      const entity_type = seg ? entityMap[seg] : undefined
      const parts = path.split('/').filter(Boolean)
      let log_row_id = parts.length > 0 ? parts[parts.length - 1] : null
      if (log_row_id && log_row_id.length < 3) log_row_id = null
      // Tenta extrair nome do item da resposta
      const rData = responseData?.data ?? responseData
      const entity_name =
        rData?.name || rData?.code || rData?.title ||
        rData?.person?.name || rData?.username ||
        body?.name || body?.code || body?.title || body?.use_login ||
        undefined
      void _logAudit({ log_action: action, entity_type, entity_name, log_row_id, log_old_data: null, log_reason: body?.reason || null })
    } catch {
      // Silencioso
    }
  })
}

// ─── Dicionário de Nomes Amigáveis de Campos (Validação) ─────────────────────
export const FIELD_LABELS: Record<string, string> = {
  code: 'Código/Número',
  value_enrollment: 'Valor de adesão',
  value_recurring: 'Valor recorrente',
  plan_id: 'Plano',
  plan: 'Plano',
  bank_id: 'Banco',
  bank: 'Banco',
  first_payment_at: 'Data do 1º pagamento',
  date_enrollment: 'Data de adesão',
  start_at: 'Data de início',
  end_at: 'Data de término',
  due_day: 'Dia de vencimento',
  due_at: 'Data de vencimento',
  payment_method: 'Método de pagamento',
  payment_recurrence_type: 'Tipo de recorrência',
  applicant_id: 'Titular/Solicitante',
  applicant: 'Titular/Solicitante',
  seller_id: 'Vendedor',
  seller: 'Vendedor',
  contract_id: 'Contrato',
  contract: 'Contrato',
  contract_template_id: 'Template de contrato',
  contract_template: 'Template de contrato',
  name: 'Nome',
  username: 'Nome de usuário',
  user_login: 'Login',
  email: 'E-mail',
  password: 'Senha',
  password_confirmation: 'Confirmação de senha',
  cpf: 'CPF',
  cnpj: 'CNPJ',
  rg: 'RG',
  phone: 'Telefone',
  cellphone: 'Celular',
  birth_date: 'Data de nascimento',
  date_birthday: 'Data de nascimento',
  gender: 'Gênero',
  marital_status: 'Estado civil',
  zip_code: 'CEP',
  cep: 'CEP',
  street: 'Rua/Logradouro',
  address: 'Endereço',
  number: 'Número',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'Estado',
  complement: 'Complemento',
  description: 'Descrição',
  status: 'Status',
  status_id: 'Status',
  role: 'Cargo/Função',
  profile_id: 'Perfil de acesso',
  profiles: 'Perfis',
  scopes: 'Permissões/Escopos',
  scope_id: 'Permissão/Escopo',
  title: 'Título',
  content: 'Conteúdo',
  observations: 'Observações',
  notes: 'Observações',
  amount: 'Valor',
  total: 'Valor total',
  installments: 'Parcelas',
  frequency: 'Frequência',
  grace_period: 'Carência',
  grace_period_days: 'Dias de carência',
  family_relationship_type: 'Grau de parentesco',
  is_primary_holder: 'Titular principal',
  active: 'Ativo',
  version: 'Versão',
  file_url: 'Arquivo/URL',
  logo_url: 'Logo',
  primary_color: 'Cor primária',
  tenant_prefix: 'Prefixo da empresa',
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  'this field is required': 'Este campo é obrigatório',
  'field required': 'Campo obrigatório',
  'already exists': 'Já cadastrado / Já existe',
  'invalid value': 'Valor inválido',
  'invalid date': 'Data inválida',
  'invalid format': 'Formato inválido',
  'invalid email': 'E-mail inválido',
  'invalid cpf': 'CPF inválido',
  'invalid cnpj': 'CNPJ inválido',
  'not found': 'Não encontrado',
  'must be a valid number': 'Deve ser um número válido',
  'must be a valid integer': 'Deve ser um número inteiro válido',
  'must be a valid string': 'Texto inválido',
  'must be a valid boolean': 'Valor booleano inválido',
  'must be a valid uuid': 'Identificador inválido (UUID)',
  'value is not a valid integer': 'Deve ser um número inteiro válido',
  'value is not a valid float': 'Deve ser um número válido',
  'value is not a valid email address': 'Endereço de e-mail inválido',
  'string does not match regex': 'Formato inválido',
  'ensure this value has at least': 'Tamanho mínimo não atingido',
  'ensure this value has at most': 'Tamanho máximo excedido',
}

export function translateErrorMessage(msg: string): string {
  if (!msg || typeof msg !== 'string') return String(msg || '')
  let translated = msg.trim()
  for (const [en, pt] of Object.entries(ERROR_TRANSLATIONS)) {
    if (translated.toLowerCase().includes(en)) {
      translated = translated.replace(new RegExp(en, 'gi'), pt)
    }
  }
  return translated
}

export function formatValidationDetails(details: any): string {
  if (!details) return ''
  if (typeof details === 'string') {
    return translateErrorMessage(details)
  }
  if (Array.isArray(details)) {
    return details
      .map(item => typeof item === 'object' && item !== null ? formatValidationDetails(item) : translateErrorMessage(String(item)))
      .filter(Boolean)
      .join('; ')
  }
  if (typeof details === 'object' && details !== null) {
    const formattedErrors: string[] = []
    for (const [key, value] of Object.entries(details)) {
      const fieldName = FIELD_LABELS[key] || FIELD_LABELS[key.toLowerCase()] || key
      let valStr = ''
      if (Array.isArray(value)) {
        valStr = value
          .map(v => typeof v === 'object' && v !== null ? formatValidationDetails(v) : translateErrorMessage(String(v)))
          .filter(Boolean)
          .join(', ')
      } else if (typeof value === 'object' && value !== null) {
        valStr = formatValidationDetails(value)
      } else {
        valStr = translateErrorMessage(String(value ?? ''))
      }
      formattedErrors.push(`${fieldName}: ${valStr}`)
    }
    return formattedErrors.length > 0 ? formattedErrors.join(' | ') : 'Erro de validação nos campos.'
  }
  return String(details)
}

// ─── Response Handler — tracking é fire-and-forget (não bloqueia o retorno) ──
function handleAxiosSuccess<T>(res: AxiosResponse, path: string, method: string, t0: number, reqBody?: unknown): T {
  const duration_ms = Math.round(performance.now() - t0)

  // Ambas as calls são void — não bloqueiam
  trackRequest(path, method, res.status, duration_ms, true)
  if (method !== 'GET') trackAudit(path, method, reqBody, res.data)

  if (res.status === 204) return undefined as T

  if (res.data && typeof res.data === 'object' && 'success' in res.data) {
    // Backend retornou HTTP 200 mas com success: false — tratar como erro
    if (res.data.success === false) {
      const errPayload = res.data.error
      let msg = 'Operação falhou no servidor.'
      let errCode = null
      let details = null
      if (errPayload && typeof errPayload === 'object') {
        errCode = errPayload.err_code || null
        details = errPayload.details || null
        if (details) {
          const formatted = formatValidationDetails(details)
          if (formatted) msg = formatted
        } else if (errPayload.message) {
          msg = translateErrorMessage(errPayload.message)
        }
      }
      trackRequest(path, method, res.status, duration_ms, false, msg)
      throw new ApiError(res.status, msg, res.data, errCode, details)
    }
    return res.data as T
  }
  return res.data as T
}

async function handleAxiosError(err: unknown, path: string, method: string, t0: number): Promise<never> {
  const duration_ms = Math.round(performance.now() - t0)

  if (axios.isAxiosError(err) && err.response) {
    const res = err.response
    const payload = res.data
    
    // Tratamento para o envelope de erro padronizado do backend: { success: false, error: { ... } }
    let errCode = null
    let details = null
    let msg = `Erro ${res.status}: ${res.statusText}`

    if (res.status === 401) {
      localStorage.removeItem('user_info')
      sessionStorage.removeItem('user_info')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    if (payload && typeof payload === 'object') {
      if (payload.error && typeof payload.error === 'object') {
        errCode = payload.error.err_code || null
        details = payload.error.details || null
        
        // Formatar mensagem baseada nos details
        if (details) {
          msg = formatValidationDetails(details)
        } else if (payload.error.message) {
          msg = translateErrorMessage(payload.error.message)
        }
      } else {
        // Fallback antigo
        errCode = payload.error?.err_code || payload.error?.code || null
        details = payload.error?.details || payload.error?.detail || null
        if (details) {
          msg = formatValidationDetails(details)
        } else if (payload.detail || payload.message) {
          msg = translateErrorMessage(payload.detail || payload.message)
        }
      }
    }

    trackRequest(path, method, res.status, duration_ms, false, msg)
    throw new ApiError(res.status, msg, payload, errCode, details)
  }
  
  const errMsg = err instanceof Error ? err.message : String(err)
  trackRequest(path, method, 0, duration_ms, false, errMsg)
  throw new ApiError(0, errMsg)
}

// ─── Métodos HTTP ─────────────────────────────────────────────────────────────

export async function apiGet<T>(path: string): Promise<T> {
  const t0 = performance.now()
  try {
    const res = await axios.get(`${getBaseUrl()}${path}`, {
      headers: buildHeaders(),
      withCredentials: true,
    })
    return handleAxiosSuccess<T>(res, path, 'GET', t0)
  } catch (err) {
    return handleAxiosError(err, path, 'GET', t0)
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const t0 = performance.now()
  try {
    const res = await axios.post(`${getBaseUrl()}${path}`, body, {
      headers: buildHeaders(),
      withCredentials: true,
    })
    return handleAxiosSuccess<T>(res, path, 'POST', t0, body)
  } catch (err) {
    return handleAxiosError(err, path, 'POST', t0)
  }
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const t0 = performance.now()
  try {
    const res = await axios.put(`${getBaseUrl()}${path}`, body, {
      headers: buildHeaders(),
      withCredentials: true,
    })
    return handleAxiosSuccess<T>(res, path, 'PUT', t0, body)
  } catch (err) {
    return handleAxiosError(err, path, 'PUT', t0)
  }
}

export async function apiPutForm<T>(path: string, formData: FormData): Promise<T> {
  const t0 = performance.now()
  try {
    const headers = buildHeaders()
    delete headers['Content-Type']
    const res = await axios.put(`${getBaseUrl()}${path}`, formData, {
      headers,
      withCredentials: true,
    })
    return handleAxiosSuccess<T>(res, path, 'PUT', t0)
  } catch (err) {
    return handleAxiosError(err, path, 'PUT', t0)
  }
}


export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const t0 = performance.now()
  try {
    const res = await axios.patch(`${getBaseUrl()}${path}`, body, {
      headers: buildHeaders(),
      withCredentials: true,
    })
    return handleAxiosSuccess<T>(res, path, 'PATCH', t0, body)
  } catch (err) {
    return handleAxiosError(err, path, 'PATCH', t0)
  }
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  const t0 = performance.now()
  try {
    const res = await axios.delete(`${getBaseUrl()}${path}`, {
      headers: buildHeaders(),
      data: body,
      withCredentials: true,
    })
    return handleAxiosSuccess<T>(res, path, 'DELETE', t0, body)
  } catch (err) {
    return handleAxiosError(err, path, 'DELETE', t0)
  }
}
