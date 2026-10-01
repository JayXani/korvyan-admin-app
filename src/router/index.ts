import { createRouter, createWebHistory } from 'vue-router'

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
      path: '/backoffice',
      name: 'backoffice',
      component: BackofficeView,
    },
    {
      path: '/dashboard',
      redirect: '/backoffice',
    },
    {
      path: '/deploy',
      redirect: '/backoffice?tab=deploy',
    },
    {
      path: '/',
      redirect: '/backoffice',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/backoffice',
    },
  ],
})

router.beforeEach((to) => {
  const hasSession = !!localStorage.getItem('user_info') || !!sessionStorage.getItem('user_info')
  if (to.name !== 'login' && !hasSession) {
    return { name: 'login' }
  }
  if (to.name === 'login' && hasSession) {
    return { name: 'backoffice' }
  }
})

export default router
