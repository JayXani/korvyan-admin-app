<template>
  <div class="logs-page">
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="section-title">Auditoria de Logs</h2>
        <p class="section-sub">Rastreamento cronológico de todas as modificações e acessos no sistema.</p>
      </div>
    </div>

    <div class="card">
      <!-- Barra de filtros -->
      <div class="filter-bar">
        <button class="btn btn-outline" @click="loadLogs" title="Atualizar Lista" style="padding: 0 12px; margin-right: 10px;"><i class="fas fa-sync-alt"></i></button>
          <div class="search-bar" style="max-width:350px;flex:1">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="searchQuery" type="text" placeholder="Buscar por usuário, ação ou IP..." />
        </div>
        <select v-model="ipFilter" class="filter-select" style="margin-left: 10px; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px; padding:6px 10px; font-size:0.82rem">
          <option value="">Todos os IPs Origem</option>
          <option value="has_ip">Somente Com IP Registrado</option>
          <option value="external">IPs Externos</option>
        </select>
        <button class="btn btn-outline" @click="openFilterModal" title="Filtros Avançados">
          <i class="fas fa-filter"></i>
          <span v-if="activeRulesCount > 0"> {{ activeRulesCount }} Filtros</span>
        </button>
      </div>

      <!-- Tabela -->
      <table class="data-table" style="table-layout:fixed;width:100%">
        <thead>
          <tr>
            <th style="width:160px; min-width: 140px">DATA / HORA</th>
            <th style="width:180px; min-width: 150px">USUÁRIO</th>
            <th style="min-width: 220px">AÇÃO REALIZADA</th>
            <th style="width:140px; min-width: 120px">ORIGEM IP</th>
            <th style="width:50px; min-width: 50px; text-align: right"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="empty-state"><i class="fas fa-spinner fa-spin"></i></td>
          </tr>
          <tr v-else-if="!paginatedLogs.length">
            <td colspan="5" class="empty-state-cell">
              <div class="empty-state">
                <i class="fas fa-clock-rotate-left"></i>
                <p>Nenhum log encontrado.</p>
              </div>
            </td>
          </tr>
          <template v-else>
            <tr v-for="log in paginatedLogs" :key="log.id" style="cursor:pointer" @click="openDetail(log)">
              <td>
                <p style="font-weight:500;margin:0;font-size:0.875rem; margin-right: 6px">{{ formatDate(log.created_at) }}</p>
                <p style="color:var(--text-muted);font-size:0.72rem;margin:4px 0 0;letter-spacing:0.2px">{{ formatTime(log.created_at) }}</p>
              </td>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <UserAvatar :userId="log.fk_log_use_id" :name="formatUsername(log.username)" size="sm" />
                  <span style="font-weight:500;font-size:0.875rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ formatUsername(log.username) }}</span>
                </div>
              </td>
              <td>
                <span :class="['action-badge', getActionClass(log.log_action)]">
                  {{ log.label ?? log.log_action ?? '—' }}
                </span>
              </td>
              <td style="font-family:monospace;font-size:0.8rem;color:var(--text-muted)">{{ log.log_user_ip || '—' }}</td>
              <td></td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Footer paginação -->
      <div class="table-footer">
        <p class="results-info">Exibindo {{ rangeStart }} a {{ rangeEnd }} de {{ filteredLogs.length }} entradas</p>
        <div class="pagination">
          <button class="pagination-btn" :disabled="currentPage <= 1" @click="currentPage--"><i class="fas fa-chevron-left"></i></button>
          <button class="pagination-btn active">{{ currentPage }} / {{ totalPages }}</button>
          <button class="pagination-btn" :disabled="currentPage >= totalPages" @click="currentPage++"><i class="fas fa-chevron-right"></i></button>
        </div>
      </div>
    </div>

    <!-- Modal Filtros Avançados -->
    <div v-if="showFilterModal" class="modal-overlay">
      <div class="modal-content" style="max-width:680px;width:90%">
        <div class="modal-header">
          <h3>Filtros Avançados</h3>
          <button class="btn-icon" @click="showFilterModal = false"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <!-- Header labels -->
          <div class="filter-rule-row" style="margin-bottom:8px;font-weight:600;font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">
            <div style="min-width:140px">Tipo</div>
            <div style="min-width:130px">Ação</div>
            <div style="flex:1">Valor</div>
            <div style="width:32px"></div>
          </div>

          <!-- Data -->
          <div class="filter-rule-row">
            <select disabled class="filter-select" style="min-width:140px">
              <option>Data</option>
            </select>
            <select v-model="filterForm.created_at.operation" class="filter-select" style="min-width:130px" @change="onDateOpChange">
              <option value="none">Não filtrar</option>
              <option value="equal">Igual a</option>
              <option value="between">Entre</option>
            </select>
            <div style="flex:1;display:flex;gap:4px">
              <template v-if="filterForm.created_at.operation !== 'none'">
                <DatePicker v-model="filterForm.created_at.value" placeholder="Data" style="flex:1" />
                <DatePicker v-if="filterForm.created_at.operation === 'between'" v-model="filterForm.created_at.value2" placeholder="Até" style="flex:1" />
              </template>
              <input v-else type="text" disabled placeholder="Qualquer data" class="filter-select" style="flex:1;width:100%" />
            </div>
            <div style="width:32px"></div>
          </div>

          <!-- Usuário -->
          <div class="filter-rule-row">
            <select disabled class="filter-select" style="min-width:140px">
              <option>Usuário</option>
            </select>
            <select v-model="filterForm.username.operation" class="filter-select" style="min-width:130px" @change="onUserOpChange">
              <option value="none">Não filtrar</option>
              <option value="equal">Igual a</option>
            </select>
            <div style="flex:1;display:flex;gap:4px">
              <template v-if="filterForm.username.operation !== 'none'">
                <select v-model="filterForm.username.value" class="filter-select" style="flex:1;width:100%">
                  <option value="">Selecione o Usuário...</option>
                  <option v-for="opt in uniqueUsers" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </template>
              <input v-else type="text" disabled placeholder="Qualquer usuário" class="filter-select" style="flex:1;width:100%" />
            </div>
            <div style="width:32px"></div>
          </div>

          <!-- Ação -->
          <div class="filter-rule-row">
            <select disabled class="filter-select" style="min-width:140px">
              <option>Ação</option>
            </select>
            <select v-model="filterForm.log_action.operation" class="filter-select" style="min-width:130px" @change="onActionOpChange">
              <option value="none">Não filtrar</option>
              <option value="equal">Igual a</option>
            </select>
            <div style="flex:1;display:flex;gap:4px">
              <template v-if="filterForm.log_action.operation !== 'none'">
                <select v-model="filterForm.log_action.value" class="filter-select" style="flex:1;width:100%">
                  <option value="">Selecione a Ação...</option>
                  <option v-for="opt in uniqueActions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </template>
              <input v-else type="text" disabled placeholder="Qualquer ação" class="filter-select" style="flex:1;width:100%" />
            </div>
            <div style="width:32px"></div>
          </div>
        </div>

        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center">
          <button class="btn btn-outline" style="color:var(--danger);border-color:var(--danger)" @click="clearAdvancedFilters">Limpar Filtros</button>
          <div style="display:flex;gap:10px">
            <button class="btn btn-outline" @click="showFilterModal = false">Cancelar</button>
            <button class="btn btn-gold" @click="applyFilters">Aplicar Filtros</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalhes -->
    <div v-if="detailLog" class="modal-overlay">
      <div class="modal-content" style="max-width:560px;width:90%">
        <div class="modal-header">
          <h3>Detalhes do Log</h3>
          <button class="btn-icon" @click="detailLog = null"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Usuário</label>
              <span>{{ detailLog.username ?? '—' }}</span>
            </div>
            <div class="detail-item">
              <label>Data / Hora</label>
              <span>{{ formatDate(detailLog.created_at) }} às {{ formatTime(detailLog.created_at) }}</span>
            </div>
            <div class="detail-item" style="grid-column:1/-1">
              <label>Ação Realizada</label>
              <span :class="['action-badge', getActionClass(detailLog.log_action)]">
                {{ detailLog.label ?? detailLog.log_action ?? '—' }}
              </span>
            </div>
            <div v-if="detailLog.entity_name" class="detail-item" style="grid-column:1/-1">
              <label>Nome do Item</label>
              <span>{{ detailLog.entity_name }}</span>
            </div>
            <div v-if="detailLog.entity_type" class="detail-item">
              <label>Tipo de Entidade</label>
              <span style="text-transform:capitalize">{{ detailLog.entity_type }}</span>
            </div>
            <div v-if="detailLog.log_row_id" class="detail-item">
              <label>ID do Item</label>
              <span style="font-family:monospace;font-size:0.85rem">{{ detailLog.log_row_id }}</span>
            </div>
            <div class="detail-item">
              <label>Origem IP</label>
              <span style="font-family:monospace;font-size:0.85rem">{{ detailLog.log_user_ip || '—' }}</span>
            </div>
            <div v-if="detailLog.log_reason" class="detail-item" style="grid-column:1/-1">
              <label>Motivo</label>
              <span style="color:var(--danger)">{{ detailLog.log_reason }}</span>
            </div>
            <div class="detail-item">
              <label>ID do Log</label>
              <span style="font-family:monospace;font-size:0.75rem;color:var(--text-muted)">{{ detailLog.id }}</span>
            </div>
          </div>
        </div>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border-light);display:flex;justify-content:flex-end">
          <button class="btn btn-outline" @click="detailLog = null">Fechar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
const { success: toastSuccess, error: toastError } = useToast()
import { ref, computed, onMounted, watch, onUnmounted, reactive } from 'vue'
import { getAuditLogs } from '@/services/audit.service'
import DatePicker from '@/components/ui/DatePicker.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { getUserAvatarViaWorker } from '@/services/workers.service'

function formatUsername(name?: string): string {
  if (!name) return '—'
  if (typeof name === 'string' && name.includes('.') && !name.includes(' ')) {
    return name
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }
  return name
}

import { getCurrentTenantPrefix } from '@/composables/useTenantContext'

const avatars = reactive<Record<string, string>>({})
const loadingAvatars = reactive<Record<string, boolean>>({})

async function loadAvatar(userId: string) {
  if (!userId) return
  const tenant = getCurrentTenantPrefix()
  const cacheKey = `${tenant}_${userId}`
  if (loadingAvatars[cacheKey] || avatars[cacheKey] !== undefined) return
  loadingAvatars[cacheKey] = true
  try {
    const url = await getUserAvatarViaWorker(tenant, userId)
    if (url) {
      avatars[cacheKey] = url
      avatars[userId] = url
    }
  } catch {}
}

// Estado principal
const logs = ref<any[]>([])
const loading = ref(false)
const error = ref('')

// Paginação e Busca
const searchQuery = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 20

// Modal Filtros
const showFilterModal = ref(false)
// Modal Detalhes
const detailLog = ref<any | null>(null)

const createInitialFilterState = () => ({
  created_at: { operation: 'none', value: '', value2: '' },
  username:   { operation: 'none', value: '' },
  log_action: { operation: 'none', value: '' },
})

const filterForm    = ref(createInitialFilterState())
const appliedFilters = ref(createInitialFilterState())
const activeRulesCount = ref(0)

// Listas únicas para selects
const uniqueUsers = computed(() => {
  const s = new Set<string>()
  logs.value.forEach(l => { if (l.username && l.username !== 'unknown') s.add(l.username.trim()) })
  return Array.from(s).sort()
})

const uniqueActions = computed(() => {
  const s = new Set<string>()
  logs.value.forEach(l => { const a = (l.log_action ?? '').trim(); if (a) s.add(a) })
  return Array.from(s).sort()
})

// Modal helpers
function openFilterModal() {
  filterForm.value = JSON.parse(JSON.stringify(appliedFilters.value))
  showFilterModal.value = true
}

function openDetail(log: any) {
  detailLog.value = log
}

function onDateOpChange() {
  if (filterForm.value.created_at.operation === 'none') {
    filterForm.value.created_at.value = ''
    filterForm.value.created_at.value2 = ''
  }
}
function onUserOpChange()   { if (filterForm.value.username.operation === 'none')   filterForm.value.username.value   = '' }
function onActionOpChange() { if (filterForm.value.log_action.operation === 'none') filterForm.value.log_action.value = '' }

function applyFilters() {
  appliedFilters.value = JSON.parse(JSON.stringify(filterForm.value))
  let count = 0
  if (appliedFilters.value.created_at.operation !== 'none') count++
  if (appliedFilters.value.username.operation   !== 'none') count++
  if (appliedFilters.value.log_action.operation !== 'none') count++
  activeRulesCount.value = count
  showFilterModal.value = false
  currentPage.value = 1
}

function clearAdvancedFilters() {
  filterForm.value    = createInitialFilterState()
  appliedFilters.value = createInitialFilterState()
  activeRulesCount.value = 0
  currentPage.value = 1
  showFilterModal.value = false
}

// Reset page on search
watch(searchQuery, () => { currentPage.value = 1 })

// Carregamento
async function loadLogs() {
  loading.value = true
  error.value = ''
  try {
    const res = await getAuditLogs({ max_results: 500 })
    logs.value = res.map(l => {
      if (l.fk_log_use_id) loadAvatar(l.fk_log_use_id)
      return {
        ...l,
        username: l.username || 'Sistema',
      }
    })
  } catch (e: any) {
    toastError(e.message || 'Ocorreu um erro ao buscar os logs.')
  } finally {
    loading.value = false
  }
}

const ipFilter = ref('')

// Filtro
const filteredLogs = computed(() => {
  let result = logs.value
  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    result = result.filter(l =>
      (l.username ?? '').toLowerCase().includes(q) ||
      (l.label ?? l.log_action ?? '').toLowerCase().includes(q) ||
      (l.log_user_ip ?? '').toLowerCase().includes(q)
    )
  }
  if (ipFilter.value === 'has_ip') {
    result = result.filter(l => !!l.log_user_ip)
  } else if (ipFilter.value === 'external') {
    result = result.filter(l => l.log_user_ip && !l.log_user_ip.startsWith('127.') && !l.log_user_ip.startsWith('192.168.'))
  }
  if (activeRulesCount.value > 0) {
    result = result.filter(l => {
      const f = appliedFilters.value
      if (f.created_at.operation !== 'none' && f.created_at.value) {
        if (!l.created_at) return false
        const logTime = new Date(l.created_at).getTime()
        const f1 = new Date(f.created_at.value).getTime()
        if (f.created_at.operation === 'equal') {
          if (new Date(l.created_at).toISOString().split('T')[0] !== new Date(f.created_at.value).toISOString().split('T')[0]) return false
        } else if (f.created_at.operation === 'between' && f.created_at.value2) {
          const f2 = new Date(f.created_at.value2).getTime() + 86399999
          if (logTime < f1 || logTime > f2) return false
        }
      }
      if (f.username.operation !== 'none' && f.username.value) {
        if ((l.username ?? '').toLowerCase() !== f.username.value.toLowerCase()) return false
      }
      if (f.log_action.operation !== 'none' && f.log_action.value) {
        if ((l.log_action ?? '').toLowerCase() !== f.log_action.value.toLowerCase()) return false
      }
      return true
    })
  }
  return result
})

const totalPages  = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / PAGE_SIZE)))
const rangeStart  = computed(() => filteredLogs.value.length === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1)
const rangeEnd    = computed(() => Math.min(currentPage.value * PAGE_SIZE, filteredLogs.value.length))
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredLogs.value.slice(start, start + PAGE_SIZE)
})

// Formatação
function getInitials(name: string) {
  if (!name || name === 'Sistema') return 'SYS'
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}
function formatDate(d?: string) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }
function formatTime(d?: string) { return d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '' }

function getActionClass(action?: string) {
  const a = (action ?? '').toUpperCase()
  if (a === 'LOGIN')  return 'action-gray'
  if (a === 'CREATE') return 'action-blue'
  if (a === 'UPDATE') return 'action-gold'
  if (a === 'DELETE') return 'action-red'
  return 'action-gold'
}

function getActionIcon(_action?: string) {
  return ''
}

onMounted(loadLogs)

let autoRefreshInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  autoRefreshInterval = setInterval(() => {
    loadLogs();
  }, 60000);
});
onUnmounted(() => {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
});

</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
.section-title { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin: 0 0 .5rem; letter-spacing: -.5px; }
.section-sub { font-size: .95rem; color: var(--text-muted); margin: 0; }

.card { background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,.05); border: 1px solid var(--border-light); }

/* Avatar */
.user-avatar { width:34px;height:34px;border-radius:50%;background:var(--gold);color:#1a1a1a;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0; }

/* Badges */
.action-badge { display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:6px;font-size:.75rem;font-weight:700;letter-spacing:.3px;white-space:nowrap; }
.action-green { background:rgba(61,186,111,.15);color:var(--success); }
.action-gold  { background:rgba(212,175,55,.15); color:var(--gold); }
.action-blue  { background:rgba(77,166,255,.15); color:#4DA6FF; }
.action-gray  { background:rgba(153,153,153,.15);color:var(--text-muted); }
.action-red   { background:rgba(224,82,82,.15);  color:var(--danger); }

/* Modal */
.modal-overlay { position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.4);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px); }
.modal-content { background:var(--bg-card);border-radius:var(--radius-lg);padding:24px;box-shadow:0 10px 40px rgba(0,0,0,.2);border:1px solid var(--border-light);max-height:90vh;overflow-y:auto; }
.modal-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:20px; }
.modal-header h3 { font-size:1.15rem;font-weight:700;color:var(--text-primary); }
.modal-body { overflow:visible; }
.btn-icon { background:none;border:none;font-size:1.1rem;color:var(--text-muted);cursor:pointer;transition:0.2s;padding:4px 6px;border-radius:4px; }
.btn-icon:hover { color:var(--gold); }

/* Detail grid */
.detail-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
.detail-item { display:flex;flex-direction:column;gap:4px; }
.detail-item label { font-size:.75rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px; }
.detail-item span { font-size:.9rem;color:var(--text-primary);font-weight:500; }

.empty-state-cell { text-align: center; padding: 2rem 0; }

/* Table footer - igual ContratoListView */

/* Misc */
.filter-rule-row { display:flex;align-items:center;gap:10px;margin-bottom:10px; }
@media (max-width:600px) { .filter-rule-row { flex-direction:column;align-items:stretch; } }
</style>
