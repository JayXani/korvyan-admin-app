<template>
  <div>
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="section-title">Escopos de Acesso</h2>
        <p class="section-sub">Permissões granulares disponíveis para perfis e usuários.</p>
      </div>
      <button class="btn btn-gold" @click="openModal()"><i class="fas fa-key"></i> Novo Escopo</button>
    </div>

    <div class="card">
      <div class="filter-bar">
        <button class="btn btn-outline" @click="load" title="Atualizar Lista" style="padding: 0 12px; margin-right: 10px;"><i class="fas fa-sync-alt"></i></button>
          <div class="search-bar">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="search" type="text" placeholder="Buscar escopo por nome, código ou descrição..." />
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 220px; min-width: 180px">NOME / CÓDIGO DO ESCOPO</th>
            <th style="min-width: 220px">DESCRIÇÃO</th>
            <th style="width: 140px; min-width: 120px">CRIADO EM</th>
            <th style="width: 150px; min-width: 130px">ÚLTIMA ALTERAÇÃO</th>
            <th style="width: 90px; min-width: 80px; text-align: right"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="5" class="empty-state"><i class="fas fa-spinner fa-spin"></i></td></tr>
          <tr v-else-if="!filtered.length"><td colspan="5" class="empty-state"><i class="fas fa-key"></i><p>Nenhum escopo encontrado.</p></td></tr>
          <tr v-for="s in filtered" :key="s.id ?? s.code" v-else>
            <td>
              <div style="display:flex; flex-direction:column; gap:2px">
                <span style="font-weight:600; color:var(--text-primary)" :title="s.name || s.code">{{ s.name || s.code }}</span>
                <span v-if="s.name && s.name !== s.code" class="scope-name" style="font-size:0.75rem; opacity:0.8">{{ s.code }}</span>
                <span v-else class="scope-name">{{ s.code }}</span>
              </div>
            </td>
            <td style="color:var(--text-secondary);font-size:0.85rem;white-space:pre-line;" :title="s.description" v-html="formatScopeDescription(s.description)"></td>
            <td style="color:var(--text-muted);font-size:0.82rem">{{ formatDate(s.created_at) }}</td>
            <td style="color:var(--text-muted);font-size:0.82rem">{{ formatDate(s.updated_at) }}</td>
            <td style="text-align: right">
              <div style="display:flex; justify-content:flex-end; gap:4px">
                <button class="action-icon-btn" @click="openModal(s)" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="action-icon-btn danger" @click="confirmDelete(s)" title="Excluir"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editing ? 'Editar Escopo' : 'Novo Escopo' }}</h3>
          <button class="btn-ghost" @click="showModal = false"><i class="fas fa-xmark"></i></button>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:1rem">
          <div class="form-field">
            <label class="form-label">CÓDIGO *</label>
            <input v-model="form.code" type="text" placeholder="ex: user.create" :disabled="!!editing" />
          </div>
          <div class="form-field">
            <label class="form-label">DESCRIÇÃO</label>
            <input v-model="form.description" type="text" placeholder="Descreva o escopo..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showModal = false">Cancelar</button>
          <button class="btn btn-gold" @click="save" :disabled="saving">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            <span v-else>{{ editing ? 'Salvar' : 'Criar' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete -->
    <teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay">
        <div class="modal-card" style="max-width:400px">
          <div class="modal-header">
            <h3><i class="fas fa-triangle-exclamation" style="color:var(--danger)"></i> Confirmar Exclusão</h3>
            <button class="btn-ghost" @click="deleteTarget = null"><i class="fas fa-xmark"></i></button>
          </div>
          <div style="padding:0.5rem 0 1rem">
            <p>Excluir o escopo <strong>{{ deleteTarget.code }}</strong>?</p>
            <p style="font-size:0.8rem;color:var(--text-muted);margin-top:6px">Esta ação remove da API e do Firebase.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="deleteTarget = null">Cancelar</button>
            <button class="btn btn-danger" @click="doDelete" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              <span>Excluir</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getAllScopes, createScope, updateScope, deleteScope, formatScopeDescription, type Scope } from '@/services/scope.service'
import { useToast } from '@/composables/useToast'

const { success, error: toastError } = useToast()
const scopes = ref<Scope[]>([])
const loading = ref(false)
const apiError = ref('')
const search = ref('')
const showModal = ref(false)
const editing = ref<Scope | null>(null)
const saving = ref(false)
const modalError = ref('')
const form = ref({ code: '', description: '' })
const deleteTarget = ref<Scope | null>(null)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return scopes.value.filter(s => 
    !q || 
    (s.name ?? '').toLowerCase().includes(q) || 
    s.code.toLowerCase().includes(q) || 
    (s.description ?? '').toLowerCase().includes(q)
  )
})

async function load() {
  loading.value = true; apiError.value = ''
  try {
    scopes.value = await getAllScopes(undefined, (enriched) => {
      scopes.value = enriched
    })
  } catch (e: any) { toastError(e.message) }
  finally { loading.value = false }
}

function openModal(s?: Scope) {
  editing.value = s ?? null
  form.value = { code: s?.code ?? '', description: s?.description ?? '' }
  modalError.value = ''
  showModal.value = true
}

async function save() {
  if (!form.value.code.trim()) { modalError.value = 'O código é obrigatório.'; return }
  saving.value = true; modalError.value = ''
  try {
    if (editing.value) {
      await updateScope(editing.value.id!, editing.value.code, form.value.description)
    } else {
      await createScope(form.value.code, form.value.description)
    }
    showModal.value = false
    success(editing.value ? 'Escopo atualizado.' : 'Escopo criado.')
    await load()
  } catch (e: any) { modalError.value = e.message }
  finally { saving.value = false }
}

function confirmDelete(s: Scope) { deleteTarget.value = s }

async function doDelete() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await deleteScope(deleteTarget.value.id!, deleteTarget.value.code)
    success('Escopo excluído.')
    deleteTarget.value = null
    await load()
  } catch (e: any) {
    toastError(e.message)
    deleteTarget.value = null
  } finally { saving.value = false }
}

function formatDate(d?: string) { return d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—' }
onMounted(load)

let autoRefreshInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  autoRefreshInterval = setInterval(() => {
    load();
  }, 60000);
});
onUnmounted(() => {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
});

</script>

<style scoped>
.scope-name { font-family: monospace; font-size: 0.88rem; color: var(--gold); font-weight: 600; background: var(--bg-input); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border-light); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; width: 100%; max-width: 440px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; }
.modal-header h3 { font-size: 1rem; font-weight: 700; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.25rem; }
</style>
