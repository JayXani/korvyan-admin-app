/**
 * auth.service.ts — Serviço de autenticação
 *
 * Endpoints (api.json — Korvyan Insurance Management):
 *   POST /v1/auth/token   → Login (obtém access_token)
 *   POST /v1/auth/logout  → Logout server-side (invalida sessão)
 *
 * O logout client-side (authLogout) limpa localStorage/sessionStorage.
 * O logout server-side (authLogoutApi) faz a chamada à API.
 */
import { apiPost } from './api'

export interface LoginPayload {
  use_login: string
  password: string
}

// Formato real da resposta: { "success": true, "data": {...}, "message": "Sucesso ! Login realizado." }
export interface LoginData {
  access_token?: string
  token?: string
  refresh_token?: string
  token_type?: string
  user?: {
    id: string
    name: string
    username?: string
    email?: string
    role?: string
  }
  [key: string]: unknown
}

export interface LoginResponse {
  success: boolean
  data: LoginData
  message?: string
}

export function authLogin(payload: LoginPayload): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/v1/auth/token', payload)
}

export interface RegisterPayload {
  name: string
  email: string
  use_login?: string
  password?: string
  [key: string]: any
}

/** Registro de usuário — POST /v1/auth/register (ou equivalente) */
export function authRegister(payload: RegisterPayload): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/v1/auth/register', payload)
}

/** Login via Google (Firebase ID Token) — POST /v1/auth/google/token/ */
export function authGoogleLogin(idToken: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/v1/auth/google/token/', { id_token: idToken })
}

/** Logout server-side — invalida a sessão via POST /v1/auth/logout */
export function authLogoutApi(): Promise<unknown> {
  return apiPost<unknown>('/v1/auth/logout', {})
}

/** Logout client-side — limpa dados de sessão do storage local */
export function authLogout(): void {
  // O cookie HttpOnly é apagado pelo servidor no logout server-side.
  // Aqui apenas limpamos os dados de UI salvos localmente.
  localStorage.removeItem('user_info')
  localStorage.removeItem('remember_me')
  localStorage.removeItem('saved_username')
  sessionStorage.removeItem('user_info')
}

/** Solicitação de recuperação de senha — tenta via REST e informa status */
export async function requestPasswordReset(email: string): Promise<boolean> {
  try {
    await apiPost('/v1/auth/reset-password', { email })
    return true
  } catch (err) {
    console.warn('[AuthService] Rota REST de reset de senha indisponível, usando fallback:', err)
    return false
  }
}
