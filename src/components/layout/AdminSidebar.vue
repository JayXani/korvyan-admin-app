<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <div class="brand-logo">
        <i class="fas fa-shield-halved"></i>
      </div>
      <div class="brand-text">
        <span class="brand-title">KORVYAN</span>
        <span class="brand-badge">MASTER</span>
      </div>
    </div>

    <div class="sidebar-section-title">ADMINISTRAÇÃO ROOT</div>
    <nav class="sidebar-nav">
      <router-link to="/dashboard" class="nav-item">
        <i class="fas fa-gauge-high"></i>
        <span>Visão Geral</span>
      </router-link>

      <router-link to="/tenants" class="nav-item">
        <i class="fas fa-building"></i>
        <span>Gestão de Tenants</span>
      </router-link>

      <router-link to="/escopos" class="nav-item">
        <i class="fas fa-shield-keyhole"></i>
        <span>Escopos & Permissões</span>
      </router-link>

      <router-link to="/api-keys" class="nav-item">
        <i class="fas fa-key"></i>
        <span>Chaves de API</span>
      </router-link>

      <router-link to="/masters" class="nav-item">
        <i class="fas fa-user-shield"></i>
        <span>Operadores Master</span>
      </router-link>

      <div class="sidebar-section-title" style="margin-top: 1.5rem">MONITORAMENTO</div>

      <router-link to="/observability" class="nav-item">
        <i class="fas fa-chart-line"></i>
        <span>Observabilidade</span>
      </router-link>

      <router-link to="/logs" class="nav-item">
        <i class="fas fa-clock-rotate-left"></i>
        <span>Auditoria de Logs</span>
      </router-link>

      <router-link to="/emails" class="nav-item">
        <i class="fas fa-envelope-open-text"></i>
        <span>Templates de E-mail</span>
      </router-link>

      <router-link to="/faturamento" class="nav-item">
        <i class="fas fa-receipt"></i>
        <span>Faturamento</span>
      </router-link>

      <router-link to="/kanban" class="nav-item">
        <i class="fas fa-table-columns"></i>
        <span>Kanban de Demandas</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button class="logout-btn" @click="handleLogout">
        <i class="fas fa-arrow-right-from-bracket"></i>
        <span>Encerrar Sessão</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { authLogoutApi } from '@/services/auth.service'

const router = useRouter()

async function handleLogout() {
  try {
    await authLogoutApi()
  } catch {}
  localStorage.removeItem('user_info')
  sessionStorage.removeItem('user_info')
  router.push('/login')
}
</script>

<style scoped>
.admin-sidebar {
  width: var(--sidebar-width);
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  padding: 1.5rem 1rem;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.5rem 0.5rem 1.5rem;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 1.25rem;
}

.brand-logo {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, var(--gold) 0%, #997819 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a1a;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: 1px;
  color: var(--text-primary);
}

.brand-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 1.5px;
}

.sidebar-section-title {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 1px;
  padding: 0 0.75rem;
  margin-bottom: 0.5rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.nav-item i {
  width: 18px;
  font-size: 0.95rem;
  text-align: center;
  color: var(--text-muted);
  transition: color 0.15s ease;
}

.nav-item:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.nav-item:hover i {
  color: var(--gold);
}

.nav-item.router-link-active {
  background: var(--gold-light);
  color: var(--gold);
  font-weight: 600;
}

.nav-item.router-link-active i {
  color: var(--gold);
}

.sidebar-footer {
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--danger);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}

.logout-btn:hover {
  background: rgba(224, 82, 82, 0.12);
  border-color: var(--danger);
}
</style>
