import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const LoginView = () => import('@/views/LoginView.vue')
const BackofficeView = () => import('@/views/BackofficeView.vue')
const TenantsView = () => import('@/views/TenantsView.vue')
const EscoposView = () => import('@/views/EscoposView.vue')
const ApiKeysView = () => import('@/views/ApiKeysView.vue')
const MastersView = () => import('@/views/MastersView.vue')
const ObservabilityView = () => import('@/views/ObservabilityView.vue')
const AuditoriaLogsView = () => import('@/views/AuditoriaLogsView.vue')
const EmailsView = () => import('@/views/EmailsView.vue')
const FaturamentoView = () => import('@/views/FaturamentoView.vue')
const KanbanView = () => import('@/views/KanbanView.vue')
const DeployView = () => import('@/views/DeployView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: BackofficeView },
        { path: 'deploy', name: 'deploy', component: DeployView },
        { path: 'tenants', name: 'tenants', component: TenantsView },
        { path: 'escopos', name: 'escopos', component: EscoposView },
        { path: 'api-keys', name: 'api-keys', component: ApiKeysView },
        { path: 'masters', name: 'masters', component: MastersView },
        { path: 'observability', name: 'observability', component: ObservabilityView },
        { path: 'logs', name: 'logs', component: AuditoriaLogsView },
        { path: 'emails', name: 'emails', component: EmailsView },
        { path: 'faturamento', name: 'faturamento', component: FaturamentoView },
        { path: 'kanban', name: 'kanban', component: KanbanView },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach((to) => {
  const hasSession = !!localStorage.getItem('user_info') || !!sessionStorage.getItem('user_info')
  if (to.meta.requiresAuth && !hasSession) {
    return { name: 'login' }
  }
  if (to.name === 'login' && hasSession) {
    return { name: 'dashboard' }
  }
})

export default router
