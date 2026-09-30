<template>
  <teleport to="body">
    <div class="toast-container">
      <transition-group name="toast">
        <div v-for="t in toasts" :key="t.id" :class="['toast', `toast--${t.type}`]">
          <i :class="iconFor(t.type)"></i>
          <div class="toast-content">
            <span>{{ t.message }}</span>
            <button v-if="t.errCode" class="err-code-btn" @click="copyCode(t.errCode)" title="Copiar código de erro">
              <i class="fas fa-copy"></i> {{ t.errCode }}
            </button>
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useToast, type ToastType } from '@/composables/useToast'
const { toasts } = useToast()
function iconFor(type: ToastType) {
  return {
    success: 'fas fa-circle-check',
    error: 'fas fa-circle-exclamation',
    warning: 'fas fa-triangle-exclamation',
    info: 'fas fa-circle-info',
  }[type]
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
}
</script>

<style scoped>
.toast-container {
  position: fixed; bottom: 1.5rem; right: 1.5rem;
  display: flex; flex-direction: column; gap: 10px;
  z-index: 100000; pointer-events: none;
}
.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: 10px;
  font-size: 0.85rem; font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  backdrop-filter: blur(8px);
  max-width: 360px; pointer-events: all;
  border: 1px solid transparent;
}
.toast--success { background: rgba(20,40,25,0.92); color: #4ade80; border-color: rgba(61,186,111,0.3); }
.toast--error   { background: rgba(40,15,15,0.92); color: #f87171; border-color: rgba(224,82,82,0.3); }
.toast--warning { background: rgba(40,35,10,0.92); color: #fbbf24; border-color: rgba(212,175,55,0.3); }
.toast--info    { background: rgba(15,25,40,0.92); color: #60a5fa; border-color: rgba(77,166,255,0.3); }
.toast i { font-size: 1rem; flex-shrink: 0; }

.toast-content { display: flex; flex-direction: column; gap: 6px; }
.err-code-btn { 
  background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); 
  color: inherit; font-family: monospace; font-size: 0.75rem; 
  padding: 4px 8px; border-radius: 4px; cursor: pointer; text-align: left;
  display: inline-flex; align-items: center; gap: 6px; width: fit-content;
  transition: background 0.2s;
}
.err-code-btn:hover { background: rgba(0,0,0,0.4); }

.toast-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from  { opacity: 0; transform: translateX(40px) scale(0.95); }
.toast-leave-to    { opacity: 0; transform: translateX(40px); }
</style>
