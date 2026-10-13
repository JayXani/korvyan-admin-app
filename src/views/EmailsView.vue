<template>
  <div class="emails-container">
    <div class="bo-page-header">
      <div class="header-content">
        <h1>Configuração e Templates de Email</h1>
        <p>Gerencie as integrações e disparos transacionais para cada Tenant</p>
      </div>
    </div>

    <!-- Hub de Seleção de Tenants em Cards -->
    <div class="tenant-selection-hub mb-4">
      <div class="hub-header">
        <div class="hub-header-left">
          <div class="hub-title-row">
            <i class="fas fa-building text-gold"></i>
            <h3>Empresas & Tenants Cadastrados</h3>
            <span class="count-pill">{{ filteredTenants.length }}</span>
          </div>
          <p class="hub-sub">Selecione uma empresa para gerenciar as credenciais da Hostinger e customizar os templates de e-mail</p>
        </div>
        <div class="hub-search-box">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="tenantSearch" type="text" placeholder="Filtrar empresa por nome ou prefixo..." />
        </div>
      </div>

      <div class="tenants-cards-grid">
        <div 
          v-for="t in filteredTenants" 
          :key="t.tenant_prefix"
          class="tenant-card"
          :class="{ active: selectedTenantId === t.tenant_prefix }"
          @click="selectTenant(t.tenant_prefix)"
        >
          <div class="tenant-card-top">
            <div class="tenant-avatar" :style="{ background: t.primary_color || 'var(--gold, #d4af37)' }">
              {{ (t.name || t.tenant_prefix || '?').substring(0, 2).toUpperCase() }}
            </div>
            <span v-if="selectedTenantId === t.tenant_prefix" class="badge-selected">
              <i class="fas fa-circle-check"></i> Ativo
            </span>
            <span v-else class="tenant-slug">@{{ t.tenant_prefix }}</span>
          </div>
          <div class="tenant-card-info">
            <h4 class="tenant-title">{{ t.name || t.tenant_prefix }}</h4>
            <div class="tenant-meta-row">
              <span class="tenant-prefix-tag">prefix: {{ t.tenant_prefix }}</span>
              <span v-if="selectedTenantId === t.tenant_prefix && emailConfig.apiToken" class="hostinger-mini-status text-success" title="Hostinger Conectada">
                <i class="fas fa-bolt"></i> SMTP Ativo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Banner de Integração Hostinger do Tenant Selecionado -->
    <div v-if="selectedTenantId && currentTenant" class="hostinger-tenant-banner mb-4">
      <div class="banner-left">
        <div class="banner-icon-box">
          <i class="fas fa-server"></i>
        </div>
        <div class="banner-info">
          <div class="banner-title-line">
            <h3>Hostinger Mail &bull; {{ currentTenant.name || currentTenant.tenant_prefix }}</h3>
            <span v-if="emailConfig.apiToken" class="badge-status-pill active">
              <i class="fas fa-circle-check"></i> Hostinger Conectada
            </span>
            <span v-else class="badge-status-pill pending">
              <i class="fas fa-clock"></i> Pendente de Configuração
            </span>
          </div>
          <p class="banner-meta">
            Remetente: <strong class="text-gold">{{ emailConfig.fromEmail || 'Não definido' }}</strong>
            <span class="dot-sep">&bull;</span>
            Nome: <strong>{{ emailConfig.fromName || 'Padrão do Sistema' }}</strong>
            <span class="dot-sep">&bull;</span>
            Mailbox ID: <code class="mini-code">{{ emailConfig.mailboxId || 'Não vinculado' }}</code>
          </p>
        </div>
      </div>

      <div class="banner-actions">
        <button 
          class="btn btn-outline btn-sm"
          :class="{ active: activeTab === 'config' }"
          @click="activeTab = 'config'; selectedTemplate = null"
        >
          <i class="fas fa-sliders"></i> Configurar Hostinger / SMTP
        </button>
      </div>
    </div>

    <div v-if="selectedTenantId" class="email-manager-layout">
      
      <!-- MENU ESQUERDO (Sidebar interna) -->
      <div class="card sidebar-card">
        <div class="nav-pills">
          <button class="nav-pill" :class="{ 'active': activeTab === 'config' }" @click="activeTab = 'config'; selectedTemplate = null">
            <i class="fas fa-server"></i> API e Integração
          </button>

          <div class="bulk-toggle-box">
            <button class="btn-bulk enable" @click="toggleAllTemplates(true)" title="Habilitar todos os templates de e-mail">
              <i class="fas fa-check-circle"></i> Habilitar Todos
            </button>
            <button class="btn-bulk disable" @click="toggleAllTemplates(false)" title="Desabilitar todos os templates de e-mail">
              <i class="fas fa-ban"></i> Desabilitar Todos
            </button>
          </div>

          <!-- Barra de Pesquisa de Templates -->
          <div class="template-search-box">
            <i class="fas fa-magnifying-glass"></i>
            <input v-model="templateSearch" type="text" placeholder="Buscar template ou gatilho..." />
            <button v-if="templateSearch" class="clear-search-btn" @click="templateSearch = ''" title="Limpar busca">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="divider"></div>

          <!-- Lista de Templates com Scroll Vertical Dedicado -->
          <div class="templates-scroll-list">
            <p class="section-title"><i class="fas fa-cubes text-gold" style="margin-right:6px"></i>E-MAILS DO SISTEMA ({{ filteredSystemTemplates.length }})</p>
            <div 
              v-for="t in filteredSystemTemplates" 
              :key="t.id" 
              class="nav-pill template-pill" 
              :class="{ 'active': activeTab === 'templates' && selectedTemplate?.id === t.id }"
              @click="selectTemplate(t)"
            >
              <div class="pill-content">
                <span class="pill-name">{{ t.name }}</span>
                <span class="pill-trigger">{{ t.trigger }}</span>
              </div>
              <span :class="['status-dot', t.enabled ? 'dot-active' : 'dot-inactive']" :title="t.enabled ? 'Template Ativo' : 'Template Inativo'"></span>
            </div>
            <div v-if="filteredSystemTemplates.length === 0" class="no-templates-found">
              Nenhum template encontrado
            </div>

            <div class="divider"></div>
            <p class="section-title"><i class="fas fa-user-gear text-gold" style="margin-right:6px"></i>E-MAILS DO USUÁRIO ({{ filteredUserTemplates.length }})</p>
            <div 
              v-for="t in filteredUserTemplates" 
              :key="t.id" 
              class="nav-pill template-pill" 
              :class="{ 'active': activeTab === 'templates' && selectedTemplate?.id === t.id }"
              @click="selectTemplate(t)"
            >
              <div class="pill-content">
                <span class="pill-name">{{ t.name }}</span>
                <span class="pill-trigger">{{ t.trigger }}</span>
              </div>
              <span :class="['status-dot', t.enabled ? 'dot-active' : 'dot-inactive']" :title="t.enabled ? 'Template Ativo' : 'Template Inativo'"></span>
            </div>
            <div v-if="filteredUserTemplates.length === 0" class="no-templates-found">
              Nenhum template encontrado
            </div>
          </div>
        </div>
      </div>

      <!-- ÁREA PRINCIPAL (Editor / Config) -->
      <div class="main-area">
        
        <!-- ABA CONFIG -->
        <div v-if="activeTab === 'config'" class="card config-card">
          <div class="card-header-styled">
            <div class="icon-circle"><i class="fas fa-envelope-circle-check"></i></div>
            <div class="header-text">
              <h2>Integração Hostinger Mail</h2>
              <p>Credenciais de disparo para este Tenant</p>
            </div>
          </div>

          <div class="config-grid">
            <div class="form-field">
              <label class="form-label">HOSTINGER API TOKEN</label>
              <input v-model="emailConfig.apiToken" type="password" class="modern-input" placeholder="Cole o token gerado na Hostinger" />
            </div>
            
            <div class="form-field">
              <label class="form-label">MAILBOX ID</label>
              <div class="input-with-button">
                <input v-model="emailConfig.mailboxId" type="text" class="modern-input" placeholder="Ex: AC49d0902364..." />
                <button class="btn-action-icon" @click="fetchHostingerMailboxes" :disabled="!emailConfig.apiToken" title="Buscar caixas de e-mail">
                  <i class="fas fa-search"></i>
                </button>
              </div>
              <small class="help-text">Clique na lupa para auto-preencher usando o Token acima.</small>
            </div>

            <div class="form-field">
              <label class="form-label">E-MAIL DO REMETENTE (FROM)</label>
              <input v-model="emailConfig.fromEmail" type="email" class="modern-input" placeholder="ex: contato@dominio.com" />
            </div>

            <div class="form-field">
              <label class="form-label">NOME DO REMETENTE</label>
              <input v-model="emailConfig.fromName" type="text" class="modern-input" placeholder="Ex: Equipe Korvyan" />
            </div>
          </div>

          <div class="config-actions">
            <button class="btn btn-primary btn-lg" @click="saveEmailConfig">
              <i class="fas fa-floppy-disk"></i> Salvar Integração
            </button>
          </div>
        </div>

        <!-- ABA TEMPLATES (Editor) -->
        <div v-if="activeTab === 'templates' && selectedTemplate" class="card editor-card">
          <div class="card-header-styled">
            <div class="icon-circle bg-purple"><i class="fas fa-pen-nib"></i></div>
            <div class="header-text">
              <div style="display:flex; align-items:center; gap:8px;">
                <h2>{{ selectedTemplate.name }}</h2>
                <span :class="['badge-category', selectedTemplate.category === 'usuario' ? 'badge-user' : 'badge-system']">
                  {{ selectedTemplate.category === 'usuario' ? 'NOTIFICAÇÃO DO USUÁRIO' : 'SISTEMA' }}
                </span>
              </div>
              <p>Gatilho: {{ selectedTemplate.trigger }}</p>
              <small v-if="selectedTemplate.category === 'usuario' && selectedTemplate.preferenceKey" style="color:var(--text-muted); font-size:0.75rem; display:block; margin-top:2px;">
                <i class="fas fa-sliders text-gold"></i> Vinculado à preferência de notificação do usuário ({{ selectedTemplate.preferenceKey }})
              </small>
            </div>
            
            <!-- Toggle Ativo -->
            <div class="status-toggle">
              <span class="status-label">Status:</span>
              <label class="switch">
                <input type="checkbox" v-model="selectedTemplate.enabled">
                <span class="slider round"></span>
              </label>
              <span class="status-text" :class="selectedTemplate.enabled ? 'text-success' : 'text-muted'">
                {{ selectedTemplate.enabled ? 'ATIVO' : 'INATIVO' }}
              </span>
            </div>
          </div>

          <div class="editor-body">
            <div class="form-field mb-4">
              <label class="form-label">ASSUNTO DO E-MAIL</label>
              <input v-model="selectedTemplate.subject" type="text" class="modern-input" placeholder="Insira o assunto da mensagem..." />
            </div>

            <div class="form-field">
              <div class="editor-header">
                <div class="editor-tabs">
                  <button class="tab-btn" :class="{active: !showPreview}" @click="showPreview = false">
                    <i class="fas fa-code"></i> HTML
                  </button>
                  <button class="tab-btn" :class="{active: showPreview}" @click="showPreview = true">
                    <i class="fas fa-eye"></i> Visualizar (Preview)
                  </button>
                </div>
                <div class="variables-badge">
                  <span v-for="v in selectedTemplate.vars" :key="v" class="var-tag">{{ v }}</span>
                </div>
              </div>
              <textarea v-if="!showPreview" v-model="selectedTemplate.html" class="modern-textarea code-font"></textarea>
              <div v-else class="modern-textarea preview-box" v-html="previewHtml"></div>
            </div>
          </div>

          <div class="editor-actions">
            <button class="btn btn-outline" @click="testEmailModal = true">
              <i class="fas fa-paper-plane"></i> Testar
            </button>
            <button class="btn btn-primary" @click="saveTemplate">
              <i class="fas fa-check"></i> Salvar Template
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'templates' && !selectedTemplate" class="empty-state">
          <i class="fas fa-envelope-open-text empty-icon"></i>
          <h3>Nenhum Template Selecionado</h3>
          <p>Selecione um template no menu lateral para editar.</p>
        </div>

      </div>
    </div>

    <!-- Modal de Teste (mantido igual, apenas estilizado) -->
    <div v-if="testEmailModal" class="modal-overlay" @click.self="testEmailModal = false">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Testar Disparo</h3>
          <button class="close-btn" @click="testEmailModal = false"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding: 1.5rem 0;">
          <div class="form-field">
            <label class="form-label">E-MAIL DE DESTINO</label>
            <input v-model="testEmailAddress" type="email" class="modern-input" placeholder="seu@email.com" />
          </div>
          <button class="btn btn-primary btn-block" style="margin-top: 1.5rem;" @click="sendTest">
            <i class="fas fa-paper-plane"></i> Enviar Teste
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  sendEmailViaWorker,
  getEmailSettingsViaWorker,
  saveEmailSettingsViaWorker,
  getEmailTemplatesViaWorker,
  saveEmailTemplateViaWorker,
} from '@/services/workers.service'
import { useToast } from '@/composables/useToast'
import { getAllTenants, type TenantConfig } from '@/services/tenant.service'

const { success: toastSuccess, error: toastError } = useToast()

const tenants = ref<TenantConfig[]>([])
const selectedTenantId = ref('')
const tenantSearch = ref('')
const activeTab = ref<'config' | 'templates'>('config')

const filteredTenants = computed(() => {
  if (!tenantSearch.value) return tenants.value
  const q = tenantSearch.value.toLowerCase()
  return tenants.value.filter(t => 
    (t.name || '').toLowerCase().includes(q) || 
    (t.tenant_prefix || '').toLowerCase().includes(q)
  )
})

const currentTenant = computed(() => {
  return tenants.value.find(t => t.tenant_prefix === selectedTenantId.value)
})

async function selectTenant(prefix: string) {
  selectedTenantId.value = prefix
  await onTenantChange()
}

const emailConfig = ref({
  apiToken: '',
  mailboxId: '',
  fromEmail: '',
  fromName: ''
})

import { defaultTemplates, type EmailTemplate } from '@/data/emailTemplates.data'

const templates = ref<EmailTemplate[]>([])
const selectedTemplate = ref<EmailTemplate | null>(null)
const templateSearch = ref('')

const systemTemplates = computed(() => templates.value.filter(t => t.category === 'sistema' || !t.category))
const userTemplates = computed(() => templates.value.filter(t => t.category === 'usuario'))

const filteredSystemTemplates = computed(() => {
  const q = templateSearch.value.trim().toLowerCase()
  if (!q) return systemTemplates.value
  return systemTemplates.value.filter(t => 
    t.name.toLowerCase().includes(q) || 
    (t.trigger && t.trigger.toLowerCase().includes(q)) ||
    (t.subject && t.subject.toLowerCase().includes(q))
  )
})

const filteredUserTemplates = computed(() => {
  const q = templateSearch.value.trim().toLowerCase()
  if (!q) return userTemplates.value
  return userTemplates.value.filter(t => 
    t.name.toLowerCase().includes(q) || 
    (t.trigger && t.trigger.toLowerCase().includes(q)) ||
    (t.subject && t.subject.toLowerCase().includes(q))
  )
})

const showPreview = ref(false)
const previewHtml = computed(() => {
  if (!selectedTemplate.value) return ''
  let html = selectedTemplate.value.html || ''
  if (selectedTemplate.value.vars) {
    selectedTemplate.value.vars.forEach(v => {
      const clean = v.replace(/[{}]/g, '').trim()
      // Estiliza a variável para ficar bem visível no preview
      html = html.replace(new RegExp(`{{\\s*${clean}\\s*}}`, 'g'), 
        `<span style="background: #fde047; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: monospace;">[${clean.toUpperCase()}]</span>`
      )
    })
  }
  return html
})

const testEmailModal = ref(false)
const testEmailAddress = ref('')

onMounted(async () => {
  try {
    tenants.value = await getAllTenants()
    if (tenants.value.length > 0 && !selectedTenantId.value) {
      selectedTenantId.value = tenants.value[0].tenant_prefix
      await onTenantChange()
    }
  } catch(err) {
    console.error(err)
    toastError('Erro ao carregar tenants.')
  }
})

function selectTemplate(t: EmailTemplate) {
  activeTab.value = 'templates'
  selectedTemplate.value = { ...t }
}

async function onTenantChange() {
  if (!selectedTenantId.value) return
  activeTab.value = 'config'
  selectedTemplate.value = null
  
  try {
    const config = await getEmailSettingsViaWorker(selectedTenantId.value)
    emailConfig.value = config || { apiToken: '', mailboxId: '', fromEmail: '', fromName: '' }

    const loadedTemplates = await getEmailTemplatesViaWorker(selectedTenantId.value) || []
    templates.value = defaultTemplates.map(dt => {
      const existing = loadedTemplates.find((lt: any) => lt.id === dt.id)
      return existing ? { ...dt, ...existing } : dt
    })
  } catch (err: any) {
    emailConfig.value = { apiToken: '', mailboxId: '', fromEmail: '', fromName: '' }
  }
}

async function saveEmailConfig() {
  if (!selectedTenantId.value) return
  try {
    await saveEmailSettingsViaWorker(emailConfig.value, selectedTenantId.value)
    toastSuccess('Configurações salvas no Tenant!')
  } catch(err: any) {
    toastError('Erro ao salvar config: ' + err.message)
  }
}

async function fetchHostingerMailboxes() {
  if (!emailConfig.value.apiToken) return
  try {
    const res = await fetch('https://api.mail.hostinger.com/api/v1/mailboxes', {
      headers: {
        'Authorization': `Bearer ${emailConfig.value.apiToken}`,
        'Accept': 'application/json'
      }
    })
    
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    
    const data = await res.json()
    const list = data.data || data.mailboxes || data
    
    if (Array.isArray(list) && list.length > 0) {
      const accounts = list.map((m: any) => `${m.address || m.name} (ID: ${m.id})`).join('\n')
      alert(`Caixas de e-mail encontradas:\n\n${accounts}\n\nCopie o ID desejado e cole no campo.`)
      if (!emailConfig.value.mailboxId) {
        emailConfig.value.mailboxId = list[0].id
      }
    } else {
      alert('Nenhuma caixa de e-mail encontrada ou formato desconhecido:\n' + JSON.stringify(data, null, 2))
    }
  } catch (err: any) {
    toastError('Erro ao buscar Mailboxes: ' + err.message)
  }
}

async function saveTemplate() {
  if (!selectedTenantId.value || !selectedTemplate.value) return
  try {
    await saveEmailTemplateViaWorker(selectedTemplate.value.id, selectedTemplate.value, selectedTenantId.value)
    const index = templates.value.findIndex(t => t.id === selectedTemplate.value!.id)
    if (index !== -1) {
      templates.value[index] = { ...selectedTemplate.value }
    }
    toastSuccess('Template atualizado para o Tenant!')
  } catch(err: any) {
    toastError('Erro ao salvar template: ' + err.message)
  }
}

async function toggleAllTemplates(enable: boolean) {
  if (!selectedTenantId.value) return
  try {
    templates.value = templates.value.map(t => ({ ...t, enabled: enable }))
    if (selectedTemplate.value) {
      selectedTemplate.value.enabled = enable
    }
    await Promise.all(
      templates.value.map(t => saveEmailTemplateViaWorker(t.id, t, selectedTenantId.value))
    )
    toastSuccess(enable ? 'Todos os templates foram habilitados com sucesso!' : 'Todos os templates foram desabilitados com sucesso!')
  } catch (err: any) {
    toastError('Erro ao atualizar templates: ' + err.message)
  }
}

async function sendTest() {
  if (!testEmailAddress.value) {
    toastError('Informe um e-mail válido.')
    return
  }
  try {
    let rawHtml = selectedTemplate.value?.html || ''
    // Substitui variáveis mockadas p/ teste visual
    if (selectedTemplate.value?.vars) {
      selectedTemplate.value.vars.forEach(v => {
        const cleanVar = v.replace(/[{}]/g, '').trim()
        rawHtml = rawHtml.replace(new RegExp(`{{\\s*${cleanVar}\\s*}}`, 'g'), `[${cleanVar.toUpperCase()}]`)
      })
    }

    const mailPayload: any = {
      subject: `[TESTE] ${selectedTemplate.value?.subject}`,
      html: rawHtml,
      _testConfig: { ...emailConfig.value }
    }
    await sendEmailViaWorker([testEmailAddress.value], mailPayload)
    toastSuccess('Email de teste disparado!')
    testEmailModal.value = false
    testEmailAddress.value = ''
  } catch(err: any) {
    toastError('Erro ao enviar email: ' + err.message)
  }
}
</script>

<style scoped>
.emails-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
.mb-4 { margin-bottom: 1.5rem; }
.mb-0 { margin-bottom: 0 !important; }

/* Tenant Selection Hub */
.tenant-selection-hub {
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
}
.hub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.hub-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hub-title-row h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.count-pill {
  background: var(--gold-dim);
  color: var(--gold);
  border: 1px solid var(--gold);
  border-radius: 10px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
}
.hub-sub {
  margin: 3px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.hub-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-bo, #0f172a);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 8px;
  padding: 6px 12px;
  min-width: 260px;
}
.hub-search-box i {
  color: var(--text-muted);
  font-size: 0.8rem;
}
.hub-search-box input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 0.82rem;
  width: 100%;
}

.tenants-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.tenant-card {
  background: var(--bg-bo, #0f172a);
  border: 1.5px solid var(--border-bo, #334155);
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tenant-card:hover {
  border-color: var(--gold);
  background: var(--gold-dim, rgba(212, 175, 55, 0.06));
  transform: translateY(-2px);
}
.tenant-card.active {
  border-color: var(--gold);
  background: var(--gold-dim, rgba(212, 175, 55, 0.12));
  box-shadow: 0 0 14px rgba(212, 175, 55, 0.25);
}
.tenant-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tenant-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.badge-selected {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--gold);
  display: flex;
  align-items: center;
  gap: 4px;
}
.tenant-slug {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: monospace;
}
.tenant-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tenant-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tenant-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 0.7rem;
}
.tenant-prefix-tag {
  color: var(--text-muted);
  font-family: monospace;
}
.hostinger-mini-status {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Hostinger Tenant Banner */
.hostinger-tenant-banner {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
  border: 1px solid var(--border-bo, #334155);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.banner-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}
.banner-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--gold-dim);
  border: 1px solid var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
  font-size: 1.25rem;
  flex-shrink: 0;
}
.banner-title-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.banner-title-line h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.badge-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.68rem;
  font-weight: 700;
}
.badge-status-pill.active {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.badge-status-pill.pending {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.3);
}
.banner-meta {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.dot-sep {
  margin: 0 6px;
  opacity: 0.5;
}
.mini-code {
  font-family: monospace;
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
}
.text-gold {
  color: var(--gold);
}

/* Layout Grid */
.email-manager-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; align-items: start; }
@media(max-width: 900px) { .email-manager-layout { grid-template-columns: 1fr; } }

/* Sidebar Nav */
.sidebar-card {
  padding: 1rem;
  border-radius: 12px;
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
}
.nav-pills { display: flex; flex-direction: column; gap: 4px; }
.nav-pill {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-radius: 8px; border: none; background: transparent;
  color: var(--text-secondary); cursor: pointer; transition: all 0.2s; font-size: 0.95rem; font-weight: 600;
}
.nav-pill:hover { background: var(--bg-input); color: var(--text-primary); }
.nav-pill.active { background: rgba(139, 92, 246, 0.1); color: var(--primary); }
.nav-pill i:not(.icon-right) { width: 20px; font-size: 1.1rem; }
.icon-right { font-size: 0.8rem; opacity: 0.5; }
.divider { height: 1px; background: var(--border-light); margin: 12px 0; }
.section-title { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); letter-spacing: 1px; padding: 0 16px; margin-bottom: 8px; }

/* Bulk Toggle Actions */
.bulk-toggle-box { display: flex; gap: 6px; padding: 8px 4px 4px; }
.btn-bulk {
  flex: 1; padding: 7px 6px; font-size: 0.72rem; font-weight: 700; border-radius: 6px;
  border: 1px solid var(--border); cursor: pointer; display: flex; align-items: center;
  justify-content: center; gap: 5px; transition: all 0.2s; background: var(--bg-surface);
}
.btn-bulk.enable { color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
.btn-bulk.enable:hover { background: rgba(16, 185, 129, 0.15); border-color: #10b981; }
.btn-bulk.disable { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
.btn-bulk.disable:hover { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; }

/* Template Search Box */
.template-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-input, rgba(0, 0, 0, 0.2));
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  padding: 7px 10px;
  margin: 4px 2px 0;
}
.template-search-box i {
  color: var(--text-muted);
  font-size: 0.75rem;
}
.template-search-box input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 0.8rem;
  width: 100%;
}
.clear-search-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
}
.clear-search-btn:hover {
  color: var(--text-primary);
}

/* Scroll Vertical Dedicado para os Templates */
.templates-scroll-list {
  max-height: 480px;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.templates-scroll-list::-webkit-scrollbar {
  width: 4px;
}
.templates-scroll-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 4px;
}
.templates-scroll-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
.templates-scroll-list::-webkit-scrollbar-thumb:hover {
  background: var(--gold, #d4af37);
}

.no-templates-found {
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 10px 16px;
  font-style: italic;
  text-align: center;
}

/* Template Pills */
.template-pill { display: flex; align-items: center; padding: 12px 16px; text-align: left; }
.pill-content { display: flex; flex-direction: column; gap: 2px; }
.pill-name { font-size: 0.9rem; font-weight: 700; }
.pill-trigger { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
.template-pill.active .pill-trigger { color: var(--primary); opacity: 0.8; }

/* Status Dot e Badges */
.status-dot { width: 9px; height: 9px; border-radius: 50%; margin-left: auto; flex-shrink: 0; }
.dot-active { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.6); }
.dot-inactive { background: #6b7280; opacity: 0.45; }

.badge-category { font-size: 0.65rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-system { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
.badge-user { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }

/* Main Area Cards */
.card-header-styled {
  display: flex; align-items: center; gap: 1rem; padding: 1.5rem;
  border-bottom: 1px solid var(--border-light); background: rgba(0,0,0,0.02);
}
.icon-circle {
  width: 48px; height: 48px; border-radius: 50%; background: rgba(139, 92, 246, 0.15);
  color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
}
.bg-purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #fff; }
.header-text h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
.header-text p { margin: 4px 0 0; font-size: 0.85rem; color: var(--text-muted); }

/* Inputs Modernos */
.modern-input {
  width: 100%; padding: 12px 14px; border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem; transition: 0.2s;
}
.modern-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15); outline: none; }
.modern-textarea {
  width: 100%; height: 420px; padding: 16px; border: 1px solid var(--border); border-radius: 8px;
  background: #1e1e1e; color: #d4d4d4; font-size: 0.9rem; line-height: 1.5; resize: vertical;
}
.modern-textarea:focus { border-color: var(--primary); outline: none; }
.code-font { font-family: 'Fira Code', 'Consolas', monospace; }

.preview-box { background: #080c14; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, sans-serif; overflow-y: auto; padding: 12px; }
.editor-tabs { display: flex; gap: 8px; }
.tab-btn { background: transparent; border: none; color: var(--text-muted); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: 0.2s; }
.tab-btn:hover { background: rgba(255,255,255,0.05); }
.tab-btn.active { background: rgba(139, 92, 246, 0.15); color: var(--primary); }

/* Custom Form elements */
.config-grid { padding: 1.5rem; display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
.input-with-button { display: flex; gap: 8px; }
.btn-action-icon {
  width: 48px; display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--primary); background: rgba(139, 92, 246, 0.1); color: var(--primary);
  border-radius: 8px; cursor: pointer; transition: 0.2s;
}
.btn-action-icon:hover:not(:disabled) { background: var(--primary); color: #fff; }
.btn-action-icon:disabled { opacity: 0.5; cursor: not-allowed; border-color: var(--border); color: var(--text-muted); background: var(--bg-input); }
.help-text { display: block; margin-top: 6px; font-size: 0.75rem; color: var(--text-muted); }

/* Actions Footer */
.config-actions, .editor-actions {
  padding: 1.5rem; border-top: 1px solid var(--border-light); background: rgba(0,0,0,0.02);
  display: flex; justify-content: flex-end; gap: 1rem; border-radius: 0 0 12px 12px;
}
.btn-lg { padding: 12px 24px; font-size: 1rem; }
.btn-block { width: 100%; display: flex; justify-content: center; }

/* Editor Specific */
.editor-body { padding: 1.5rem; }
.editor-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
.variables-badge { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.var-tag { background: rgba(139, 92, 246, 0.1); color: var(--primary); padding: 2px 8px; border-radius: 4px; font-family: monospace; font-weight: 600; }

/* Toggle Switch */
.status-toggle { margin-left: auto; display: flex; align-items: center; gap: 10px; background: var(--bg-surface); padding: 8px 16px; border-radius: 30px; border: 1px solid var(--border-light); }
.status-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
.status-text { font-size: 0.8rem; font-weight: 800; min-width: 55px; }
.text-success { color: #10b981; }

.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border); transition: .4s; border-radius: 34px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: #10b981; }
input:checked + .slider:before { transform: translateX(20px); }

/* Empty State */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 12px; background: rgba(0,0,0,0.01); }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
.empty-state h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }

.btn { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; border-radius: 8px; cursor: pointer; border: none; padding: 10px 20px; transition: 0.2s; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { filter: brightness(1.1); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-primary); }
.btn-outline:hover { background: var(--bg-input); }
</style>
