<template>
  <div class="reports-config-container">
    <!-- Header Hero Card -->
    <div class="bo-page-header">
      <div class="bo-page-header-left">
        <div class="header-icon-box">
          <i class="fas fa-sliders text-gold"></i>
        </div>
        <div class="header-titles">
          <div class="title-with-badge">
            <h1>Configurações de Relatórios Dinâmicos</h1>
            <span class="badge-bo">REPORTS_CONFIG</span>
          </div>
          <p>Gerencie fontes de dados (data sources), domínios permitidos e o catálogo de campos para extração dinâmica com ORM Builder.</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="loadConfigs" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i> Atualizar
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="fas fa-plus"></i> Nova Configuração
        </button>
      </div>
    </div>

    <!-- Seletor de Tipo / Fonte de Dados -->
    <div class="type-cards-row">
      <div 
        class="type-selector-card" 
        :class="{ active: selectedType === 'contract' }"
        @click="selectType('contract')"
      >
        <div class="type-icon-circle contract">
          <i class="fas fa-file-contract"></i>
        </div>
        <div class="type-info">
          <h3>Contratos & Membros</h3>
          <span class="type-badge">Fonte: contract</span>
          <p>Mapeia dados de contratos, planos, bancos, solicitantes, pessoas e parcelas.</p>
        </div>
        <div class="type-status">
          <span v-if="hasConfigFor('contract')" class="badge-status-pill active">
            <i class="fas fa-check-circle"></i> Configurado
          </span>
          <span v-else class="badge-status-pill pending">
            <i class="fas fa-clock"></i> Não Configurado
          </span>
        </div>
      </div>

      <div 
        class="type-selector-card" 
        :class="{ active: selectedType === 'financial' }"
        @click="selectType('financial')"
      >
        <div class="type-icon-circle financial">
          <i class="fas fa-wallet"></i>
        </div>
        <div class="type-info">
          <h3>Financeiro & Arrecadação</h3>
          <span class="type-badge">Fonte: financial</span>
          <p>Mapeia dados de transações, pagamentos, liquidações, bancos e parcelas.</p>
        </div>
        <div class="type-status">
          <span v-if="hasConfigFor('financial')" class="badge-status-pill active">
            <i class="fas fa-check-circle"></i> Configurado
          </span>
          <span v-else class="badge-status-pill pending">
            <i class="fas fa-clock"></i> Não Configurado
          </span>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-card">
      <div class="main-card-header">
        <div>
          <h2>{{ currentConfigName }}</h2>
          <span class="sub-text">
            {{ activeFields.length }} campo(s) configurado(s) para extração dinâmica
          </span>
        </div>
        <div class="header-right-btns">
          <button class="btn btn-outline" @click="loadPreset" title="Preencher com campos oficiais da Korvyan">
            <i class="fas fa-wand-magic-sparkles"></i> Carregar Preset Oficial
          </button>
          <button class="btn btn-primary" @click="saveCurrentConfig" :disabled="saving">
            <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
            {{ saving ? 'Salvando...' : 'Salvar Configuração' }}
          </button>
        </div>
      </div>

      <!-- Barra de Filtro e Ações Rápidas -->
      <div class="table-toolbar">
        <div class="search-input-box">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="search" type="text" placeholder="Filtrar por código, rótulo ou domínio..." />
        </div>
        <button class="btn btn-sm btn-outline" @click="openAddFieldModal">
          <i class="fas fa-plus"></i> Adicionar Campo
        </button>
      </div>

      <!-- Tabela de Campos -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 180px;">CÓDIGO (CODE)</th>
              <th style="min-width: 200px;">RÓTULO (LABEL)</th>
              <th style="width: 220px;">DOMÍNIO (SOURCE_DOMAIN)</th>
              <th style="width: 120px;">TIPO DE DADO</th>
              <th style="width: 100px; text-align: center;">SELECIONÁVEL</th>
              <th style="width: 100px; text-align: center;">FILTRÁVEL</th>
              <th style="width: 100px; text-align: center;">ORDENÁVEL</th>
              <th style="width: 80px; text-align: right;">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="empty-cell">
                <i class="fas fa-spinner fa-spin"></i> Carregando configurações...
              </td>
            </tr>
            <tr v-else-if="filteredFields.length === 0">
              <td colspan="8" class="empty-cell">
                <i class="fas fa-folder-open"></i>
                <p>Nenhum campo encontrado nesta configuração.</p>
                <button class="btn btn-sm btn-primary" style="margin-top: 10px;" @click="loadPreset">
                  <i class="fas fa-wand-magic-sparkles"></i> Aplicar Preset Oficial Agora
                </button>
              </td>
            </tr>
            <tr v-for="(f, idx) in filteredFields" :key="f.code + '-' + f.source_domain" class="field-row">
              <td>
                <code class="code-badge">{{ f.code }}</code>
              </td>
              <td>
                <span class="label-text">{{ f.label }}</span>
              </td>
              <td>
                <span class="domain-tag">{{ f.source_domain }}</span>
              </td>
              <td>
                <span class="type-tag" :class="f.field_type">{{ f.field_type }}</span>
              </td>
              <td style="text-align: center;">
                <input type="checkbox" v-model="f.is_selectable" class="checkbox-custom" />
              </td>
              <td style="text-align: center;">
                <input type="checkbox" v-model="f.is_filterable" class="checkbox-custom" />
              </td>
              <td style="text-align: center;">
                <input type="checkbox" v-model="f.is_sortable" class="checkbox-custom" />
              </td>
              <td style="text-align: right;">
                <button class="btn-icon text-danger" title="Excluir Campo" @click="removeField(idx)">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Adicionar Campo -->
    <div v-if="showFieldModal" class="modal-overlay" @click.self="showFieldModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Novo Campo de Relatório</h3>
          <button class="close-btn" @click="showFieldModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Código do Campo (Atributo da Entidade)</label>
            <input v-model="newField.code" type="text" class="input-styled" placeholder="Ex: code, name, value_enrollment" />
            <small class="help-text">Nome exato da propriedade mapeada no ORM Builder.</small>
          </div>
          <div class="form-group">
            <label class="form-label">Rótulo Exibido (Label)</label>
            <input v-model="newField.label" type="text" class="input-styled" placeholder="Ex: Código do Contrato" />
          </div>
          <div class="form-group">
            <label class="form-label">Domínio de Origem (Source Domain)</label>
            <select v-model="newField.source_domain" class="input-styled">
              <option v-for="d in availableDomainsForSelectedType" :key="d" :value="d">{{ d }}</option>
            </select>
            <small class="help-text">Relação registrada nas entidades do backend.</small>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo do Campo</label>
            <select v-model="newField.field_type" class="input-styled">
              <option value="string">Texto (string)</option>
              <option value="number">Numérico (number)</option>
              <option value="date">Data (date)</option>
              <option value="boolean">Booleano (boolean)</option>
            </select>
          </div>
          <div class="checkbox-group">
            <label><input type="checkbox" v-model="newField.is_selectable" /> Selecionável nas Colunas</label>
            <label><input type="checkbox" v-model="newField.is_filterable" /> Filtrável nas Queries</label>
            <label><input type="checkbox" v-model="newField.is_sortable" /> Ordenável (Order By)</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showFieldModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="addField">Adicionar Campo</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  listReportConfigs,
  createReportConfig,
  getDefaultPresets,
  type ReportConfigDefinition,
  type ReportConfigField
} from '@/services/report_config.service'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

const loading = ref(false)
const saving = ref(false)
const selectedType = ref<'contract' | 'financial'>('contract')
const search = ref('')
const configs = ref<ReportConfigDefinition[]>([])

const presets = getDefaultPresets()

// Campos em edição para cada tipo
const editableConfigs = ref<Record<'contract' | 'financial', ReportConfigDefinition>>({
  contract: { ...presets.contract, fields: [...presets.contract.fields] },
  financial: { ...presets.financial, fields: [...presets.financial.fields] }
})

const showFieldModal = ref(false)
const newField = ref<ReportConfigField>({
  code: '',
  label: '',
  source_domain: 'contract',
  field_type: 'string',
  is_selectable: true,
  is_filterable: true,
  is_sortable: true
})

const availableDomainsForSelectedType = computed(() => {
  if (selectedType.value === 'contract') {
    return [
      'contract',
      'banks',
      'plans',
      'status',
      'dependents',
      'dependents.applicant',
      'dependents.applicant.person',
      'installments',
      'installments.status'
    ]
  }
  return [
    'financial',
    'bank',
    'installments',
    'contract',
    'installments.status',
    'status'
  ]
})

const currentConfigName = computed(() => {
  return editableConfigs.value[selectedType.value].report_name
})

const activeFields = computed(() => {
  return editableConfigs.value[selectedType.value].fields || []
})

const filteredFields = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return activeFields.value
  return activeFields.value.filter(f =>
    f.code.toLowerCase().includes(q) ||
    f.label.toLowerCase().includes(q) ||
    f.source_domain.toLowerCase().includes(q)
  )
})

function hasConfigFor(type: 'contract' | 'financial'): boolean {
  return configs.value.some(c => c.report_type === type && c.is_active)
}

function selectType(type: 'contract' | 'financial') {
  selectedType.value = type
  search.value = ''
}

function loadPreset() {
  const p = presets[selectedType.value]
  editableConfigs.value[selectedType.value] = {
    ...p,
    fields: p.fields.map(f => ({ ...f }))
  }
  toastSuccess(`Preset oficial de ${selectedType.value === 'contract' ? 'Contratos' : 'Financeiro'} aplicado!`)
}

function openAddFieldModal() {
  newField.value = {
    code: '',
    label: '',
    source_domain: availableDomainsForSelectedType.value[0] || 'contract',
    field_type: 'string',
    is_selectable: true,
    is_filterable: true,
    is_sortable: true
  }
  showFieldModal.value = true
}

function openCreateModal() {
  openAddFieldModal()
}

function addField() {
  if (!newField.value.code || !newField.value.label) {
    toastError('Preencha o código e o rótulo do campo.')
    return
  }

  const existing = activeFields.value.find(
    f => f.code === newField.value.code && f.source_domain === newField.value.source_domain
  )
  if (existing) {
    toastError(`O campo "${newField.value.code}" no domínio "${newField.value.source_domain}" já existe.`)
    return
  }

  editableConfigs.value[selectedType.value].fields.push({ ...newField.value })
  showFieldModal.value = false
  toastSuccess('Campo adicionado à configuração!')
}

function removeField(index: number) {
  editableConfigs.value[selectedType.value].fields.splice(index, 1)
}

async function loadConfigs() {
  loading.value = true
  try {
    const list = await listReportConfigs()
    configs.value = list

    for (const c of list) {
      if (c.report_type === 'contract' || c.report_type === 'financial') {
        editableConfigs.value[c.report_type] = {
          ...c,
          fields: Array.isArray(c.fields) ? c.fields.map(f => ({ ...f })) : []
        }
      }
    }
  } catch (err: any) {
    toastError(err.message || 'Erro ao carregar configurações.')
  } finally {
    loading.value = false
  }
}

async function saveCurrentConfig() {
  const cfg = editableConfigs.value[selectedType.value]
  if (!cfg.fields || cfg.fields.length === 0) {
    toastError('Configure ao menos um campo antes de salvar.')
    return
  }

  saving.value = true
  try {
    await createReportConfig({
      report_name: cfg.report_name,
      report_type: selectedType.value,
      is_active: true,
      fields: cfg.fields
    })
    toastSuccess(`Configuração de ${cfg.report_name} salva com sucesso no Core!`)
    await loadConfigs()
  } catch (err: any) {
    toastError(err.message || 'Erro ao salvar configuração de relatório.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfigs()
})
</script>

<style scoped>
.reports-config-container {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header Hero Card */
.bo-page-header {
  background: var(--bg-surface, #1e222d);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.bo-page-header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.header-icon-box {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.title-with-badge h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
}

.badge-bo {
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(212, 175, 55, 0.12);
  color: var(--gold, #d4af37);
  border: 1px solid rgba(212, 175, 55, 0.25);
  font-family: monospace;
}

.header-titles p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.header-actions .btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.2rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-actions .btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.header-actions .btn-outline:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--text-muted);
}

.header-actions .btn-primary {
  background: var(--gold, #d4af37);
  color: #000;
  border: 1px solid var(--gold, #d4af37);
}

.header-actions .btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

@media (max-width: 860px) {
  .bo-page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

.type-cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.type-selector-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  padding: 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.type-selector-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.type-selector-card.active {
  border-color: var(--primary);
  background: rgba(139, 92, 246, 0.05);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.type-icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.type-icon-circle.contract {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.type-icon-circle.financial {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.type-info {
  flex: 1;
}

.type-info h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.type-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
  margin: 3px 0;
  font-family: monospace;
}

.type-info p {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.badge-status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.badge-status-pill.active {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.badge-status-pill.pending {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.main-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
}

.main-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 1rem;
}

.main-card-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.sub-text {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.header-right-btns {
  display: flex;
  gap: 8px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-input-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  width: 320px;
}

.search-input-box input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  width: 100%;
  font-size: 0.85rem;
}

.search-input-box input:focus {
  outline: none;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 2px solid var(--border);
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}

.field-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.code-badge {
  background: rgba(139, 92, 246, 0.12);
  color: var(--primary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
  font-weight: 600;
}

.domain-tag {
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.type-tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
}

.type-tag.string { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.type-tag.number { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.type-tag.date { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.type-tag.boolean { background: rgba(168, 85, 247, 0.15); color: #c084fc; }

.checkbox-custom {
  cursor: pointer;
  accent-color: var(--primary);
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: 0.2s;
}

.btn-icon:hover {
  background: rgba(239, 68, 68, 0.15);
}

.empty-cell {
  text-align: center;
  padding: 3rem 1rem !important;
  color: var(--text-muted);
}

.empty-cell i {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  opacity: 0.5;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4);
}

.modal-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
}

.modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.input-styled {
  background: var(--bg-input);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.input-styled:focus {
  border-color: var(--primary);
  outline: none;
}

.help-text {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 6px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.modal-footer {
  padding: 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
