<template>
  <div class="tenants-container">
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="section-title">Gestão de Portais</h2>
        <p class="section-sub">Controle centralizado de instâncias, branding e limites de uso por empresa.</p>
      </div>
      <button class="btn btn-gold" @click="openModal()"><i class="fas fa-plus"></i> Novo Tenant</button>
    </div>

    <!-- Erro -->
    <div class="card">
      <div class="filter-bar">
        <button class="btn btn-outline" @click="loadTenants" title="Atualizar Lista" style="padding: 0 12px; margin-right: 10px;"><i class="fas fa-sync-alt"></i></button>
        <div class="search-bar">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="search" type="text" placeholder="Buscar por nome ou prefixo..." />
        </div>
        <select v-model="filterStatus" class="filter-select">
          <option value="">Todos os Status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="BLOCKED">Bloqueados</option>
        </select>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="min-width: 220px">EMPRESA / BRANDING</th>
            <th style="width: 140px; min-width: 120px">PREFIXO</th>
            <th style="width: 130px; min-width: 110px">COR</th>
            <th style="width: 120px; min-width: 100px">STATUS</th>
            <th style="width: 140px; min-width: 120px">CRIADO EM</th>
            <th style="width: 120px; min-width: 110px; text-align: right;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="loading-row">
            <td colspan="6"><i class="fas fa-spinner fa-spin"></i> Carregando tenants...</td>
          </tr>
          <tr v-else-if="filteredTenants.length === 0">
            <td colspan="6">
              <div class="empty-state"><i class="fas fa-building-circle-exclamation"></i><p>Nenhum tenant encontrado.</p></div>
            </td>
          </tr>
          <tr v-for="t in filteredTenants" :key="String(t.id || t.tenant_prefix)">
            <td>
              <div class="tenant-branding">
                <div v-if="t.logo_url" class="tenant-logo-preview has-img">
                  <img :src="t.logo_url" :alt="t.name || t.tenant_prefix" class="tenant-logo-img" />
                </div>
                <div v-else class="tenant-logo-preview" :style="{ background: (t.primary_color as string) || 'var(--gold)' }">
                  {{ (t.name || t.tenant_prefix).substring(0,2).toUpperCase() }}
                </div>
                <div class="tenant-info-block">
                  <div class="tenant-name-row">
                    <p class="tenant-name">{{ t.name || 'Sem Nome' }}</p>
                    <span v-if="t.tenant_css || t.ten_css" class="badge-tag-mini" title="Possui CSS customizado">
                      <i class="fas fa-code"></i> CSS
                    </span>
                  </div>
                  <p v-if="t.email" class="tenant-email">
                    <i class="fas fa-envelope"></i> {{ t.email }}
                  </p>
                  <p class="tenant-plan">Plano: {{ (t.plan as string) || 'Standard' }}</p>
                </div>
              </div>
            </td>
            <td>
              <code class="prefix-code">{{ t.tenant_prefix }}</code>
              <div v-if="t.tenant_public_key || t.ten_public_key" class="public-key-badge-row" :title="'Chave pública: ' + (t.tenant_public_key || t.ten_public_key)">
                <i class="fas fa-key text-gold"></i>
                <span class="pk-snippet">{{ (t.tenant_public_key || t.ten_public_key).substring(0, 10) }}...</span>
                <button type="button" class="btn-copy-mini" @click="copySnippet(t.tenant_public_key || t.ten_public_key)" title="Copiar chave pública">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </td>
            <td>
              <div class="color-indicator">
                <span class="color-dot" :style="{ background: (t.primary_color as string) || 'var(--gold)' }"></span>
                <span class="color-hex">{{ (t.primary_color as string) || '#D4AF37' }}</span>
              </div>
            </td>
            <td>
              <span :class="['badge-status', t.tenant_enabled !== false ? 'badge-ativo' : 'badge-cancelado']">
                {{ t.tenant_enabled !== false ? 'ATIVO' : 'BLOQUEADO' }}
              </span>
            </td>
            <td class="text-muted">{{ formatDate(t.created_at as string) }}</td>
            <td style="text-align: right;">
              <button class="action-icon-btn" title="Configurar Branding" @click="openModal(t)">
                <i class="fas fa-palette"></i>
              </button>
              <button class="action-icon-btn"
                      :class="{ 'danger': t.tenant_enabled !== false, 'success': t.tenant_enabled === false }"
                      :title="t.tenant_enabled !== false ? 'Bloquear Tenant' : 'Desbloquear Tenant'"
                      @click="toggleTenantStatus(t)">
                <i :class="t.tenant_enabled !== false ? 'fas fa-ban' : 'fas fa-unlock'"></i>
              </button>
              <button class="action-icon-btn danger" title="Excluir Tenant" @click="deleteTenantAction(t)">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: Cadastro/Edição de Tenant -->
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-card tenant-modal">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Configurar Tenant' : 'Novo Tenant' }}</h3>
            <button class="close-btn" @click="showModal = false"><i class="fas fa-xmark"></i></button>
          </div>
          
          <div class="modal-body scroll-area">
            <div class="form-grid">
              <div class="form-field full">
                <label class="form-label">NOME DA EMPRESA *</label>
                <input v-model="newTenant.name" type="text" placeholder="Ex: Funerária Korvyan" />
              </div>

              <div class="form-field">
                <label class="form-label">PREFIXO (URL) *</label>
                <input v-model="newTenant.tenant_prefix" type="text" placeholder="ex: filial-sul" :disabled="isEditing" />
              </div>

              <div class="form-field">
                <label class="form-label">COR PRIMÁRIA</label>
                <div class="color-picker-input">
                  <input v-model="newTenant.primary_color" type="color" />
                  <input v-model="newTenant.primary_color" type="text" placeholder="#D4AF37" />
                </div>
              </div>

              <div class="form-field">
                <label class="form-label">WHATSAPP SUPORTE</label>
                <input type="text" placeholder="5511999999999"  v-model="newTenant.support_phone" maxlength="15" @input="newTenant.support_phone = maskPhone(newTenant.support_phone)" />
              </div>

              <div class="form-field">
                <label class="form-label">PLANO</label>
                <select v-model="newTenant.plan" class="filter-select" style="width:100%">
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div class="form-field full">
                <label class="form-label">E-MAIL DE CONTATO (CHANGELOG / NOTIFICAÇÕES)</label>
                <input v-model="newTenant.email" type="email" placeholder="contato@empresa.com" />
              </div>

              <div class="form-field full">
                <label class="form-label">CHAVE PÚBLICA DO TENANT (WEBHOOKS / INTEGRAÇÃO)</label>
                <div style="display:flex; gap:8px">
                  <input type="text" readonly :value="newTenant.ten_public_key || 'tpk_default_key'" style="flex:1; font-family:monospace; background:var(--bg-tertiary)" />
                  <button type="button" class="btn btn-gold btn-sm" @click="copyPublicKey"><i class="fas fa-copy"></i> Copiar</button>
                  <button type="button" class="btn btn-outline btn-sm" @click="generateNewPublicKey" title="Gerar nova chave pública"><i class="fas fa-rotate"></i></button>
                </div>
              </div>

              <div class="form-field full">
                <label class="form-label">CSS CUSTOMIZADO DA EMPRESA</label>
                <textarea v-model="newTenant.ten_css" placeholder="/* CSS customizado para aplicar ao tema do tenant */" rows="3" style="font-family:monospace; font-size:0.8rem; width:100%; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px; padding:6px 10px"></textarea>
              </div>

              <div class="form-field full">
                <label class="form-label">LOGOTIPO DO TENANT</label>
                <div class="logo-modal-upload-row">
                  <div v-if="newTenant.logo_url" class="logo-preview-box">
                    <img :src="newTenant.logo_url" alt="Logo preview" class="logo-preview-img" />
                    <button type="button" class="btn-remove-logo" @click="newTenant.logo_url = ''" title="Remover logo">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                  <div class="logo-upload-controls">
                    <input type="file" @change="handleLogoUpload" accept="image/png, image/jpeg, image/svg+xml, image/webp" />
                    <div v-if="uploadProgress > 0 && uploadProgress < 100" style="font-size: 0.8rem; color: var(--gold);">
                      Enviando: {{ uploadProgress }}%
                    </div>
                    <div v-if="newTenant.logo_url" style="font-size: 0.8rem; color: var(--success);">
                      <i class="fas fa-check-circle"></i> Logotipo vinculado
                    </div>
                  </div>
                </div>
              </div>

              <!-- ADDONS -->
              <div class="form-field full" style="margin-top: 1.5rem">
                <label class="form-label">ADDONS HABILITADOS</label>
                <div class="addons-checkboxes">
                  <label v-for="addon in ADDONS_REGISTRY" :key="addon.key" class="addon-checkbox-item">
                    <input
                      type="checkbox"
                      :checked="!!(newTenant as any).addons?.[addon.key]"
                      @change="toggleAddon(addon.key, ($event.target as HTMLInputElement).checked)"
                    />
                    <i :class="addon.icon" :style="{ color: addon.color }"></i>
                    <span>{{ addon.name }}</span>
                  </label>
                </div>
              </div>

              <!-- ADDON VALUES (onboard) -->
              <div class="form-field full">
                <label class="form-label">VALORES DE ONBOARD</label>
                <div class="form-row form-row-3">
                  <div class="form-field">
                    <label class="form-label">VALOR MENSALIDADE (R$)</label>
                    <input
                      type="number"
                      min="0"
                      max="1000000000"
                      placeholder="Ex: 299"
                      :value="(newTenant as any).addon_values?.monthly_price || ''"
                      @input="setAddonValue('monthly_price', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                  <div class="form-field">
                    <label class="form-label">LIMITE DE MEMBROS</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 10"
                      :value="(newTenant as any).addon_values?.member_limit || ''"
                      @input="setAddonValue('member_limit', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                  <div class="form-field">
                    <label class="form-label">CARÊNCIA (DIAS)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 30"
                      :value="(newTenant as any).addon_values?.grace_period_days || ''"
                      @input="setAddonValue('grace_period_days', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="modalError" class="modal-error">
              <i class="fas fa-circle-exclamation"></i> {{ modalError }}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" @click="showModal = false">Cancelar</button>
            <button class="btn btn-gold" @click="saveTenantAction" :disabled="savingTenant">
              <i v-if="savingTenant" class="fas fa-spinner fa-spin"></i>
              <span>{{ isEditing ? 'Salvar Alterações' : 'Criar Instância' }}</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { maskCPF, maskPhone, maskCEP, maskEmail } from '@/utils/masks'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getAllTenants, createTenant, updateTenantConfig, updateTenantApiStatus, deleteTenantsApi, removeTenantConfig, type Tenant } from '@/services/tenant.service'
import { uploadTenantLogoViaWorker as uploadTenantLogo } from '@/services/workers.service'
import { ApiError } from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { ADDONS_REGISTRY } from '@/addons/index'

const tenants = ref<Tenant[]>([])
const loading = ref(false)
const search = ref('')
const filterStatus = ref('')
const apiError = ref('')
const { success: toastSuccess, error: toastError } = useToast()
const { confirm } = useConfirm()

const showModal = ref(false)
const isEditing = ref(false)
const savingTenant = ref(false)
const modalError = ref('')
const newTenant = ref<Partial<Tenant> & { ten_css?: string; ten_public_key?: string }>({
  tenant_prefix: '',
  name: '',
  primary_color: '#D4AF37',
  plan: 'basic',
  support_phone: '',
  email: '',
  logo_url: '',
  ten_css: '',
  ten_public_key: ''
})

function generateNewPublicKey() {
  const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8)
  const key = `tpk_${randomPart}`
  newTenant.value.ten_public_key = key
  newTenant.value.tenant_public_key = key
  toastSuccess('Nova chave pública gerada!')
}

async function copySnippet(text?: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toastSuccess('Chave pública copiada!')
  } catch {
    toastError('Erro ao copiar chave')
  }
}

async function copyPublicKey() {
  const key = newTenant.value.ten_public_key || newTenant.value.tenant_public_key || 'tpk_' + Math.random().toString(36).substring(2)
  await navigator.clipboard.writeText(key)
  toastSuccess('Chave pública copiada!')
}

function toggleAddon(key: string, enabled: boolean) {
  const t = newTenant.value as any
  if (!t.addons) t.addons = {}
  t.addons[key] = enabled
}

function setAddonValue(key: string, value: string | number) {
  const t = newTenant.value as any
  if (!t.addon_values) t.addon_values = {}
  let parsed = typeof value === 'string' ? (isNaN(Number(value)) ? value : Number(value)) : value
  if (typeof parsed === 'number' && key === 'monthly_price') {
    parsed = Math.min(parsed, 1000000000)
  }
  t.addon_values[key] = parsed
}

async function loadTenants() {
  loading.value = true
  apiError.value = ''
  try {
    tenants.value = await getAllTenants((enriched) => {
      tenants.value = enriched
    })
  } catch (err: any) {
    toastError(err.message || 'Erro ao carregar tenants.')
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

const filteredTenants = computed(() => {
  const q = search.value.toLowerCase()
  return tenants.value.filter(t => {
    const mSearch = !q || (t.name || '').toLowerCase().includes(q) || (t.tenant_prefix || '').toLowerCase().includes(q)
    const mStatus = !filterStatus.value || 
      (filterStatus.value === 'ACTIVE' && (t as any).tenant_enabled !== false) ||
      (filterStatus.value === 'BLOCKED' && (t as any).tenant_enabled === false)
    return mSearch && mStatus
  })
})

function openModal(t?: Tenant) {
  modalError.value = ''
  if (t) {
    isEditing.value = true
    newTenant.value = {
      ...t,
      email: t.email || '',
      ten_public_key: t.tenant_public_key || t.ten_public_key || '',
      ten_css: t.tenant_css || t.ten_css || '',
      logo_url: t.logo_url || '',
    }
  } else {
    isEditing.value = false
    const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8)
    newTenant.value = {
      tenant_prefix: '',
      name: '',
      primary_color: '#D4AF37',
      plan: 'basic',
      support_phone: '',
      email: '',
      logo_url: '',
      ten_css: '',
      ten_public_key: `tpk_${randomPart}`,
      tenant_public_key: `tpk_${randomPart}`
    }
  }
  showModal.value = true
}

async function saveTenantAction() {
  if (!newTenant.value.tenant_prefix) { modalError.value = 'Prefixo é obrigatório'; return }
  savingTenant.value = true
  modalError.value = ''
  try {
    if (isEditing.value) {
      await updateTenantConfig(newTenant.value.tenant_prefix, newTenant.value as any)
    } else {
      await createTenant(newTenant.value as any)
    }
    await loadTenants()
    showModal.value = false
    toastSuccess(isEditing.value ? 'Tenant atualizado com sucesso!' : 'Tenant criado com sucesso!')
  } catch (err: any) {
    modalError.value = err.message || 'Erro ao salvar tenant'
    toastError(modalError.value)
  } finally {
    savingTenant.value = false
  }
}

const uploadProgress = ref(0)
async function handleLogoUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || !target.files[0]) return
  const file = target.files[0]
  const prefix = newTenant.value.tenant_prefix || 'draft'
  
  try {
    const url = await uploadTenantLogo(prefix, file, (progress) => {
      uploadProgress.value = progress
    })
    newTenant.value.logo_url = url
    toastSuccess('Upload de logo concluído!')
  } catch (e: any) {
    toastError('Falha no upload do logo.')
    uploadProgress.value = 0
  }
}

async function toggleTenantStatus(t: any) {
  if (!t.id) {
    toastError('Este tenant não possui ID da API e não pode ser bloqueado.')
    return
  }
  const isEnabled = t.tenant_enabled !== false
  const actionName = isEnabled ? 'bloquear' : 'desbloquear'
  const ok = await confirm({
    title: `${isEnabled ? 'Bloquear' : 'Desbloquear'} Tenant`,
    message: `Deseja realmente ${actionName} o tenant ${t.tenant_prefix}?`,
    confirmLabel: isEnabled ? 'Bloquear' : 'Desbloquear',
    danger: isEnabled,
  })
  if (!ok) return

  try {
    await updateTenantApiStatus(t.id, !isEnabled)
    toastSuccess(`Tenant ${actionName}do com sucesso!`)
    await loadTenants()
  } catch (err: any) {
    // Erros já disparam toast global
  }
}

async function deleteTenantAction(t: any) {
  const ok = await confirm({
    title: 'Excluir Tenant Definitivamente',
    message: `Deseja realmente EXCLUIR o tenant "${t.tenant_prefix}"? Esta ação é irreversível.`,
    confirmLabel: 'Excluir',
    danger: true,
  })
  if (!ok) return

  try {
    if (t.id) {
      await deleteTenantsApi([t.id])
    }
    if (t.tenant_prefix) {
      await removeTenantConfig(t.tenant_prefix)
    }
    toastSuccess(`Tenant ${t.tenant_prefix} excluído com sucesso!`)
    await loadTenants()
  } catch (err: any) {
    // Erros já disparam toast global
  }
}

onMounted(loadTenants)

const vClickOutside = {
  mounted(el: any, binding: any) {
    el._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el._clickOutside)
  }
}

let autoRefreshInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  loadTenants()
  autoRefreshInterval = setInterval(() => {
    loadTenants();
  }, 60000);
});
onUnmounted(() => {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
});
</script>

<style scoped>
.tenants-container { padding: 0.5rem 0; }

.tenant-branding { display: flex; align-items: center; gap: 12px; }
.tenant-logo-preview {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 800; font-size: 0.9rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.tenant-logo-preview.has-img {
  background: var(--bg-surface, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.1));
  overflow: hidden;
  padding: 2px;
}
.tenant-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.tenant-info-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tenant-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.badge-tag-mini {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
}
.tenant-email {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}
.public-key-badge-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.72rem;
  font-family: monospace;
  width: fit-content;
}
.pk-snippet {
  color: var(--text-secondary);
}
.btn-copy-mini {
  background: none;
  border: none;
  color: var(--gold);
  cursor: pointer;
  padding: 0;
  font-size: 0.72rem;
  transition: opacity 0.2s;
}
.btn-copy-mini:hover {
  opacity: 0.8;
}

/* Modal Logo upload & preview */
.logo-modal-upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.logo-preview-box {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.logo-preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.btn-remove-logo {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(220, 38, 38, 0.85);
  color: #fff;
  border: none;
  border-radius: 4px;
  width: 18px;
  height: 18px;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.logo-upload-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.tenant-name { font-weight: 700; color: var(--text-primary); font-size: 0.9rem; margin: 0; }
.tenant-plan { font-size: 0.7rem; color: var(--gold); font-weight: 600; text-transform: uppercase; margin: 0; }

.prefix-code {
  background: var(--bg-input); border: 1px solid var(--border);
  padding: 2px 6px; border-radius: 4px; font-family: monospace;
  font-size: 0.8rem; color: var(--text-secondary);
}

.color-indicator { display: flex; align-items: center; gap: 8px; }
.color-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); }
.color-hex { font-size: 0.75rem; font-family: monospace; color: var(--text-muted); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(2px); }
.modal-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); width: 100%; max-width: 500px; box-shadow: var(--shadow-lg); overflow: hidden; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); }
.modal-header h3 { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
.close-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 1.2rem; }
.modal-body { padding: 1.5rem; }
.scroll-area { max-height: 70vh; overflow-y: auto; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.form-field.full { grid-column: 1 / -1; }
.form-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

.addons-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.addon-checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px 12px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-input);
  transition: all 0.2s;
}
.addon-checkbox-item:hover {
  border-color: var(--gold);
  background: var(--gold-dim);
}
.addon-checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.color-picker-input { display: flex; align-items: center; gap: 8px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius); padding: 4px 8px; }
.color-picker-input input[type="color"] { width: 30px; height: 30px; border: none; background: none; padding: 0; cursor: pointer; }
.color-picker-input input[type="text"] { border: none; background: none; font-family: monospace; font-size: 0.85rem; padding: 0; flex: 1; }

.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); display: flex; justify-content: flex-end; gap: 10px; }

.modal-error { margin-top: 1rem; padding: 0.75rem 1rem; background: rgba(224,82,82,0.1); border: 1px solid var(--danger); border-radius: var(--radius); color: var(--danger); font-size: 0.82rem; display: flex; align-items: center; gap: 8px; }
</style>
