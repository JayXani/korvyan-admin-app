<template>
  <div class="emails-container">
    <div class="bo-page-header">
      <div class="header-content">
        <h1>Configuração e Templates de Email</h1>
        <p>Gerencie as integrações e disparos transacionais para cada Tenant</p>
      </div>
    </div>

    <!-- Seletor de Tenant -->
    <div class="card tenant-selector-card mb-4">
      <div class="form-field" style="max-width: 700px; margin: 0 auto;">
        <label class="form-label" style="text-align: center; display: block; font-size: 0.9rem;">SELECIONE O TENANT (CLIENTE)</label>
        <div class="select-wrapper">
          <select v-model="selectedTenantId" class="filter-select tenant-select" @change="onTenantChange">
            <option value="" disabled>-- Clique para selecionar um Tenant --</option>
            <option v-for="t in tenants" :key="t.tenant_prefix" :value="t.tenant_prefix">
              {{ t.name || t.tenant_prefix }} ({{ t.tenant_prefix }})
            </option>
          </select>
          <i class="fas fa-chevron-down select-icon"></i>
        </div>
      </div>
    </div>

    <div v-if="selectedTenantId" class="email-manager-layout">
      
      <!-- MENU ESQUERDO (Sidebar interna) -->
      <div class="card sidebar-card">
        <div class="nav-pills">
          <button class="nav-pill" :class="{ 'active': activeTab === 'config' }" @click="activeTab = 'config'; selectedTemplate = null">
            <i class="fas fa-server"></i> API e Integração
          </button>
          <div class="divider"></div>
          <p class="section-title">TEMPLATES DE E-MAIL</p>
          <div 
            v-for="t in templates" 
            :key="t.id" 
            class="nav-pill template-pill" 
            :class="{ 'active': activeTab === 'templates' && selectedTemplate?.id === t.id }"
            @click="selectTemplate(t)"
          >
            <div class="pill-content">
              <span class="pill-name">{{ t.name }}</span>
              <span class="pill-trigger">{{ t.trigger }}</span>
            </div>
            <i class="fas fa-chevron-right icon-right"></i>
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
              <h2>{{ selectedTemplate.name }}</h2>
              <p>Gatilho: {{ selectedTemplate.trigger }}</p>
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
const activeTab = ref<'config' | 'templates'>('config')

const emailConfig = ref({
  apiToken: '',
  mailboxId: '',
  fromEmail: '',
  fromName: ''
})

interface EmailTemplate {
  id: string
  name: string
  subject: string
  trigger: string
  html: string
  vars: string[]
  enabled: boolean
}

// 10 Templates Iniciais
const defaultTemplates: EmailTemplate[] = [
  { 
    id: 'recuperar_senha', name: 'Recuperar Senha', subject: 'Instruções para redefinir sua senha', trigger: 'Manual/API', 
    vars: ['{{ name }}', '{{ link }}'], enabled: true,
    html: `<div style="text-align:center; padding: 20px;">\n  <h2>Olá, {{ name }}</h2>\n  <p>Recebemos uma solicitação para redefinir a sua senha.</p>\n  <a href="{{ link }}" style="display:inline-block; padding:10px 20px; background:#8b5cf6; color:#fff; text-decoration:none; border-radius:4px;">Redefinir Senha</a>\n</div>`
  },
  { 
    id: 'novo_acesso', name: 'Novo Acesso', subject: 'Bem-vindo ao portal Korvyan', trigger: 'Criação de Usuário',
    vars: ['{{ name }}', '{{ login }}', '{{ password }}'], enabled: true,
    html: `<div style="padding: 20px;">\n  <h2>Bem-vindo, {{ name }}!</h2>\n  <p>Sua conta foi criada com sucesso.</p>\n  <p><strong>Login:</strong> {{ login }}<br><strong>Senha temporária:</strong> {{ password }}</p>\n</div>`
  },
  { 
    id: 'fatura_gerada', name: 'Boleto/Fatura', subject: 'Seu boleto Korvyan chegou', trigger: 'Faturamento Mensal',
    vars: ['{{ name }}', '{{ amount }}', '{{ due_date }}', '{{ barcode }}'], enabled: true,
    html: `<div style="padding: 20px;">\n  <h2>Olá, {{ name }}</h2>\n  <p>Seu boleto no valor de <strong>R$ {{ amount }}</strong> com vencimento para <strong>{{ due_date }}</strong> está disponível.</p>\n  <p>Linha digitável: <code>{{ barcode }}</code></p>\n</div>`
  },
  { 
    id: 'fatura_atrasada', name: 'Cobrança Atrasada', subject: 'Aviso: Boleto em atraso', trigger: 'Rotina Inadimplência',
    vars: ['{{ name }}', '{{ amount }}', '{{ due_date }}', '{{ barcode }}', '{{ days_late }}'], enabled: true,
    html: `<div style="padding: 20px;">\n  <h2>Olá, {{ name }}</h2>\n  <p>Identificamos que a sua fatura de <strong>R$ {{ amount }}</strong> vencida em <strong>{{ due_date }}</strong> (há {{ days_late }} dias) ainda não consta como paga no nosso sistema.</p>\n  <p>Para regularizar, utilize a linha digitável: <code>{{ barcode }}</code></p>\n  <p>Caso já tenha efetuado o pagamento, desconsidere este e-mail.</p>\n</div>`
  },
  { 
    id: 'pagamento_confirmado', name: 'Pagamento Confirmado', subject: 'Recebemos o seu pagamento!', trigger: 'Baixa de Fatura',
    vars: ['{{ name }}', '{{ amount }}', '{{ ref_month }}'], enabled: true,
    html: `<div style="padding: 20px;">\n  <h2>Olá, {{ name }}</h2>\n  <p>Passando para confirmar que o pagamento no valor de <strong>R$ {{ amount }}</strong> referente a <strong>{{ ref_month }}</strong> foi processado com sucesso!</p>\n  <p>Agradecemos a sua parceria.</p>\n</div>`
  },
  { 
    id: 'boas_vindas', name: 'Boas-vindas', subject: 'Bem-vindo ao seu plano!', trigger: 'Contrato Assinado',
    vars: ['{{ name }}', '{{ plan_name }}'], enabled: true,
    html: `<div style="padding: 20px; text-align: center;">\n  <h2>Tudo pronto, {{ name }}!</h2>\n  <p>É com muita alegria que damos as boas-vindas. Seu plano <strong>{{ plan_name }}</strong> já está ativo e pronto para uso.</p>\n  <p>Se tiver qualquer dúvida, conte com nosso suporte!</p>\n</div>`
  },
  { 
    id: 'renovacao_contrato', name: 'Renovação de Contrato', subject: 'Seu contrato será renovado em breve', trigger: 'Expiração',
    vars: ['{{ name }}', '{{ plan_name }}', '{{ expiration_date }}'], enabled: true,
    html: `<div style="padding: 20px;">\n  <h2>Olá, {{ name }}</h2>\n  <p>O seu plano <strong>{{ plan_name }}</strong> vence no dia <strong>{{ expiration_date }}</strong> e está programado para renovação.</p>\n  <p>Se precisar fazer alguma alteração, entre em contato conosco.</p>\n</div>`
  },
  { 
    id: 'cancelamento_contrato', name: 'Cancelamento Confirmado', subject: 'Confirmação de Cancelamento', trigger: 'Churn',
    vars: ['{{ name }}', '{{ plan_name }}'], enabled: true,
    html: `<div style="padding: 20px;">\n  <h2>Olá, {{ name }}</h2>\n  <p>Confirmamos o cancelamento do plano <strong>{{ plan_name }}</strong>.</p>\n  <p>Lamentamos ver você partir, e nossas portas estarão sempre abertas caso decida voltar!</p>\n</div>`
  },
  { 
    id: 'novo_chamado', name: 'Novo Chamado de Suporte', subject: 'Recebemos seu chamado #{{ ticket_id }}', trigger: 'Ticket Aberto',
    vars: ['{{ name }}', '{{ ticket_id }}', '{{ title }}'], enabled: true,
    html: `<div style="padding: 20px;">\n  <h2>Olá, {{ name }}</h2>\n  <p>Seu chamado <strong>#{{ ticket_id }} - {{ title }}</strong> foi registrado com sucesso.</p>\n  <p>Nossa equipe já foi notificada e responderá o mais breve possível!</p>\n</div>`
  },
  { 
    id: 'atualizacao_chamado', name: 'Atualização no Chamado', subject: 'Atualização no chamado #{{ ticket_id }}', trigger: 'Ticket Respondido',
    vars: ['{{ name }}', '{{ ticket_id }}', '{{ status }}'], enabled: true,
    html: `<div style="padding: 20px;">\n  <h2>Olá, {{ name }}</h2>\n  <p>O seu chamado de suporte <strong>#{{ ticket_id }}</strong> teve uma nova atualização.</p>\n  <p>Status atual: <strong>{{ status }}</strong></p>\n  <p>Acesse o portal para conferir a resposta.</p>\n</div>`
  }
]

const templates = ref<EmailTemplate[]>([])
const selectedTemplate = ref<EmailTemplate | null>(null)

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
      return existing ? existing : dt
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

/* Selector */
.tenant-selector-card {
  background: linear-gradient(145deg, var(--bg-card), var(--bg-surface));
  padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-light);
}
.select-wrapper { position: relative; }
.tenant-select {
  width: 100%; padding: 10px 14px; font-size: 14px; font-weight: 500;
  border-radius: 8px; border: 2px solid var(--border-light);
  appearance: none; background: var(--bg-input); color: var(--text-primary); cursor: pointer;
  text-overflow: ellipsis; white-space: nowrap; overflow: hidden;
}
.tenant-select option { font-size: 14px; font-weight: normal; }
.tenant-select:focus { border-color: var(--primary); outline: none; }
.select-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-muted); }

/* Layout Grid */
.email-manager-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; align-items: start; }
@media(max-width: 900px) { .email-manager-layout { grid-template-columns: 1fr; } }

/* Sidebar Nav */
.sidebar-card { padding: 1rem; border-radius: 12px; }
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

/* Template Pills */
.template-pill { display: flex; align-items: center; padding: 12px 16px; text-align: left; }
.pill-content { display: flex; flex-direction: column; gap: 2px; }
.pill-name { font-size: 0.9rem; font-weight: 700; }
.pill-trigger { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
.template-pill.active .pill-trigger { color: var(--primary); opacity: 0.8; }

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
  width: 100%; height: 350px; padding: 16px; border: 1px solid var(--border); border-radius: 8px;
  background: #1e1e1e; color: #d4d4d4; font-size: 0.9rem; line-height: 1.5; resize: vertical;
}
.modern-textarea:focus { border-color: var(--primary); outline: none; }
.code-font { font-family: 'Fira Code', 'Consolas', monospace; }

.preview-box { background: #fff; color: #333; font-family: sans-serif; overflow-y: auto; }
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
