import { ref } from 'vue'
import { getTenantByPrefix, type Tenant } from '@/services/tenant.service'

const currentTenant = ref<Tenant | null>(null)
const isLoadingTenant = ref(true)

export function getCurrentTenantPrefix(): string {
  if (currentTenant.value?.tenant_prefix) {
    return currentTenant.value.tenant_prefix
  }

  const host = window.location.hostname
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    const firstPart = host.split('.')[0]
    if (
      firstPart &&
      firstPart !== 'korvyan-front' &&
      firstPart !== 'korvyan-50830' &&
      !firstPart.includes('firebaseapp')
    ) {
      return firstPart
    }
  }

  try {
    const raw = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
    if (raw) {
      const u = JSON.parse(raw)
      const tp = u?.tenant_prefix || u?.tenant?.tenant_prefix || u?.tenant || u?.tenant_code
      if (tp && typeof tp === 'string' && tp.trim()) return tp.trim()
    }
  } catch {}

  try {
    const params = new URLSearchParams(window.location.search)
    const tenantParam = params.get('tenant')
    if (tenantParam) return tenantParam
  } catch {}

  return 'korvy'
}

export function useTenantContext() {
  const loadTenantContext = async () => {
    const host = window.location.hostname
    const isMaster = host === 'korvy.korvyan.com'

    if (isMaster) {
      currentTenant.value = {
        tenant_prefix: 'korvy',
        name: 'Korvyan',
        primary_color: '#D4AF37',
        plan: 'Master',
        status: 'ACTIVE'
      }
    } else {
      const prefix = getCurrentTenantPrefix()
      try {
        const t = await getTenantByPrefix(prefix)
        if (t) currentTenant.value = t
        else {
          currentTenant.value = {
            tenant_prefix: prefix,
            name: prefix.charAt(0).toUpperCase() + prefix.slice(1),
            primary_color: '#D4AF37',
            plan: 'Basic',
            status: 'ACTIVE'
          }
        }
      } catch (err) {
        console.warn('[TenantContext] Falha ao carregar tenant:', err)
      }
    }

    if (currentTenant.value?.primary_color) {
      document.documentElement.style.setProperty('--gold', currentTenant.value.primary_color)
    }

    isLoadingTenant.value = false
  }

  const getInitials = (name?: string) => {
    if (!name) return 'KV'
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('').substring(0, 2) || 'KV'
  }

  return {
    currentTenant,
    isLoadingTenant,
    loadTenantContext,
    getInitials,
    getCurrentTenantPrefix
  }
}

