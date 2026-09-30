<template>
  <div class="whatsapp-addon">
    <div class="addon-header">
      <i class="fab fa-whatsapp whatsapp-icon"></i>
      <div class="addon-title">
        <h4>WhatsApp Bot (Integração)</h4>
        <p>Automatize lembretes de vencimento e cobranças.</p>
      </div>
      <div class="status-badge" :class="{ connected: isConnected }">
        {{ isConnected ? 'Conectado' : 'Aguardando QRCode' }}
      </div>
    </div>

    <div class="addon-body">
      <div v-if="!isConnected" class="qr-container">
        <i class="fas fa-qrcode qr-placeholder"></i>
        <p>Escaneie o QRCode acima com seu WhatsApp para conectar.</p>
        <button class="btn btn-gold btn-sm" @click="simulateConnect">
          <i class="fas fa-plug"></i> Simular Conexão
        </button>
      </div>

      <div v-else class="config-container">
        <label class="switch-row">
          <span>Enviar boleto 3 dias antes do vencimento</span>
          <input type="checkbox" v-model="configs.reminder" />
        </label>
        <label class="switch-row">
          <span>Enviar alerta no dia do vencimento</span>
          <input type="checkbox" v-model="configs.due_date" />
        </label>
        <label class="switch-row">
          <span>Régua de cobrança automática (após 5 dias)</span>
          <input type="checkbox" v-model="configs.billing" />
        </label>
        
        <button class="btn btn-outline btn-sm disconnect-btn" @click="isConnected = false">
          Desconectar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isConnected = ref(false)
const configs = ref({
  reminder: true,
  due_date: true,
  billing: false
})

function simulateConnect() {
  isConnected.value = true
}
</script>

<style scoped>
.whatsapp-addon {
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
  background: rgba(37, 211, 102, 0.05);
  border-bottom: 1px solid var(--border-light);
}
.whatsapp-icon {
  font-size: 2rem;
  color: #25D366;
}
.addon-title h4 { margin: 0; font-size: 0.95rem; }
.addon-title p { margin: 0; font-size: 0.75rem; color: var(--text-muted); }
.status-badge {
  margin-left: auto;
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 12px;
  background: var(--bg-input);
  color: var(--text-muted);
}
.status-badge.connected {
  background: rgba(37, 211, 102, 0.15);
  color: #128C7E;
  font-weight: bold;
}
.addon-body {
  padding: 1.5rem;
}
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}
.qr-placeholder {
  font-size: 6rem;
  color: var(--text-muted);
  opacity: 0.3;
}
.config-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.disconnect-btn {
  margin-top: 1rem;
  align-self: flex-start;
  color: var(--danger);
  border-color: var(--danger);
}
</style>
