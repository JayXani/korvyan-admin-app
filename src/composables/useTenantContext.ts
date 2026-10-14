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

export function applyTenantTheme(color: string) {
  if (!color) return
  const root = document.documentElement
  root.style.setProperty('--gold', color)
  root.style.setProperty('--auth-icon', color)
  root.style.setProperty('--auth-link', color)

  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)

    root.style.setProperty('--gold-rgb', `${r}, ${g}, ${b}`)
    root.style.setProperty('--tenant-rgb', `${r}, ${g}, ${b}`)
    root.style.setProperty('--gold-light', `rgba(${r}, ${g}, ${b}, 0.15)`)
    root.style.setProperty('--gold-dim', `rgba(${r}, ${g}, ${b}, 0.08)`)
    root.style.setProperty('--gold-shadow', `rgba(${r}, ${g}, ${b}, 0.35)`)
    root.style.setProperty('--gold-border', `rgba(${r}, ${g}, ${b}, 0.25)`)

    // Hover (15% darker) & Dark (25% darker) & Deep (45% darker)
    const hr = Math.max(0, Math.floor(r * 0.85))
    const hg = Math.max(0, Math.floor(g * 0.85))
    const hb = Math.max(0, Math.floor(b * 0.85))
    const hoverColor = `rgb(${hr}, ${hg}, ${hb})`
    root.style.setProperty('--gold-hover', hoverColor)

    const dr = Math.max(0, Math.floor(r * 0.70))
    const dg = Math.max(0, Math.floor(g * 0.70))
    const db = Math.max(0, Math.floor(b * 0.70))
    const darkColor = `rgb(${dr}, ${dg}, ${db})`
    root.style.setProperty('--gold-dark', darkColor)

    const deepR = Math.max(0, Math.floor(r * 0.50))
    const deepG = Math.max(0, Math.floor(g * 0.50))
    const deepB = Math.max(0, Math.floor(b * 0.50))
    root.style.setProperty('--gold-deep', `rgb(${deepR}, ${deepG}, ${deepB})`)

    // Elegant readable tint for text labels
    const labelR = Math.min(255, Math.floor(r * 0.65 + 255 * 0.35))
    const labelG = Math.min(255, Math.floor(g * 0.65 + 255 * 0.35))
    const labelB = Math.min(255, Math.floor(b * 0.65 + 255 * 0.35))
    const labelColor = `rgb(${labelR}, ${labelG}, ${labelB})`
    root.style.setProperty('--auth-label', labelColor)
    root.style.setProperty('--auth-card-border', `rgba(${r}, ${g}, ${b}, 0.28)`)
    root.style.setProperty('--auth-input-border', `rgba(${r}, ${g}, ${b}, 0.25)`)
    root.style.setProperty('--auth-input-placeholder', `rgba(${labelR}, ${labelG}, ${labelB}, 0.5)`)

    // Contrast text calculation (ITU-R BT.709)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    const textColor = luminance > 0.55 ? '#1a1a1a' : '#ffffff'
    root.style.setProperty('--gold-text', textColor)

    // Dynamic monochromatic gradient matching the tenant color
    root.style.setProperty('--gold-gradient', `linear-gradient(135deg, ${color} 0%, ${darkColor} 100%)`)
    root.style.setProperty('--gold-gradient-shine', `linear-gradient(90deg, ${color} 0%, rgba(255, 255, 255, 0.6) 50%, ${color} 100%)`)
  } else {
    root.style.setProperty('--gold-hover', color)
    root.style.setProperty('--gold-dark', color)
    root.style.setProperty('--gold-gradient', `linear-gradient(135deg, ${color} 0%, ${color} 100%)`)
  }
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
      applyTenantTheme(currentTenant.value.primary_color)
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

