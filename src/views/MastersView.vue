<template>
  <div>
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="section-title">Usuários Master</h2>
        <p class="section-sub">Super admins com acesso irrestrito a todos os tenants e configurações globais.</p>
      </div>
      <button class="btn btn-gold" @click="openModal()"><i class="fas fa-user-shield"></i> Novo Master</button>
    </div>

    <div class="card">
      <div class="filter-bar">
        <button class="btn btn-outline" @click="load" title="Atualizar Lista" style="padding: 0 12px; margin-right: 10px;"><i class="fas fa-sync-alt"></i></button>
          <div class="search-bar">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="search" type="text" placeholder="Buscar usuário master..." />
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="min-width: 220px">NOME</th>
            <th style="width: 160px; min-width: 130px">LOGIN</th>
            <th style="width: 150px; min-width: 130px">PERFIL</th>
            <th style="width: 120px; min-width: 100px">STATUS</th>
            <th style="width: 70px; min-width: 60px; text-align: right"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="5" class="empty-state"><i class="fas fa-spinner fa-spin"></i></td></tr>
          <tr v-else-if="!filtered.length"><td colspan="5" class="empty-state"><i class="fas fa-user-astronaut"></i><p>Nenhum usuário master encontrado.</p></td></tr>
          <tr v-for="u in filtered" :key="u.id" v-else>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="user-avatar">{{ initials(u.person?.name ?? u.username ?? '?') }}</div>
                <div>
                  <p style="color:var(--text-primary);font-weight:600;font-size:0.88rem" :title="u.person?.name ?? u.username ?? '—'">{{ u.person?.name ?? u.username ?? '—' }}</p>
                  <p style="color:var(--text-muted);font-size:0.73rem" :title="u.person?.email ?? '—'">{{ u.person?.email ?? '—' }}</p>
                </div>
              </div>
            </td>
            <td style="font-family:monospace;font-size:0.85rem;color:var(--text-secondary)">{{ u.username ?? '—' }}</td>
            <td><span class="master-badge"><i class="fas fa-crown" style="margin-right:4px"></i>{{ u.profile?.name ?? 'Master' }}</span></td>
            <td><span :class="['badge-status', u.status === 'ACTIVE' ? 'badge-ativo' : 'badge-inativo']">{{ u.status ?? '—' }}</span></td>
            <td style="text-align: right">
              <button class="action-icon-btn" title="Editar" @click="openModal(u)"><i class="fas fa-pen-to-square"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editing ? 'Editar Master' : 'Novo Usuário Master' }}</h3>
          <button class="btn-ghost" @click="showModal = false"><i class="fas fa-xmark"></i></button>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:1rem">
          <div class="form-row form-row-2">
            <div class="form-field">
              <label class="form-label">NOME COMPLETO *</label>
              <input v-model="form.name" type="text" placeholder="Nome completo" />
            </div>
            <div class="form-field">
              <label class="form-label">LOGIN *</label>
              <input v-model="form.user_login" type="text" placeholder="ex: root.admin" :disabled="!!editing" />
            </div>
          </div>
          <div class="form-row form-row-2" v-if="!editing">
            <div class="form-field">
              <label class="form-label">SENHA *</label>
              <input v-model="form.password" type="password" placeholder="••••••••" />
            </div>
            <div class="form-field">
              <label class="form-label">E-MAIL</label>
              <input v-model="form.email"  placeholder="email@dominio.com"  type="email" @input="form.email = maskEmail(form.email)" />
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { maskCPF, maskPhone, maskCEP, maskEmail } from '@/utils/masks'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getAllOperators, createOperator, type User } from '@/services/user.service'
import { useToast } from '@/composables/useToast'

const { success, error: toastError } = useToast()
const masters = ref<User[]>([])
const loading = ref(false)
const apiError = ref('')
const search = ref('')
const showModal = ref(false)
const editing = ref<User | null>(null)
const saving = ref(false)
const modalError = ref('')
const form = ref({ name: '', user_login: '', password: '', email: '' })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return masters.value.filter(u =>
    !q || (u.person?.name ?? u.username ?? '').toLowerCase().includes(q)
  )
})

async function load() {
  loading.value = true; apiError.value = ''
  try {
    const raw = await getAllOperators({
      columns: { id: true, username: true, status: true,
        person: { name: true, email: true },
        profile: { name: true, is_manager_profile: true } },
      filters: { profile: { is_manager_profile: { operation: 'equal', value: true } } }
    })
    masters.value = (Array.isArray(raw) ? raw : (raw as any).data ?? (raw as any).items ?? []) as User[]
  } catch (e: any) { toastError(e.message) }
  finally { loading.value = false }
}

function openModal(u?: User) {
  editing.value = u ?? null
  form.value = { name: u?.person?.name ?? '', user_login: u?.username ?? '', password: '', email: u?.person?.email ?? '' }
  modalError.value = ''
  showModal.value = true
}

async function save() {
  if (!form.value.name || (!editing.value && (!form.value.user_login || !form.value.password))) {
    modalError.value = 'Preencha os campos obrigatórios.'; return
  }
  saving.value = true; modalError.value = ''
  try {
    await createOperator({
      username: form.value.name,
      user_login: form.value.user_login,
      password: form.value.password,
      person: { name: form.value.name, email: form.value.email || undefined },
    })
    showModal.value = false
    success('Usuário master criado com sucesso.')
    await load()
  } catch (e: any) { modalError.value = e.message }
  finally { saving.value = false }
}

function initials(name: string) { return name.split(' ').slice(0,2).map(n => n[0]?.toUpperCase() ?? '').join('') }
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
.user-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--danger); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; }
.master-badge { padding: 3px 10px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; background: rgba(224,82,82,0.12); color: var(--danger); display: inline-flex; align-items: center; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; width: 100%; max-width: 480px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; }
.modal-header h3 { font-size: 1rem; font-weight: 700; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.25rem; }
</style>
