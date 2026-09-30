<template>
  <div class="digital-signature-addon" :class="{ 'compact': compact }">
    <button v-if="!status" class="btn btn-outline" style="border-color: #0ea5e9; color: #0ea5e9; display: flex; align-items: center; gap: 8px;" @click="solicitarAssinatura" :disabled="loading">
      <i v-if="loading" class="fas fa-spinner fa-spin"></i>
      <i v-else class="fas fa-pen-nib"></i>
      {{ compact ? 'Assinar' : 'Solicitar Assinatura Digital' }}
    </button>
    <div v-else-if="status === 'pending'" class="status-box pending">
      <i class="fas fa-clock"></i>
      <span>Aguardando assinaturas...</span>
      <button class="icon-btn-sm" title="Reenviar link" @click="toastSuccess('Link reenviado!')"><i class="fas fa-paper-plane"></i></button>
    </div>
    <div v-else-if="status === 'signed'" class="status-box signed">
      <i class="fas fa-check-circle"></i>
      <span>Contrato Assinado Digitalmente</span>
      <a href="#" class="btn-link" style="margin-left:auto" @click.prevent="toastSuccess('Download iniciado')">Baixar PDF</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  contractId?: string
  compact?: boolean
}>()

const { success: toastSuccess } = useToast()
const loading = ref(false)
const status = ref<'pending' | 'signed' | null>(null)

function solicitarAssinatura() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    status.value = 'pending'
    toastSuccess('Solicitação enviada por e-mail/WhatsApp aos membros do contrato!')
  }, 1000)
}
</script>

<style scoped>
.digital-signature-addon {
  display: inline-flex;
  align-items: center;
}
.digital-signature-addon.compact button {
  padding: 4px 10px;
  font-size: 0.75rem;
  height: 32px;
}
.status-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 200px;
}
.status-box.pending {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.status-box.signed {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}
</style>
