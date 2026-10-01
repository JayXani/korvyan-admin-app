<template>
  <div class="master-login-container">
    <div class="login-card">
      <div class="logo-circle">
        <i class="fas fa-satellite-dish"></i>
      </div>
      <h2>Acesso Restrito</h2>
      <p class="subtitle">Insira suas credenciais Root para prosseguir.</p>

      <form @submit.prevent="handleLogin" class="master-form">
        <div class="form-group">
          <label>Login Master</label>
          <div class="input-wrapper">
            <i class="fas fa-user icon"></i>
            <input type="text" v-model="user_login" placeholder="root.admin" required autocomplete="username" />
          </div>
        </div>

        <div class="form-group">
          <label>Chave de Acesso (Senha)</label>
          <div class="input-wrapper">
            <i class="fas fa-lock icon"></i>
            <input type="password" v-model="password" placeholder="••••••••••••" required autocomplete="current-password" />
          </div>
        </div>

        <p v-if="errorMsg" class="error-msg"><i class="fas fa-circle-exclamation"></i> {{ errorMsg }}</p>

        <button type="submit" class="btn-master" :disabled="loading">
          <span v-if="!loading">Desbloquear Sistema <i class="fas fa-arrow-right" style="margin-left:8px"></i></span>
          <i v-else class="fas fa-spinner fa-spin"></i>
        </button>
      </form>

      <div class="security-notice">
        <i class="fas fa-lock"></i>
        <span>Esta área é monitorada. Tentativas falhas bloqueiam o IP.</span>
      </div>
    </div>
    
    <!-- Background Decorativo de Liquid Glass -->
    <div class="bg-decoration">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authLogin, authLogoutApi } from '@/services/auth.service'
import { persistTokenFromCookie } from '@/services/api'
import { getMe } from '@/services/user.service'
import { isKorvyTenantHost, isMasterUser } from '@/utils/masterAuth'

const router = useRouter()
const user_login = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

onMounted(() => {
  if (!isKorvyTenantHost()) {
    const host = window.location.hostname
    window.location.href = `https://${host}/dashboard`
  }
})

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    const response = await authLogin({ use_login: user_login.value, password: password.value })
    if (!response.success) throw new Error(response.message || 'Credenciais inválidas.')
    persistTokenFromCookie(false)

    // Buscar dados reais do usuário autenticado para validação de privilégios Master
    let me: any = null
    try {
      me = await getMe()
    } catch (err: any) {
      console.warn('[Master Login] getMe falhou, verificando dados retornados no login:', err)
      me = (response.data as any)?.user || { user_login: user_login.value }
    }

    if (!isMasterUser(me)) {
      try { await authLogoutApi() } catch {}
      sessionStorage.clear()
      localStorage.removeItem('user_info')
      throw new Error('Acesso restrito. Este usuário não possui permissão de Master da plataforma Korvyan.')
    }

    const userInfo = {
      ...me,
      name: me.person?.name || me.username || user_login.value,
      role: 'Master'
    }

    sessionStorage.setItem('access_token', 'session')
    sessionStorage.setItem('user_info', JSON.stringify(userInfo))
    localStorage.setItem('user_info', JSON.stringify(userInfo))
    router.push('/')
  } catch (e: any) {
    errorMsg.value = e.message ?? 'Erro ao autenticar.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.master-login-container {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background-color: #0f111a;
  background-image: radial-gradient(circle at 50% -20%, #1e1b4b 0%, #0f111a 80%);
  font-family: 'Inter', sans-serif; color: #fff; padding: 1rem;
  position: relative; overflow: hidden;
}

/* Decorativos de Liquid Glass */
.bg-decoration { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.2; animation: float 10s infinite ease-in-out alternate; }
.blob-1 { width: 400px; height: 400px; background: #4f46e5; top: -100px; left: -100px; }
.blob-2 { width: 300px; height: 300px; background: #6366f1; bottom: -50px; right: -50px; animation-delay: -5s; }
@keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(30px, 30px) scale(1.1); } }

.login-card {
  width: 100%; max-width: 400px;
  background: rgba(20, 22, 35, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(79, 70, 229, 0.3);
  border-radius: 20px; padding: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 0 20px rgba(255, 255, 255, 0.02);
  display: flex; flex-direction: column; align-items: center;
  position: relative; z-index: 10;
}

.logo-circle {
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; color: white; margin-bottom: 1.5rem;
  box-shadow: 0 0 20px rgba(79,70,229,0.5);
}
h2 { font-size: 1.5rem; font-weight: 800; margin: 0 0 8px; text-align: center; letter-spacing: -0.5px; }
.subtitle { color: #94a3b8; font-size: 0.85rem; margin: 0 0 2rem; text-align: center; }
.master-form { width: 100%; display: flex; flex-direction: column; gap: 1.25rem; }
.form-group label { display: block; font-size: 0.75rem; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-wrapper .icon { position: absolute; left: 14px; color: #64748b; font-size: 0.9rem; z-index: 5; }

.input-wrapper input {
  width: 100%; background: rgba(15,23,42,0.5); border: 1px solid rgba(255,255,255,0.1);
  color: white; padding: 12px 14px 12px 40px; border-radius: 8px; font-size: 0.95rem;
  outline: none; transition: all 0.2s; box-sizing: border-box; position: relative; z-index: 2;
}
.input-wrapper input:focus { border-color: #4f46e5; background: rgba(15,23,42,0.8); box-shadow: 0 0 0 3px rgba(79,70,229,0.2); }

/* Correção Autofill para Chrome */
.input-wrapper input:-webkit-autofill,
.input-wrapper input:-webkit-autofill:hover,
.input-wrapper input:-webkit-autofill:focus,
.input-wrapper input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
  -webkit-text-fill-color: white !important;
  transition: background-color 5000s ease-in-out 0s;
  border-radius: 8px;
}

.error-msg { color: #f87171; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; }
.btn-master {
  background: #4f46e5; color: white; border: none; padding: 14px; border-radius: 8px;
  font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 1rem; transition: all 0.2s;
  position: relative; overflow: hidden;
}
.btn-master::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}
.btn-master:hover::before { left: 150%; }
.btn-master:hover { background: #4338ca; box-shadow: 0 4px 15px rgba(79,70,229,0.4); transform: translateY(-1px); }
.btn-master:disabled { opacity: 0.7; cursor: not-allowed; }

.security-notice {
  margin-top: 2rem; display: flex; align-items: center; justify-content: center; gap: 8px;
  color: #64748b; font-size: 0.7rem; text-align: center;
  padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); width: 100%;
}
</style>
