<template>
  <div class="deploy-page">
    <!-- Header -->
    <div class="bo-page-header">
      <div class="bo-page-header-left">
        <div class="title-with-badge">
          <h1>Automação de Deploy & CI/CD</h1>
          <span class="badge-bo">VPS / WORKERS</span>
        </div>
        <p>Dispare implantações remotas na VPS, acompanhe os logs em tempo real e gerencie comunicados e changelog.</p>
      </div>

      <div class="header-actions">
        <!-- Seletor de Ambiente -->
        <div class="env-toggle">
          <button 
            type="button"
            class="env-btn"
            :class="{ active: selectedEnv === 'prod' }"
            @click="selectedEnv = 'prod'"
          >
            <i class="fas fa-shield-check"></i> Produção (main)
          </button>
          <button type="button" class="env-btn beta" :class="{ active: selectedEnv === 'beta' }" @click="selectedEnv = 'beta'"><i class="fas fa-flask"></i> Beta (beta)</button>
          <button type="button" class="env-btn dev"
            :class="{ active: selectedEnv === 'dev' }"
            @click="selectedEnv = 'dev'"
          >
            <i class="fas fa-code-branch"></i> Dev (approval)
          </button>
        </div>

        <!-- Testar Conexão SSH -->
        <button class="btn btn-outline" :disabled="testingConnection" @click="handleTestConnection">
          <i :class="testingConnection ? 'fas fa-spinner fa-spin' : 'fas fa-network-wired'"></i>
          <span>{{ testingConnection ? 'Testando...' : 'Testar Conexão SSH' }}</span>
        </button>
      </div>
    </div>

    <!-- Cards de Ações de Deploy -->
    <div class="deploy-grid">
      <!-- 1. Backend -->
      <div class="deploy-card">
        <div class="card-top-row">
          <div class="card-icon-wrapper bg-blue">
            <i class="fas fa-server"></i>
          </div>
          <span class="service-status-pill">
            <span class="status-dot"></span> Ativo
          </span>
        </div>
        <div class="card-content">
          <h3>Backend API</h3>
          <p class="card-desc">
            Sincroniza o repositório da API, executa migrações no banco de dados e reinicia os serviços.
          </p>
        </div>
        <div class="card-footer">
          <button 
            class="btn btn-card-deploy w-100" 
            :disabled="isRunning" 
            @click="triggerDeploy('backend')"
          >
            <i class="fas fa-play"></i> Atualizar Backend
          </button>
        </div>
      </div>

      <!-- 2. Frontend -->
      <div class="deploy-card">
        <div class="card-top-row">
          <div class="card-icon-wrapper bg-emerald">
            <i class="fas fa-globe"></i>
          </div>
          <span class="service-status-pill">
            <span class="status-dot"></span> Ativo
          </span>
        </div>
        <div class="card-content">
          <h3>Frontend Principal</h3>
          <p class="card-desc">
            Compila os módulos da aplicação web, atualiza o build e publica no servidor web.
          </p>
        </div>
        <div class="card-footer">
          <button 
            class="btn btn-card-deploy w-100" 
            :disabled="isRunning" 
            @click="triggerDeploy('front')"
          >
            <i class="fas fa-play"></i> Atualizar Frontend
          </button>
        </div>
      </div>

      <!-- 3. Workers -->
      <div class="deploy-card">
        <div class="card-top-row">
          <div class="card-icon-wrapper bg-amber">
            <i class="fas fa-bolt"></i>
          </div>
          <span class="service-status-pill">
            <span class="status-dot"></span> Ativo
          </span>
        </div>
        <div class="card-content">
          <h3>Workers & Filas</h3>
          <p class="card-desc">
            Atualiza serviços assíncronos, motor de envio de e-mails e automações da plataforma.
          </p>
        </div>
        <div class="card-footer">
          <button 
            class="btn btn-card-deploy w-100" 
            :disabled="isRunning" 
            @click="triggerDeploy('workers')"
          >
            <i class="fas fa-play"></i> Atualizar Workers
          </button>
        </div>
      </div>

      <!-- 4. Admin App -->
      <div class="deploy-card">
        <div class="card-top-row">
          <div class="card-icon-wrapper bg-purple">
            <i class="fas fa-shield-halved"></i>
          </div>
          <span class="service-status-pill">
            <span class="status-dot"></span> Ativo
          </span>
        </div>
        <div class="card-content">
          <h3>Painel Master</h3>
          <p class="card-desc">
            Compila o painel administrativo Master e disponibiliza as novas ferramentas de gestão.
          </p>
        </div>
        <div class="card-footer">
          <button 
            class="btn btn-card-deploy w-100" 
            :disabled="isRunning" 
            @click="triggerDeploy('admin-app')"
          >
            <i class="fas fa-play"></i> Atualizar Painel Master
          </button>
        </div>
      </div>
    </div>

    <!-- Card de Destaque: Full Pipeline -->
    <div class="pipeline-card">
      <div class="pipeline-left">
        <div class="pipeline-icon">
          <i class="fas fa-layer-group"></i>
        </div>
        <div>
          <h2>Pipeline Completo Unificado</h2>
          <p>
            Executa a esteira sequencial completa: 
            <strong>Backend ➔ Workers ➔ Frontend ➔ Admin App</strong> com recarregamento seguro e notificação.
          </p>
        </div>
      </div>
      <div class="pipeline-right">
        <label class="email-toggle">
          <input type="checkbox" v-model="notifyEmail" />
          <span>Enviar e-mail Hostinger</span>
        </label>
        <button 
          class="btn btn-gold btn-lg" 
          :disabled="isRunning" 
          @click="triggerDeploy('pipeline')"
        >
          <i class="fas fa-rocket"></i> Disparar Pipeline Completo
        </button>
      </div>
    </div>

    <!-- Terminal de Execução em Tempo Real -->
    <div v-if="currentDeploy || terminalLogs" class="terminal-container">
      <div class="terminal-header">
        <div class="terminal-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="terminal-title">
            <i class="fas fa-terminal"></i> 
            SSH Terminal Output: {{ currentDeploy?.target?.toUpperCase() || 'STANDBY' }} 
            [{{ currentDeploy?.env?.toUpperCase() || selectedEnv.toUpperCase() }}]
          </span>
        </div>

        <div class="terminal-actions">
          <span v-if="isRunning" class="live-indicator">
            <span class="pulse-ring"></span>
            LIVE EXECUTION
          </span>
          <span v-else-if="currentDeploy?.status === 'success'" class="badge badge-success">
            <i class="fas fa-check"></i> SUCESSO ({{ currentDeploy.duration_seconds }}s)
          </span>
          <span v-else-if="currentDeploy?.status === 'failed'" class="badge badge-danger">
            <i class="fas fa-xmark"></i> FALHA
          </span>

          <button class="terminal-btn" @click="copyTerminalLogs" title="Copiar Logs">
            <i class="fas fa-copy"></i>
          </button>
          <button class="terminal-btn" @click="clearTerminal" title="Limpar Terminal">
            <i class="fas fa-trash-can"></i>
          </button>
        </div>
      </div>

      <!-- Janela do Terminal -->
      <div class="terminal-body" ref="terminalBodyRef">
        <pre>{{ terminalLogs }}</pre>
        <div v-if="isRunning" class="terminal-cursor">_</div>
      </div>
    </div>

    <!-- Central de Comunicados: Templates de Deploy & Changelog (Accordion) -->
    <div class="card deploy-comm-card" :class="{ 'is-open': isCommOpen }" style="margin-top: 2rem;">
      <div class="comm-accordion-header" @click="isCommOpen = !isCommOpen" role="button" tabindex="0">
        <div class="comm-header-left">
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
        </div>

        <div class="comm-header-actions" @click.stop>
          <!-- Seletor de Tipo de Template quando aberto -->
          <div v-if="isCommOpen" class="template-type-toggle">
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
              <i class="fas fa-sparkles"></i> Clientes
            </button>
          </div>

          <!-- Botão Accordion Toggle -->
          <button type="button" class="accordion-toggle-btn" @click="isCommOpen = !isCommOpen" :aria-expanded="isCommOpen">
            <span>{{ isCommOpen ? 'Recolher' : 'Expandir' }}</span>
            <i class="fas fa-chevron-down accordion-arrow" :class="{ 'rotated': isCommOpen }"></i>
          </button>
        </div>
      </div>

      <!-- Conteúdo do Accordion com transição suave -->
      <transition name="accordion-slide">
        <div v-show="isCommOpen" class="comm-accordion-body">

      <!-- Grid: Formulário + Preview -->
      <div class="comm-grid">
        <!-- Coluna 1: Edição do Template & Destinatários -->
        <div class="comm-form-col">
          
          <!-- Campos do Template Interno -->
          <div v-if="activeTemplateType === 'internal'" class="tpl-form-fields">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Versão / Tag</label>
                <input type="text" v-model="internalForm.version" class="form-control-dark" placeholder="v2.4.0" />
              </div>
              <div class="form-group">
                <label class="form-label">Autor / Responsável</label>
                <input type="text" v-model="internalForm.author" class="form-control-dark" placeholder="DevOps Team" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Assunto do E-mail</label>
              <input type="text" v-model="internalForm.subject" class="form-control-dark" />
            </div>

            <div class="form-group">
              <label class="form-label">Serviços Atualizados</label>
              <div class="services-chips">
                <label v-for="srv in serviceOptions" :key="srv.id" class="chip-label">
                  <input type="checkbox" :value="srv.name" v-model="internalForm.services" />
                  <span>{{ srv.name }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Mudanças Técnicas / Commits</label>
              <textarea 
                v-model="internalForm.commits" 
                rows="4" 
                class="form-control-dark font-mono"
                placeholder="- feat: nova funcionalidade X&#10;- fix: correção de bug na API&#10;- refactor: melhoria na performance"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Instruções Operacionais / Observações</label>
              <input type="text" v-model="internalForm.notes" class="form-control-dark" placeholder="Serviços Nginx e Systemd reiniciados normalmente." />
            </div>
          </div>

          <!-- Campos do Changelog para Clientes -->
          <div v-else class="tpl-form-fields">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Título da Release</label>
                <input type="text" v-model="clientForm.releaseTitle" class="form-control-dark" placeholder="Atualização de Outubro — Novidades no Portal" />
              </div>
              <div class="form-group">
                <label class="form-label">Versão da Plataforma</label>
                <input type="text" v-model="clientForm.version" class="form-control-dark" placeholder="v2.4" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Assunto do E-mail</label>
              <input type="text" v-model="clientForm.subject" class="form-control-dark" />
            </div>

            <div class="form-group">
              <label class="form-label">✨ O que há de novo (Novos Recursos)</label>
              <textarea 
                v-model="clientForm.features" 
                rows="3" 
                class="form-control-dark"
                placeholder="• Novo módulo de emissão de apólices mais ágil&#10;• Dashboard com indicadores em tempo real"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">⚡ Melhorias e Correções</label>
              <textarea 
                v-model="clientForm.fixes" 
                rows="3" 
                class="form-control-dark"
                placeholder="• Navegação mais rápida nos relatórios&#10;• Maior estabilidade na sincronização de dados"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Mensagem de Encerramento / Suporte</label>
              <input type="text" v-model="clientForm.footerText" class="form-control-dark" placeholder="Em caso de dúvidas ou necessidade de suporte, conte sempre conosco!" />
            </div>
          </div>

          <!-- Gestão de Destinatários de E-mail -->
          <div class="recipients-box">
            <div class="recipients-header">
              <div class="recipients-title">
                <i class="fas fa-envelope-open-text text-gold"></i>
                <strong>Destinatários do Envio</strong>
                <span class="count-badge">{{ parsedRecipients.length }} e-mail(s)</span>
              </div>

              <!-- Ações de Planilha -->
              <div class="sheet-actions">
                <input 
                  type="file" 
                  ref="fileInputRef" 
                  accept=".csv,.txt" 
                  style="display:none" 
                  @change="handleImportSheet"
                />
                <button type="button" class="btn-tool" @click="triggerFileInput" title="Carregar lista de e-mails de arquivo CSV ou TXT">
                  <i class="fas fa-file-import"></i> Importar Planilha
                </button>
                <button type="button" class="btn-tool" @click="exportRecipientsCsv" :disabled="parsedRecipients.length === 0" title="Baixar lista em CSV">
                  <i class="fas fa-file-export"></i> Exportar Planilha
                </button>
              </div>
            </div>

            <!-- Campo de E-mails manuais / múltiplos -->
            <textarea 
              v-model="rawRecipients" 
              rows="3" 
              class="form-control-dark font-mono"
              placeholder="Digite os e-mails separados por vírgula (ex: luan@empresa.com, cliente@empresa.com...)"
            ></textarea>

            <!-- Presets Rápidos -->
            <div class="presets-row">
              <span class="preset-label">Atalhos:</span>
              <button type="button" class="btn-preset" @click="addInternalPreset">
                + Equipe Interna
              </button>
              <button type="button" class="btn-preset" @click="addBetaClientsPreset">
                + Clientes Piloto
              </button>
              <button type="button" class="btn-preset" @click="addTenantEmailsPreset" :disabled="loadingTenantEmails">
                <i v-if="loadingTenantEmails" class="fas fa-spinner fa-spin"></i>
                <span v-else>+ E-mails dos Tenants</span>
              </button>
              <button type="button" class="btn-preset clear" @click="rawRecipients = ''">
                <i class="fas fa-times"></i> Limpar
              </button>
            </div>
          </div>

          <!-- Botão de Disparo -->
          <div class="send-action-row" style="margin-top: 1.25rem;">
            <button 
              class="btn btn-gold btn-lg w-100" 
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
  </transition>
</div>

    <!-- Tabela de Histórico de Deploys -->
    <div class="card history-card" style="margin-top: 2rem;">
      <div class="history-header">
        <div>
          <h2 class="section-title">Histórico de Implantações</h2>
          <p class="section-sub">Registros dos últimos deploys realizados através do Korvyan CI/CD.</p>
        </div>
        <button class="btn btn-outline" @click="loadHistory" title="Atualizar Histórico">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingHistory }"></i>
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>DATA / HORA</th>
              <th>ALVO</th>
              <th>AMBIENTE</th>
              <th>AUTOR</th>
              <th>DURAÇÃO</th>
              <th>STATUS</th>
              <th style="text-align: right">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingHistory">
              <td colspan="7" style="text-align:center; padding: 2rem;">
                <i class="fas fa-spinner fa-spin fa-2x text-gold"></i>
              </td>
            </tr>
            <tr v-else-if="historyList.length === 0">
              <td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">
                Nenhum histórico de deploy registrado até o momento.
              </td>
            </tr>
            <tr v-for="item in historyList" :key="item.id">
              <td>
                <strong>{{ formatDate(item.started_at) }}</strong>
                <div style="font-size: 0.72rem; color: var(--text-muted)">{{ formatTime(item.started_at) }}</div>
              </td>
              <td>
                <span class="target-tag" :class="item.target">
                  {{ formatTarget(item.target) }}
                </span>
              </td>
              <td>
                <span class="badge" :class="item.env === 'prod' ? 'badge-gold' : 'badge-muted'">
                  {{ item.env === 'prod' ? 'PRODUÇÃO' : 'DEV' }}
                </span>
              </td>
              <td>{{ item.author || 'Super Admin' }}</td>
              <td>{{ item.duration_seconds ? `${item.duration_seconds}s` : '—' }}</td>
              <td>
                <span v-if="item.status === 'success'" class="badge badge-success">
                  <i class="fas fa-circle-check"></i> Sucesso
                </span>
                <span v-else-if="item.status === 'running'" class="badge badge-gold">
                  <i class="fas fa-spinner fa-spin"></i> Em andamento
                </span>
                <span v-else class="badge badge-danger">
                  <i class="fas fa-circle-xmark"></i> Falhou
                </span>
              </td>
              <td style="text-align: right">
                <button class="btn btn-ghost" @click="viewDeployDetail(item)" title="Ver Logs Completos">
                  <i class="fas fa-terminal"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  triggerDeployViaWorker,
  getDeployHistoryViaWorker,
  testSshConnectionViaWorker,
  getDeployStreamUrl,
  getTenantEmailsViaWorker,
  type DeployTriggerPayload,
} from '@/services/workers.service'
import { useToast } from '@/composables/useToast'
import { sendEmail } from '@/services/mail.service'

const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()

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

const selectedEnv = ref<'prod' | 'beta' | 'dev'>('prod')
const isCommOpen = ref(false)
const notifyEmail = ref(true)
const isRunning = ref(false)
const testingConnection = ref(false)

const terminalLogs = ref('')
const currentDeploy = ref<any>(null)
const terminalBodyRef = ref<HTMLElement | null>(null)
let eventSource: EventSource | null = null

const historyList = ref<any[]>([])
const loadingHistory = ref(false)

async function handleTestConnection() {
  testingConnection.value = true
  try {
    const res = await testSshConnectionViaWorker()
    if (res.success) {
      toastSuccess(`VPS Online (${res.host}): Conexão SSH estabelecida com sucesso!`)
    } else {
      throw new Error(res.error || 'Falha de conexão')
    }
  } catch (err: any) {
    toastError('Erro ao conectar via SSH com a VPS: ' + (err.message || err))
  } finally {
    testingConnection.value = false
  }
}

async function triggerDeploy(target: DeployTriggerPayload['target']) {
  if (isRunning.value) return

  let authorName = 'Super Admin'
  try {
    const raw = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
    if (raw) authorName = JSON.parse(raw)?.name || authorName
  } catch {}

  isRunning.value = true
  terminalLogs.value = `🚀 Iniciando solicitação de deploy para [${target.toUpperCase()}] em [${selectedEnv.value.toUpperCase()}]...\n`
  currentDeploy.value = {
    target,
    env: selectedEnv.value,
    status: 'running',
    started_at: new Date().toISOString(),
  }

  scrollToBottom()

  try {
    const res = await triggerDeployViaWorker({
      target,
      env: selectedEnv.value,
      author: authorName,
      sendEmail: notifyEmail.value,
    })

    if (res.success && res.deploy?.id) {
      currentDeploy.value = res.deploy
      startSseStream(res.deploy.id)
      toastInfo(`Deploy de ${target} iniciado. Acompanhe os logs abaixo.`)
    } else {
      throw new Error(res.error || 'Falha ao disparar deploy.')
    }
  } catch (err: any) {
    isRunning.value = false
    terminalLogs.value += `\n❌ Erro ao disparar deploy: ${err.message}\n`
    toastError(err.message || 'Erro ao disparar deploy')
  }
}

function startSseStream(deployId: string) {
  if (eventSource) {
    eventSource.close()
  }

  const streamUrl = getDeployStreamUrl(deployId)
  eventSource = new EventSource(streamUrl)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'init') {
        terminalLogs.value = data.log || ''
      } else if (data.type === 'chunk') {
        terminalLogs.value += data.text || ''
      } else if (data.type === 'end') {
        isRunning.value = false
        currentDeploy.value = data.deploy
        if (data.deploy?.status === 'success') {
          toastSuccess('🎉 Deploy finalizado com sucesso!')
        } else {
          toastError('⚠️ O deploy terminou com erros.')
        }
        eventSource?.close()
        loadHistory()
      }
      scrollToBottom()
    } catch (e) {
      console.error('[SSE Parse Error]', e)
    }
  }

  eventSource.onerror = () => {
    isRunning.value = false
    eventSource?.close()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (terminalBodyRef.value) {
      terminalBodyRef.value.scrollTop = terminalBodyRef.value.scrollHeight
    }
  })
}

function copyTerminalLogs() {
  navigator.clipboard.writeText(terminalLogs.value)
  toastSuccess('Logs copiados para a área de transferência!')
}

function clearTerminal() {
  terminalLogs.value = ''
  currentDeploy.value = null
}

function viewDeployDetail(item: any) {
  currentDeploy.value = item
  terminalLogs.value = item.log || 'Nenhum log armazenado para este registro.'
  scrollToBottom()
  window.scrollTo({ top: 350, behavior: 'smooth' })
}

async function loadHistory() {
  loadingHistory.value = true
  try {
    historyList.value = await getDeployHistoryViaWorker(20)
  } catch (e) {
    console.warn('[History Error]', e)
  } finally {
    loadingHistory.value = false
  }
}

function formatTarget(target: string) {
  const map: Record<string, string> = {
    backend: 'Backend API',
    front: 'Frontend',
    workers: 'Workers',
    'admin-app': 'Admin App',
    pipeline: 'Pipeline Completo',
  }
  return map[target] || target
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatTime(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── Central de Comunicados / Changelog ──────────────────────────────
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

onMounted(() => {
  loadHistory()
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
})
</script>

<style scoped>
.deploy-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header com espaçamento aprimorado */
.bo-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2.25rem;
  padding-bottom: 1.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;
  gap: 1.5rem;
}

.bo-page-header-left {
  flex: 1 1 450px;
  display: flex;
  flex-direction: column;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.title-with-badge h1 {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.bo-page-header p {
  color: var(--text-muted, #94a3b8);
  font-size: 0.88rem;
  line-height: 1.55;
  margin: 10px 0 0 0;
  max-width: 680px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  align-self: center;
}

/* Seletor de Ambiente */
.env-toggle {
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 4px;
}

.env-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.env-btn.active {
  background: var(--gold);
  color: #1a1a1a;
  box-shadow: 0 2px 10px rgba(212, 175, 55, 0.35);
}

.env-btn.dev.active {
  background: #6366f1;
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35);
}

.header-actions .btn {
  height: 40px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  white-space: nowrap;
}

/* Grid de Deploy */
.deploy-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.deploy-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.25s;
}

.deploy-card:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.card-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.bg-blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.bg-emerald { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.bg-amber { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.bg-purple { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }

.badge-info { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.badge-purple { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }

.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}

.service-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #34d399;
  background: rgba(16, 185, 129, 0.1);
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.7);
}

.deploy-card .card-content h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary, #ffffff);
  margin: 0 0 0.45rem 0;
}

.card-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.45;
  margin-bottom: 1.25rem;
  flex: 1;
}

.card-footer {
  margin-top: auto;
}

.btn-card-deploy {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-primary, #f8fafc);
  padding: 9px 16px;
  font-size: 0.84rem;
  font-weight: 600;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-card-deploy:hover:not(:disabled) {
  background: var(--gold, #d4af37);
  border-color: var(--gold, #d4af37);
  color: #1a1a1a;
  box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
  transform: translateY(-1px);
}

.btn-card-deploy:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.w-100 { width: 100%; }

/* Pipeline Card */
.pipeline-card {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(35, 35, 35, 0.95) 100%);
  border: 1px solid var(--gold);
  border-radius: var(--radius-lg);
  padding: 1.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1.5rem;
}

.pipeline-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1;
  max-width: 800px;
}

.pipeline-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--gold);
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
  flex-shrink: 0;
}

.pipeline-left h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.pipeline-left p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.45;
  margin: 0;
}

.pipeline-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.email-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.btn-lg {
  height: 48px;
  padding: 0 24px;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Terminal Container */
.terminal-container {
  background: #141414;
  border: 1px solid #333333;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  margin-top: 1rem;
}

.terminal-header {
  background: #1e1e1e;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #2d2d2d;
  flex-wrap: wrap;
  gap: 8px;
}

.terminal-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.dot.red { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green { background: #27c93f; }

.terminal-title {
  margin-left: 10px;
  font-family: monospace;
  font-size: 0.8rem;
  color: #999;
}

.terminal-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--gold);
  font-weight: 700;
}

.pulse-ring {
  width: 8px;
  height: 8px;
  background: var(--gold);
  border-radius: 50%;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(1.3); opacity: 1; }
}

.terminal-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.terminal-btn:hover {
  background: #2a2a2a;
  color: #fff;
}

/* AI Summary Box */
.ai-summary-box {
  background: rgba(212, 175, 55, 0.08);
  border-bottom: 1px solid rgba(212, 175, 55, 0.25);
  padding: 14px 18px;
}

.ai-summary-header {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--gold);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.ai-summary-content {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.5;
  white-space: pre-line;
}

/* Terminal Body */
.terminal-body {
  padding: 16px;
  max-height: 450px;
  min-height: 250px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.82rem;
  color: #e5e5e5;
  line-height: 1.45;
}

.terminal-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.terminal-cursor {
  display: inline-block;
  color: var(--gold);
  animation: blink 0.8s infinite;
  font-weight: 700;
}

@keyframes blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

/* History Card */
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.target-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--bg-surface);
  color: var(--text-secondary);
  white-space: nowrap;
}

.target-tag.backend { color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); }
.target-tag.front { color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
.target-tag.workers { color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
.target-tag.admin-app { color: #a78bfa; border: 1px solid rgba(167, 139, 250, 0.3); }
.target-tag.pipeline { color: var(--gold); border: 1px solid var(--gold); }

/* ─── Responsividade Total ────────────────────────────────── */
@media (max-width: 1200px) {
  .deploy-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .pipeline-card {
    flex-direction: column;
    align-items: stretch;
    padding: 1.5rem;
    gap: 1.25rem;
  }
  .pipeline-right {
    align-items: stretch;
  }
  .pipeline-right .btn-lg {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .bo-page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1.25rem;
    margin-bottom: 1.75rem;
    padding-bottom: 1.25rem;
  }
  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  .env-toggle {
    width: 100%;
  }
  .env-btn {
    flex: 1;
    justify-content: center;
    padding: 9px 12px;
  }
  .header-actions .btn {
    width: 100%;
    justify-content: center;
  }
  .deploy-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .pipeline-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .pipeline-icon {
    width: 46px;
    height: 46px;
    font-size: 1.4rem;
  }
  .terminal-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .terminal-actions {
    width: 100%;
    justify-content: space-between;
  }
  .terminal-title {
    font-size: 0.74rem;
    word-break: break-all;
  }
  .terminal-body {
    font-size: 0.76rem;
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .title-with-badge h1 {
    font-size: 1.35rem;
  }
  .pipeline-card {
    padding: 1.15rem;
  }
}

/* ─── Central de Comunicados & Changelog (Accordion) ─── */
.deploy-comm-card {
  background: var(--bg-card, #18181b);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.deploy-comm-card.is-open {
  border-color: rgba(212, 175, 55, 0.4);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.comm-accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.25rem;
  padding: 1.5rem 1.75rem;
  cursor: pointer;
  user-select: none;
  background: rgba(255, 255, 255, 0.015);
  transition: background 0.2s;
}

.comm-accordion-header:hover {
  background: rgba(255, 255, 255, 0.04);
}

.comm-header-left {
  flex: 1 1 500px;
}

.comm-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.comm-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold, #d4af37);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
  border: 1px solid rgba(212, 175, 55, 0.25);
}

.comm-title-badges {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.comm-title-badges h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary, #ffffff);
}

.badge-sub-pill {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary, #94a3b8);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.comm-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.accordion-toggle-btn {
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: var(--gold, #d4af37);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.25s;
}

.accordion-toggle-btn:hover {
  background: var(--gold, #d4af37);
  color: #1a1a1a;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
}

.accordion-arrow {
  font-size: 0.75rem;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.accordion-arrow.rotated {
  transform: rotate(180deg);
}

.comm-accordion-body {
  padding: 1.5rem 1.75rem 1.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(0, 0, 0, 0.15);
}

.accordion-slide-enter-active,
.accordion-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.accordion-slide-enter-from,
.accordion-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.template-type-toggle {
  display: flex;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3px;
  gap: 4px;
}

.tpl-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary, #a1a1aa);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.tpl-btn.active {
  background: #3b82f6;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.tpl-btn.client.active {
  background: #10b981;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
}

.comm-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.75rem;
}

@media (max-width: 1024px) {
  .comm-grid {
    grid-template-columns: 1fr;
  }
}

.comm-form-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 0.75rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary, #cbd5e1);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-control-dark {
  width: 100%;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-control-dark:focus {
  border-color: var(--gold, #d4af37);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}

.font-mono {
  font-family: monospace;
  font-size: 0.82rem;
  line-height: 1.4;
}

.services-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 0.8rem;
  color: var(--text-secondary, #cbd5e1);
  cursor: pointer;
  transition: all 0.2s;
}

.chip-label:hover {
  background: rgba(255, 255, 255, 0.1);
}

.chip-label input:checked + span {
  color: var(--gold, #d4af37);
  font-weight: 600;
}

.recipients-box {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 1rem;
}

.recipients-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0.75rem;
}

.recipients-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: #ffffff;
}

.count-badge {
  font-size: 0.72rem;
  background: rgba(212, 175, 55, 0.2);
  color: var(--gold, #d4af37);
  border: 1px solid rgba(212, 175, 55, 0.4);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 700;
}

.sheet-actions {
  display: flex;
  gap: 6px;
}

.btn-tool {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 0.75rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn-tool:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.btn-tool:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.presets-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.preset-label {
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
}

.btn-preset {
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: var(--text-secondary, #cbd5e1);
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preset:hover {
  border-color: var(--gold, #d4af37);
  color: var(--gold, #d4af37);
}

.btn-preset.clear:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.comm-preview-col {
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: #ffffff;
}

.preview-tag {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}

.email-preview-wrapper {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.25rem;
  max-height: 580px;
  overflow-y: auto;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
}
</style>

