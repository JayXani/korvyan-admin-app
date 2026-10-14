<template>
  <div class="central-comunicados-card">
    <div class="comm-top-bar">
      <div class="comm-title-row">
        <div class="comm-icon-box">
          <i class="fas fa-bullhorn text-gold"></i>
        </div>
        <div>
          <div class="comm-title-badges">
            <h2 class="section-title">Central de Comunicados & Release Notes</h2>
            <span class="badge" :class="selectedEnv === 'prod' ? 'badge-gold' : selectedEnv === 'beta' ? 'badge-info' : 'badge-muted'">
              {{ selectedEnv === 'prod' ? 'PRODUÇÃO' : selectedEnv === 'beta' ? 'BETA' : 'DEV' }}
            </span>
            <span class="badge-sub-pill">{{ activeTemplateType === 'internal' ? 'Deploy Interno' : 'Changelog Clientes' }}</span>
          </div>
          <p class="section-sub">
            Gere e envie comunicados técnicos internos para a equipe ou notas de atualização (changelog) amigáveis para clientes.
          </p>
        </div>
      </div>

      <div class="comm-type-toggle">
        <button 
          type="button" 
          class="tpl-btn" 
          :class="{ active: activeTemplateType === 'internal' }"
          @click="activeTemplateType = 'internal'"
        >
          <i class="fas fa-code-merge"></i> Interno (DevOps)
        </button>
        <button 
          type="button" 
          class="tpl-btn client" 
          :class="{ active: activeTemplateType === 'client' }"
          @click="activeTemplateType = 'client'"
        >
          <i class="fas fa-sparkles"></i> Clientes (Changelog)
        </button>
      </div>
    </div>

    <!-- Grid: Formulário + Preview -->
    <div class="comm-grid">
      <!-- Coluna 1: Edição do Template & Destinatários -->
      <div class="comm-form-col">
        <!-- 1. Campos Específicos para Deploy Interno -->
        <div v-if="activeTemplateType === 'internal'" class="template-section">
          <h4 class="form-subheading">Informações da Implantação</h4>

          <div class="form-row-2">
            <div class="form-group">
              <label>VERSÃO / TAG</label>
              <input v-model="internalForm.version" type="text" class="form-input" placeholder="ex: v2.4.0" />
            </div>
            <div class="form-group">
              <label>RESPONSÁVEL</label>
              <input v-model="internalForm.author" type="text" class="form-input" placeholder="ex: Time DevOps" />
            </div>
          </div>

          <div class="form-group">
            <label>ASSUNTO DO E-MAIL</label>
            <input v-model="internalForm.subject" type="text" class="form-input" placeholder="Assunto da notificação técnica" />
          </div>

          <div class="form-group">
            <label>SERVIÇOS IMPACTADOS</label>
            <div class="services-checkbox-grid">
              <label v-for="srv in serviceOptions" :key="srv.id" class="service-checkbox-pill">
                <input 
                  type="checkbox" 
                  :value="srv.name" 
                  v-model="internalForm.services"
                />
                <span>{{ srv.name }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>COMMITS PRINCIPAIS (1 por linha)</label>
            <textarea 
              v-model="internalForm.commits" 
              class="form-input" 
              rows="4" 
              placeholder="- feat: nova funcionalidade&#10;- fix: correção de bug"
            ></textarea>
          </div>

          <div class="form-group">
            <label>NOTAS TÉCNICAS / OBSERVAÇÕES</label>
            <input v-model="internalForm.notes" type="text" class="form-input" placeholder="ex: Migrações aplicadas sem downtime." />
          </div>
        </div>

        <!-- 2. Campos Específicos para Changelog Clientes -->
        <div v-else class="template-section">
          <h4 class="form-subheading">Comunicado de Atualização de Produto</h4>

          <div class="form-row-2">
            <div class="form-group">
              <label>TÍTULO DA RELEASE</label>
              <input v-model="clientForm.releaseTitle" type="text" class="form-input" placeholder="ex: Novidades do Sistema" />
            </div>
            <div class="form-group">
              <label>VERSÃO AMIGÁVEL</label>
              <input v-model="clientForm.version" type="text" class="form-input" placeholder="ex: 2.4 (Outubro/2026)" />
            </div>
          </div>

          <div class="form-group">
            <label>ASSUNTO DO E-MAIL</label>
            <input v-model="clientForm.subject" type="text" class="form-input" placeholder="Assunto chamativo e amigável" />
          </div>

          <div class="form-group">
            <label>NOVAS FUNCIONALIDADES (1 por linha)</label>
            <textarea 
              v-model="clientForm.features" 
              class="form-input" 
              rows="3" 
              placeholder="• Novo módulo de emissão de carnês&#10;• Painel financeiro em tempo real"
            ></textarea>
          </div>

          <div class="form-group">
            <label>MELHORIAS & CORREÇÕES (1 por linha)</label>
            <textarea 
              v-model="clientForm.fixes" 
              class="form-input" 
              rows="3" 
              placeholder="• Maior rapidez na consulta de contratos&#10;• Otimização para dispositivos móveis"
            ></textarea>
          </div>

          <div class="form-group">
            <label>MENSAGEM DE RODAPÉ</label>
            <input v-model="clientForm.footerText" type="text" class="form-input" placeholder="Mensagem cordial da equipe" />
          </div>
        </div>

        <!-- 3. Seção de Destinatários & Ações de Disparo -->
        <div class="recipients-section">
          <div class="recipients-header">
            <label class="mb-0">
              <i class="fas fa-users-gear text-gold"></i>
              DESTINATÁRIOS ({{ parsedRecipients.length }})
            </label>
            <div class="recipients-presets">
              <button 
                type="button" 
                class="preset-chip" 
                @click="addInternalPreset"
                title="Adicionar e-mails da equipe técnica"
              >
                + Time DevOps
              </button>
              <button 
                type="button" 
                class="preset-chip" 
                @click="addBetaClientsPreset"
                title="Adicionar clientes piloto beta"
              >
                + Clientes Beta
              </button>
              <button 
                type="button" 
                class="preset-chip gold" 
                :disabled="loadingTenantEmails"
                @click="addTenantEmailsPreset"
                title="Buscar e-mails de todos os tenants cadastrados"
              >
                <i v-if="loadingTenantEmails" class="fas fa-spinner fa-spin"></i>
                <span v-else>+ Todos os Tenants</span>
              </button>
            </div>
          </div>

          <textarea 
            v-model="rawRecipients" 
            class="form-input recipients-textarea" 
            rows="3" 
            placeholder="Digite os e-mails separados por vírgula, espaço ou quebra de linha..."
          ></textarea>

          <div class="recipients-tools">
            <div class="tools-left">
              <input 
                type="file" 
                ref="fileInputRef" 
                accept=".csv, .txt, .xlsx, .xls" 
                style="display: none;" 
                @change="handleImportSheet"
              />
              <button type="button" class="tool-btn" @click="triggerFileInput" title="Importar lista de arquivo">
                <i class="fas fa-file-arrow-up"></i> Importar Planilha (CSV/TXT)
              </button>
              <button 
                type="button" 
                class="tool-btn" 
                :disabled="parsedRecipients.length === 0" 
                @click="exportRecipientsCsv"
                title="Baixar lista em CSV"
              >
                <i class="fas fa-file-arrow-down"></i> Exportar Lista
              </button>
            </div>
            <button 
              type="button" 
              class="tool-btn danger" 
              v-if="rawRecipients" 
              @click="rawRecipients = ''"
            >
              <i class="fas fa-trash-can"></i> Limpar
            </button>
          </div>

          <button 
            type="button" 
            class="btn btn-master btn-lg w-100 send-comm-btn" 
            :disabled="sendingCommEmail || parsedRecipients.length === 0"
            @click="handleSendCommunication"
          >
            <i :class="sendingCommEmail ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'"></i>
            <span>{{ sendingCommEmail ? 'Enviando Comunicado...' : `Disparar Comunicado (${parsedRecipients.length} destinatários)` }}</span>
          </button>
        </div>

      </div>

      <!-- Coluna 2: Pré-visualização do E-mail (Preview) -->
      <div class="comm-preview-col">
        <div class="preview-header">
          <div class="preview-title">
            <i class="fas fa-eye text-gold"></i>
            <strong>Pré-visualização do E-mail</strong>
          </div>
          <span class="preview-tag">
            {{ activeTemplateType === 'internal' ? 'TEMPLATE INTERNO' : 'CHANGELOG CLIENTE' }}
          </span>
        </div>

        <div class="email-preview-wrapper" v-html="renderedEmailHtml"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { sendEmail } from '@/services/mail.service'
import { getTenantEmailsViaWorker } from '@/services/workers.service'

const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()

const props = withDefaults(defineProps<{
  env?: 'prod' | 'beta' | 'dev'
}>(), {
  env: 'prod'
})

const selectedEnv = computed(() => props.env)
const activeTemplateType = ref<'internal' | 'client'>('internal')
const sendingCommEmail = ref(false)
const rawRecipients = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const loadingTenantEmails = ref(false)

const serviceOptions = [
  { id: 'backend', name: 'Backend API' },
  { id: 'front', name: 'Frontend' },
  { id: 'workers', name: 'Workers' },
  { id: 'admin-app', name: 'Admin App' },
]

const internalForm = reactive({
  version: 'v2.4.0',
  author: 'DevOps Team',
  subject: '[Deploy] Notificação Técnica de Atualização',
  services: ['Backend API', 'Frontend'],
  commits: '- feat: novas funcionalidades no portal\n- fix: correções na sincronização\n- refactor: melhoria na performance',
  notes: 'Serviços atualizados e validados com sucesso.',
})

const clientForm = reactive({
  releaseTitle: 'Novidades & Melhorias na Plataforma',
  version: 'v2.4',
  subject: '🎉 Novidades e Atualizações no Sistema Korvyan',
  features: '• Novo layout otimizado e mais rápido\n• Suporte completo a customização de branding\n• Central de notificações em tempo real',
  fixes: '• Maior estabilidade na emissão e buscas\n• Correções gerais de usabilidade',
  footerText: 'Nossa equipe continua trabalhando diariamente para oferecer a melhor experiência para sua operação.',
})

const parsedRecipients = computed(() => {
  if (!rawRecipients.value) return []
  return rawRecipients.value
    .split(/[\n,;]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0 && e.includes('@'))
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleImportSheet(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || !target.files[0]) return
  const file = target.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = (e.target?.result as string) || ''
    const foundEmails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
    if (foundEmails.length === 0) {
      toastError('Nenhum endereço de e-mail válido foi encontrado no arquivo.')
      return
    }
    const current = parsedRecipients.value
    const combined = Array.from(new Set([...current, ...foundEmails.map(x => x.toLowerCase())]))
    rawRecipients.value = combined.join(', ')
    toastSuccess(`${foundEmails.length} e-mail(s) importado(s) da planilha com sucesso!`)
  }
  reader.readAsText(file)
}

function exportRecipientsCsv() {
  if (parsedRecipients.value.length === 0) return
  const csvContent = 'data:text/csv;charset=utf-8,Email\n' + parsedRecipients.value.join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `destinatarios_changelog_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toastSuccess('Planilha CSV exportada com sucesso!')
}

function addInternalPreset() {
  const team = ['devops@korvyan.com', 'luan@korvyan.com', 'danilo@deskmanager.com.br']
  const current = parsedRecipients.value
  const combined = Array.from(new Set([...current, ...team]))
  rawRecipients.value = combined.join(', ')
}

function addBetaClientsPreset() {
  const pilots = ['piloto1@korvyan.com', 'beta-tester@empresa.com.br']
  const current = parsedRecipients.value
  const combined = Array.from(new Set([...current, ...pilots]))
  rawRecipients.value = combined.join(', ')
}

async function addTenantEmailsPreset() {
  loadingTenantEmails.value = true
  try {
    const emails = await getTenantEmailsViaWorker()
    if (!emails || emails.length === 0) {
      toastInfo('Nenhum e-mail de tenant cadastrado no momento.')
      return
    }
    const current = parsedRecipients.value
    const combined = Array.from(new Set([...current, ...emails.map(e => e.toLowerCase())]))
    rawRecipients.value = combined.join(', ')
    toastSuccess(`${emails.length} e-mail(s) de tenants adicionados com sucesso!`)
  } catch (err: any) {
    toastError('Erro ao buscar e-mails dos tenants: ' + (err.message || err))
  } finally {
    loadingTenantEmails.value = false
  }
}

const renderedEmailHtml = computed(() => {
  if (activeTemplateType.value === 'internal') {
    const srvList = (internalForm.services || []).map(s => `<li style="margin-bottom: 4px;"><strong>${s}</strong></li>`).join('')
    const commitList = (internalForm.commits || '')
      .split('\n')
      .filter(c => c.trim())
      .map(c => `<li style="margin-bottom: 4px; font-family: monospace;">${c}</li>`)
      .join('')

    return `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
        <div style="border-bottom: 2px solid #d4af37; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="color: #d4af37; margin: 0 0 6px 0;">[DEPLOY] Notificação Técnica de Implantação</h2>
          <span style="font-size: 13px; color: #94a3b8;">Ambiente: <strong>${selectedEnv.value.toUpperCase()}</strong> | Versão: <strong>${internalForm.version || ''}</strong></span>
        </div>
        <p style="margin: 0 0 12px 0;">Olá time,</p>
        <p style="margin: 0 0 16px 0;">Um novo deploy foi executado com sucesso por <strong>${internalForm.author || ''}</strong>.</p>
        <h4 style="color: #60a5fa; margin: 16px 0 8px 0; text-transform: uppercase; font-size: 13px;">Serviços Atualizados:</h4>
        <ul style="padding-left: 20px; margin: 0 0 16px 0; color: #cbd5e1;">${srvList || '<li>Nenhum serviço selecionado</li>'}</ul>
        <h4 style="color: #60a5fa; margin: 16px 0 8px 0; text-transform: uppercase; font-size: 13px;">Principais Alterações Técnicas:</h4>
        <ul style="padding-left: 20px; margin: 0 0 16px 0; color: #e2e8f0;">${commitList || '<li>Sem notas de commits</li>'}</ul>
        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-left: 3px solid #d4af37; margin-top: 16px; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #cbd5e1;"><strong>Observações:</strong> ${internalForm.notes || 'Operação finalizada sem anomalias.'}</p>
        </div>
      </div>
    `
  } else {
    const featList = (clientForm.features || '')
      .split('\n')
      .filter(f => f.trim())
      .map(f => `<li style="margin-bottom: 6px;">${f}</li>`)
      .join('')

    const fixList = (clientForm.fixes || '')
      .split('\n')
      .filter(f => f.trim())
      .map(f => `<li style="margin-bottom: 6px;">${f}</li>`)
      .join('')

    return `
      <div style="font-family: Arial, sans-serif; background-color: #ffffff; color: #1e293b; padding: 28px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0 0 6px 0;">${clientForm.releaseTitle || ''}</h2>
          <span style="display: inline-block; background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">Versão ${clientForm.version || ''}</span>
        </div>
        <p style="font-size: 15px; line-height: 1.5; color: #334155;">Prezado cliente,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Temos o prazer de anunciar uma nova atualização com recursos e otimizações desenvolvidos para melhorar sua rotina.
        </p>
        <div style="margin: 20px 0;">
          <h3 style="color: #10b981; font-size: 15px; margin: 0 0 10px 0;">✨ O que há de novo:</h3>
          <ul style="padding-left: 20px; margin: 0 0 16px 0; color: #334155; line-height: 1.6;">${featList || '<li>Diversas melhorias na plataforma.</li>'}</ul>
        </div>
        <div style="margin: 20px 0;">
          <h3 style="color: #3b82f6; font-size: 15px; margin: 0 0 10px 0;">⚡ Otimizações & Melhorias:</h3>
          <ul style="padding-left: 20px; margin: 0 0 16px 0; color: #334155; line-height: 1.6;">${fixList || '<li>Aprimoramentos de segurança e estabilidade.</li>'}</ul>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 13px; color: #64748b;">
          <p style="margin: 0 0 6px 0;">${clientForm.footerText || ''}</p>
          <p style="margin: 0; font-weight: bold; color: #0f172a;">Equipe Korvyan</p>
        </div>
      </div>
    `
  }
})

async function handleSendCommunication() {
  if (parsedRecipients.value.length === 0) {
    toastError('Informe ao menos um destinatário para o envio.')
    return
  }

  const subject = activeTemplateType.value === 'internal'
    ? internalForm.subject || `[Deploy] Atualização em ${selectedEnv.value.toUpperCase()}`
    : clientForm.subject || `Atualização de Plataforma Korvyan - ${clientForm.version}`

  sendingCommEmail.value = true
  try {
    await sendEmail(parsedRecipients.value, {
      subject,
      html: renderedEmailHtml.value,
    })
    toastSuccess(`Comunicado enviado com sucesso para ${parsedRecipients.value.length} destinatário(s)!`)
  } catch (err: any) {
    toastError('Erro ao enviar comunicado por e-mail: ' + (err.message || err))
  } finally {
    sendingCommEmail.value = false
  }
}
</script>

<style scoped>
.central-comunicados-card {
  background: var(--bg-card, #18181b);
  border: 1px solid var(--border-bo, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
  padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.comm-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-bo, rgba(255, 255, 255, 0.08));
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

.comm-title-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.comm-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(212, 175, 55, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.comm-title-badges {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-bo, #f8fafc);
  margin: 0;
}

.section-sub {
  font-size: 0.85rem;
  color: var(--text-bo-muted, #94a3b8);
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.badge-sub-pill {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-bo-muted, #94a3b8);
}

.comm-type-toggle {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px;
  border-radius: 8px;
  gap: 4px;
}

.tpl-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-bo-muted, #94a3b8);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.tpl-btn.active {
  background: var(--master-brand, #D4AF37);
  color: #000;
}

.tpl-btn.client.active {
  background: #38bdf8;
  color: #0f172a;
}

.comm-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .comm-grid {
    grid-template-columns: 1fr;
  }
}

.form-subheading {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--master-brand, #D4AF37);
  margin-bottom: 1rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.services-checkbox-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.service-checkbox-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-bo, rgba(255, 255, 255, 0.08));
  cursor: pointer;
  font-size: 0.82rem;
}

.recipients-section {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px dashed var(--border-bo, rgba(255, 255, 255, 0.1));
}

.recipients-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0.5rem;
}

.recipients-presets {
  display: flex;
  gap: 6px;
}

.preset-chip {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-bo, rgba(255, 255, 255, 0.1));
  color: var(--text-bo, #f8fafc);
  cursor: pointer;
}

.preset-chip.gold {
  border-color: rgba(212, 175, 55, 0.4);
  color: var(--master-brand, #D4AF37);
}

.recipients-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  margin-bottom: 1rem;
}

.tools-left {
  display: flex;
  gap: 8px;
}

.tool-btn {
  background: transparent;
  border: none;
  font-size: 0.75rem;
  color: var(--text-bo-muted, #94a3b8);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn:hover {
  color: var(--text-bo, #f8fafc);
}

.tool-btn.danger {
  color: #ef4444;
}

.send-comm-btn {
  margin-top: 0.5rem;
}

.comm-preview-col {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-bo, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-bo, rgba(255, 255, 255, 0.08));
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-bo, #f8fafc);
}

.preview-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(212, 175, 55, 0.15);
  color: var(--master-brand, #D4AF37);
}

.email-preview-wrapper {
  overflow-y: auto;
  max-height: 600px;
  border-radius: 8px;
}
</style>
