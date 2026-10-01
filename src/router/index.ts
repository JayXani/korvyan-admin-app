import { createRouter, createWebHistory } from 'vue-router'
import { isKorvyTenantHost, isMasterUser } from '@/utils/masterAuth'

const LoginView = () => import('@/views/LoginView.vue')
const BackofficeView = () => import('@/views/BackofficeView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/master-login',
      redirect: '/login',
    },
    {
      path: '/',
      name: 'backoffice',
      component: BackofficeView,
    },
    {
      path: '/backoffice',
      redirect: '/',
    },
    {
      path: '/dashboard',
      redirect: '/',
    },
    {
      path: '/deploy',
      redirect: '/?tab=deploy',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  // 1. Verificação estrita de Tenant: O Backoffice só existe sob o tenant Korvy
  if (!isKorvyTenantHost()) {
    const host = window.location.hostname
    window.location.href = `https://${host}/dashboard`
    return false
  }

  // 2. Verificação de sessão e privilégios Master
  const rawUser = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
  let user: any = null
  if (rawUser) {
    try {
      user = JSON.parse(rawUser)
    } catch {}
  }

  const isMaster = isMasterUser(user)

  if (to.name !== 'login' && !isMaster) {
    return { name: 'login' }
  }
  if (to.name === 'login' && isMaster) {
    return { name: 'backoffice' }
  }
})

export default router
