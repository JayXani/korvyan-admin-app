<template>
  <div>
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="section-title">Chaves de API (API Keys)</h2>
        <p class="section-sub">Gerencie credenciais e escopos de acesso para integrações de terceiros e webhooks.</p>
      </div>
      <button class="btn btn-gold" @click="openCreateModal()"><i class="fas fa-plus"></i> Nova Chave de API</button>
    </div>

    <div class="card">
      <div class="filter-bar">
        <button class="btn btn-outline" @click="loadKeys" title="Atualizar Lista" style="padding: 0 12px; margin-right: 10px;">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        </button>
        <div class="search-bar">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="search" type="text" placeholder="Filtrar por nome ou ID..." />
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="min-width: 200px">NOME DA INTEGRAÇÃO</th>
            <th style="width: 120px; min-width: 100px">STATUS</th>
            <th style="width: 140px; min-width: 120px">VALIDADE</th>
            <th style="min-width: 180px">ESCOPOS ATRIBUÍDOS</th>
            <th style="width: 140px; min-width: 120px">CRIADO EM</th>
            <th style="width: 70px; min-width: 60px; text-align: right"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="empty-state"><i class="fas fa-spinner fa-spin"></i></td>
          </tr>
          <tr v-else-if="!filteredKeys.length">
            <td colspan="6" class="empty-state">
              <i class="fas fa-key"></i>
              <p>Nenhuma chave de API encontrada.</p>
            </td>
          </tr>
          <tr v-for="key in filteredKeys" :key="key.api_id || key.api_name" v-else>
            <td>
              <div style="font-weight:600; color:var(--text-primary)">{{ key.api_name }}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace">{{ key.api_id || 'ID N/A' }}</div>
            </td>
            <td>
              <span class="badge" :class="key.api_revoked ? 'badge-danger' : isExpired(key.api_expired_at) ? 'badge-warning' : 'badge-success'">
                {{ key.api_revoked ? 'REVOGADA' : isExpired(key.api_expired_at) ? 'EXPIRADA' : 'ATIVA' }}
              </span>
            </td>
            <td style="color:var(--text-secondary); font-size:0.85rem">
              {{ formatDate(key.api_expired_at) }}
            </td>
            <td>
              <div style="display:flex; flex-wrap:wrap; gap:4px">
                <span v-for="s in (key.scopes || []).slice(0, 3)" :key="s.code" class="scope-chip">
                  {{ s.code }}
                </span>
                <span v-if="(key.scopes || []).length > 3" class="scope-chip-more">
                  +{{ key.scopes!.length - 3 }}
                </span>
                <span v-if="!(key.scopes || []).length" style="color:var(--text-muted); font-size:0.8rem">Nenhum</span>
              </div>
            </td>
            <td style="color:var(--text-muted); font-size:0.82rem">{{ formatDate(key.created_at) }}</td>
            <td style="text-align: right">
              <button v-if="!key.api_revoked" class="action-icon-btn danger" @click="confirmRevoke(key)" title="Revogar Chave">
                <i class="fas fa-ban"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para Criar Nova Chave -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-card" style="max-width: 580px">
        <div class="modal-header">
          <h3>Nova Chave de API</h3>
          <button class="btn-ghost" @click="showCreateModal = false"><i class="fas fa-xmark"></i></button>
        </div>

        <div style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem">
          <div class="form-field">
            <label class="form-label">NOME DA CHAVE / SISTEMA INTEGRADO *</label>
            <input v-model="form.name" type="text" placeholder="Ex: Webhook CRM Externo" />
          </div>

          <div class="form-field">
            <label class="form-label">VALIDADE DA CHAVE *</label>
            <select v-model="form.validityDays">
              <option :value="30">30 Dias</option>
              <option :value="90">90 Dias</option>
              <option :value="180">6 Meses</option>
              <option :value="365">1 Ano</option>
            </select>
          </div>

          <div class="form-field">
            <label class="form-label">ESCOPOS DE PERMISSÃO AUTORIZADOS</label>
            <div class="scopes-selector-box">
              <div v-if="loadingScopes" style="padding:10px; text-align:center; color:var(--text-muted)">
                <i class="fas fa-spinner fa-spin"></i> Carregando escopos...
              </div>
              <div v-else-if="!availableScopes.length" style="padding:10px; color:var(--text-muted)">
                Nenhum escopo cadastrado no sistema.
              </div>
              <label v-for="scope in availableScopes" :key="scope.code" class="scope-checkbox-item">
                <input type="checkbox" :value="scope.code" v-model="form.selectedScopeCodes" />
                <div>
                  <div class="scope-code-text">{{ scope.code }}</div>
                  <div class="scope-desc-text" v-html="formatScopeDescription(scope.description)"></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" @click="showCreateModal = false">Cancelar</button>
          <button class="btn btn-gold" @click="handleCreateKey" :disabled="saving">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            <span v-else>Gerar Chave</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Exibição do Secret/Token Gerado -->
    <div v-if="createdSecretModal" class="modal-overlay">
      <div class="modal-card" style="max-width: 500px">
        <div class="modal-header">
          <h3><i class="fas fa-key" style="color:var(--gold)"></i> Chave de API Gerada!</h3>
          <button class="btn-ghost" @click="createdSecretModal = false"><i class="fas fa-xmark"></i></button>
        </div>
        <div style="padding: 1rem 0">
          <div class="warning-box">
            <i class="fas fa-triangle-exclamation"></i>
            <div>Copie e guarde esta chave de API agora. Por motivos de segurança, ela <strong>não será exibida novamente</strong>.</div>
          </div>

          <div class="secret-box">
            <code>{{ generatedSecretToken }}</code>
            <button class="btn btn-gold btn-sm" @click="copySecretToken">
              <i class="fas" :class="copied ? 'fa-check' : 'fa-copy'"></i> {{ copied ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-gold" @click="createdSecretModal = false">Entendi, salvar chave</button>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Revogação -->
    <teleport to="body">
      <div v-if="revokeTarget" class="modal-overlay">
        <div class="modal-card" style="max-width:420px">
          <div class="modal-header">
            <h3><i class="fas fa-ban" style="color:var(--danger)"></i> Revogar Chave de API</h3>
            <button class="btn-ghost" @click="revokeTarget = null"><i class="fas fa-xmark"></i></button>
          </div>
          <div style="padding:0.5rem 0 1rem">
            <p>Deseja revogar o acesso da chave <strong>{{ revokeTarget.api_name }}</strong>?</p>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:6px">Qualquer integração que utilize esta chave perderá o acesso imediatamente.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="revokeTarget = null">Cancelar</button>
            <button class="btn btn-danger" @click="handleRevokeKey" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              <span>Confirmar Revogação</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getApiKeys, createApiKey, updateApiKey, deleteApiKeys, type ApiKey } from '@/services/api_key.service'
import { getAllScopes, formatScopeDescription, type Scope } from '@/services/scope.service'
import { useToast } from '@/composables/useToast'

const { success, error: toastError } = useToast()

const apiKeys = ref<ApiKey[]>([])
const availableScopes = ref<Scope[]>([])
const loading = ref(false)
const loadingScopes = ref(false)
const saving = ref(false)
const search = ref('')

const showCreateModal = ref(false)
const createdSecretModal = ref(false)
const generatedSecretToken = ref('')
const copied = ref(false)
const revokeTarget = ref<ApiKey | null>(null)

const form = ref({
  name: '',
  validityDays: 90,
  selectedScopeCodes: [] as string[]
})

const filteredKeys = computed(() => {
  if (!search.value.trim()) return apiKeys.value
  const term = search.value.toLowerCase()
  return apiKeys.value.filter(k => 
    (k.api_name && k.api_name.toLowerCase().includes(term)) ||
    (k.api_id && k.api_id.toLowerCase().includes(term))
  )
})

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

async function loadKeys() {
  loading.value = true
  try {
    apiKeys.value = await getApiKeys()
  } catch (e: any) {
    toastError(e?.message || 'Falha ao carregar chaves de API.')
  } finally {
    loading.value = false
  }
}

async function loadScopes() {
  loadingScopes.value = true
  try {
    availableScopes.value = await getAllScopes()
  } catch (e: any) {
    console.warn('Falha ao carregar escopos para API Key:', e)
  } finally {
    loadingScopes.value = false
  }
}

function openCreateModal() {
  form.value = { name: '', validityDays: 90, selectedScopeCodes: [] }
  showCreateModal.value = true
  if (!availableScopes.value.length) {
    loadScopes()
  }
}

async function handleCreateKey() {
  if (!form.value.name.trim()) {
    toastError('Informe o nome da chave / integração.')
    return
  }

  saving.value = true
  try {
    const expDate = new Date()
    expDate.setDate(expDate.getDate() + form.value.validityDays)

    const selectedScopesPayload = form.value.selectedScopeCodes.map(code => {
      const found = availableScopes.value.find(s => s.code === code)
      return { id: found?.id, code }
    })

    const created = await createApiKey({
      name: form.value.name.trim(),
      expired_at: expDate.toISOString(),
      scopes: selectedScopesPayload
    })

    showCreateModal.value = false
    generatedSecretToken.value = created.api_key_hash || created.api_id || 'ak_' + Math.random().toString(36).substring(2)
    copied.value = false
    createdSecretModal.value = true

    success('Chave de API gerada com sucesso!')
    await loadKeys()
  } catch (e: any) {
    toastError(e?.message || 'Erro ao criar chave de API.')
  } finally {
    saving.value = false
  }
}

function confirmRevoke(key: ApiKey) {
  revokeTarget.value = key
}

async function handleRevokeKey() {
  if (!revokeTarget.value) return
  saving.value = true
  try {
    if (revokeTarget.value.api_id) {
      await updateApiKey(revokeTarget.value.api_id, { api_revoked: true })
    } else {
      await deleteApiKeys([revokeTarget.value.api_id || ''])
    }
    success('Chave de API revogada com sucesso!')
    revokeTarget.value = null
    await loadKeys()
  } catch (e: any) {
    toastError(e?.message || 'Erro ao revogar chave de API.')
  } finally {
    saving.value = false
  }
}

async function copySecretToken() {
  try {
    await navigator.clipboard.writeText(generatedSecretToken.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  } catch {
    toastError('Não foi possível copiar automaticamente.')
  }
}

onMounted(() => {
  loadKeys()
})
</script>

<style scoped>
.scope-chip {
  background: var(--bg-tertiary, #2a2d3d);
  color: var(--gold, #e0b868);
  font-size: 0.72rem;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(224, 184, 104, 0.2);
}

.scope-chip-more {
  font-size: 0.72rem;
  color: var(--text-muted);
  padding: 2px 4px;
}

.badge-success { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.badge-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.badge-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

.scopes-selector-box {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--border-light);
  border-radius: var(--radius, 8px);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-input);
}

.scope-checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius, 6px);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
.scope-checkbox-item:hover {
  background: var(--bg-card);
  border-color: var(--border-light);
}
.scope-checkbox-item input[type="checkbox"] {
  accent-color: var(--gold);
  margin-top: 3px;
  cursor: pointer;
}
.scope-code-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gold);
}
.scope-desc-text {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 2px;
  line-height: 1.45;
  white-space: pre-line;
}
.scope-desc-text :deep(strong) {
  font-weight: 700;
  color: var(--text-primary, #ffffff);
}

.warning-box {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #f59e0b;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.secret-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-tertiary, #11131c);
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px dashed var(--gold, #e0b868);
}
.secret-box code {
  color: var(--gold, #e0b868);
  font-size: 0.95rem;
  word-break: break-all;
}
</style>
