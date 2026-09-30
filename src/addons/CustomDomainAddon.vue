<template>
  <div class="custom-domain-addon">
    <div class="addon-header">
      <i class="fas fa-globe domain-icon"></i>
      <div class="addon-title">
        <h4>Domínio Customizado</h4>
        <p>Acesse o portal com a sua própria marca.</p>
      </div>
      <div class="status-badge" :class="statusClass">
        {{ statusLabel }}
      </div>
    </div>

    <div class="addon-body">
      <div class="form-field">
        <label class="form-label">SEU DOMÍNIO</label>
        <div style="display:flex; gap:8px">
          <input v-model="domain" type="text" placeholder="ex: app.suaempresa.com.br" />
          <button class="btn btn-gold" @click="saveDomain" :disabled="!domain">Salvar</button>
        </div>
      </div>

      <div v-if="domain" class="dns-instructions">
        <h5>Instruções de DNS</h5>
        <p>Configure um apontamento CNAME no seu provedor de domínio (Registro.br, Cloudflare, etc):</p>
        <div class="dns-table">
          <div class="dns-row dns-header">
            <span>Tipo</span>
            <span>Nome</span>
            <span>Destino</span>
          </div>
          <div class="dns-row">
            <span>CNAME</span>
            <span>{{ subdomain }}</span>
            <span style="user-select: all; font-family: monospace;">cname.korvyan.com</span>
          </div>
        </div>
        <button class="btn btn-outline btn-sm mt-3" @click="verifyDns">
          <i class="fas fa-radar"></i> Verificar Propagação
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess } = useToast()

const domain = ref('')
const status = ref<'pending' | 'active' | 'none'>('none')

const statusLabel = computed(() => {
  if (status.value === 'active') return 'Ativo'
  if (status.value === 'pending') return 'Aguardando DNS'
  return 'Não configurado'
})

const statusClass = computed(() => {
  return {
    'active': status.value === 'active',
    'pending': status.value === 'pending',
    'none': status.value === 'none',
  }
})

const subdomain = computed(() => {
  if (!domain.value) return '@'
  const parts = domain.value.split('.')
  if (parts.length > 2) return parts[0]
  return '@'
})

function saveDomain() {
  status.value = 'pending'
  toastSuccess('Domínio salvo. Siga as instruções de DNS.')
}

function verifyDns() {
  toastSuccess('Verificando apontamento DNS... Isso pode levar algumas horas.')
}
</script>

<style scoped>
.custom-domain-addon {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.addon-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1rem;
  background: rgba(139, 92, 246, 0.05);
  border-bottom: 1px solid var(--border-light);
}
.domain-icon { font-size: 1.8rem; color: #8b5cf6; }
.addon-title h4 { margin: 0; font-size: 0.95rem; }
.addon-title p { margin: 0; font-size: 0.75rem; color: var(--text-muted); }

.status-badge {
  margin-left: auto; font-size: 0.7rem; padding: 4px 8px; border-radius: 12px;
  background: var(--bg-input); color: var(--text-muted);
}
.status-badge.active { background: rgba(16, 185, 129, 0.15); color: #059669; font-weight: bold; }
.status-badge.pending { background: rgba(245, 158, 11, 0.15); color: #d97706; font-weight: bold; }

.addon-body { padding: 1.5rem; }

.dns-instructions {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: 6px;
}
.dns-instructions h5 { margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 0.85rem; }
.dns-instructions p { font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 1rem 0; }
.dns-table { font-size: 0.8rem; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
.dns-row { display: grid; grid-template-columns: 80px 1fr 1fr; padding: 8px 12px; border-bottom: 1px solid var(--border-light); }
.dns-row:last-child { border-bottom: none; }
.dns-header { background: var(--bg-input); font-weight: 600; color: var(--text-muted); }
.mt-3 { margin-top: 1rem; }
</style>
