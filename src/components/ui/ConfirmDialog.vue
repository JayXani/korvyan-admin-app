<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="confirmState" class="confirm-overlay" @click.self="cancel">
        <div class="confirm-dialog" role="dialog" aria-modal="true">
          <div class="confirm-icon" :class="{ danger: confirmState.danger }">
            <i :class="confirmState.danger ? 'fas fa-triangle-exclamation' : 'fas fa-circle-question'"></i>
          </div>

          <h3 class="confirm-title">{{ confirmState.title }}</h3>
          <p class="confirm-message">{{ confirmState.message }}</p>

          <div class="confirm-actions">
            <button class="btn btn-outline" @click="cancel">
              {{ confirmState.cancelLabel ?? 'Cancelar' }}
            </button>
            <button
              :class="['btn', confirmState.danger ? 'btn-danger' : 'btn-gold']"
              @click="accept"
            >
              {{ confirmState.confirmLabel ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'

const { confirmState, accept, cancel } = useConfirm()
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 32px 28px 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  max-width: 420px;
  width: 90%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.confirm-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(212, 175, 55, 0.12);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 4px;
}
.confirm-icon.danger {
  background: rgba(224, 82, 82, 0.12);
  color: var(--danger);
}

.confirm-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.confirm-message {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  width: 100%;
  justify-content: center;
}
.confirm-actions .btn { min-width: 110px; }

/* Transition */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}
.confirm-fade-enter-active .confirm-dialog,
.confirm-fade-leave-active .confirm-dialog {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
.confirm-fade-enter-from .confirm-dialog {
  transform: scale(0.88);
}
</style>
