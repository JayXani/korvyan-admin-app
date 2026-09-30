<template>
  <header class="admin-header">
    <div class="header-left">
      <span class="environment-badge">
        <i class="fas fa-server"></i> Root Administration
      </span>
    </div>

    <div class="header-right">
      <!-- Theme Switcher -->
      <button class="icon-btn" @click="toggleTheme" title="Alternar tema claro/escuro">
        <i :class="theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
      </button>

      <!-- User Profile Badge -->
      <div class="user-pill">
        <div class="avatar-circle">
          <i class="fas fa-user-tie"></i>
        </div>
        <div class="user-details">
          <span class="user-name">{{ userName }}</span>
          <span class="user-role">Super Admin</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { theme, toggleTheme } = useTheme()
const userName = ref('Master Root')

onMounted(() => {
  try {
    const raw = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
    if (raw) {
      const u = JSON.parse(raw)
      userName.value = u?.name || u?.username || u?.person?.name || 'Master Root'
    }
  } catch {}
})
</script>

<style scoped>
.admin-header {
  height: 64px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 90;
}

.environment-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--gold-dim);
  border: 1px solid var(--gold-light);
  color: var(--gold);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  color: var(--gold);
  border-color: var(--gold);
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 4px 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 24px;
}

.avatar-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--gold-light);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.user-role {
  font-size: 0.68rem;
  color: var(--gold);
  font-weight: 500;
}
</style>
