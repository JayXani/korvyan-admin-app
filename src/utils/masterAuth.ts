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
  if (user.profile?.is_admin_profile === true) return true

  // 3. Nome do Perfil ou Role (case-insensitive)
  const profileName = (user.profile?.name || '').trim().toLowerCase()
  if (
    profileName === 'master' ||
    profileName === 'administrador master' ||
    profileName === 'administrador' ||
    profileName === 'admin' ||
    profileName === 'root' ||
    profileName === 'gerente' ||
    profileName === 'gestor'
  ) return true

  const role = (user.role || '').trim().toLowerCase()
  if (
    role === 'master' ||
    role === 'master admin' ||
    role === 'super admin' ||
    role === 'admin master' ||
    role === 'admin' ||
    role === 'administrador' ||
    role === 'root'
  ) return true

  // 4. Escopos de permissão master ou de operador do sistema
  if (
    Array.isArray(user.private_scopes) &&
    user.private_scopes.some((s: any) =>
      s.code === 'master.all' ||
      s.code === 'admin.all' ||
      s.code === 'operator.system.access' ||
      (typeof s.code === 'string' && (s.code.startsWith('admin.') || s.code.startsWith('master.')))
    )
  ) {
    return true
  }

  // 5. Garantia de acesso para administradores e logins padrão
  const login = (user.user_login || user.username || '').toLowerCase().trim()
  if (
    login === 'luan.tolosa' ||
    login === 'danilo.gomes' ||
    login === 'admin' ||
    login === 'root' ||
    login === 'root.admin' ||
    login === 'admin@korvyan.com'
  ) {
    return true
  }

  return false
}
