/**
 * masterAuth.ts — Validação centralizada e escalável de privilégios Master
 * 
 * Regra:
 * 1. O painel Master/Backoffice só pode rodar sob o tenant 'korvy' (korvy.korvyan.com ou localhost em dev).
 * 2. Somente usuários autenticados com perfil Master / superusuário no sistema possuem acesso.
 * 3. O modelo é dinâmico e escalável através dos perfis do sistema (is_superuser, is_master_profile, is_manager_profile).
 * 4. Fallback de segurança para os administradores fundadores (luan.tolosa e danilo.gomes).
 */

export function isKorvyTenantHost(): boolean {
  const host = window.location.hostname
  return (
    host === 'korvy.korvyan.com' ||
    host === 'korvyan.com' ||
    host === 'www.korvyan.com' ||
    host === 'localhost' ||
    host === '127.0.0.1'
  )
}

export function isMasterUser(user: any): boolean {
  if (!user) return false

  // 1. Superusuário Django
  if (user.is_superuser === true) return true

  // 2. Flags do Perfil
  if (user.profile?.is_master_profile === true) return true
  if (user.profile?.is_manager_profile === true) return true

  // 3. Nome do Perfil ou Role como 'Master' (case-insensitive)
  const profileName = (user.profile?.name || '').trim().toLowerCase()
  if (profileName === 'master' || profileName === 'administrador master') return true

  const role = (user.role || '').trim().toLowerCase()
  if (role === 'master' || role === 'super admin' || role === 'admin master') return true

  // 4. Escopos de permissão master
  if (Array.isArray(user.private_scopes) && user.private_scopes.some((s: any) => s.code === 'master.all' || s.code === 'admin.all')) {
    return true
  }

  // 5. Garantia de acesso para administradores fundadores (não mockado exclusivamente, mas como garantia)
  const login = (user.user_login || user.username || '').toLowerCase().trim()
  if (login === 'luan.tolosa' || login === 'danilo.gomes') {
    return true
  }

  return false
}
