<template>
  <div class="deploy-page">
    <!-- Header -->
    <div class="bo-page-header">
      <div class="bo-page-header-left">
        <div class="title-with-badge">
          <h1>Automação de Deploy & CI/CD</h1>
          <span class="badge-bo">VPS / WORKERS</span>
        </div>
        <p>Dispare implantações remotas na VPS, acompanhe os logs em tempo real e receba resumos gerados por IA.</p>
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
        <div class="card-icon-wrapper bg-blue">
          <i class="fas fa-server"></i>
        </div>
        <div class="card-content">
          <div class="card-header-row">
            <h3>Backend API</h3>
            <span class="badge badge-info">Django / Python</span>
          </div>
          <p class="card-desc">
            Atualiza o <code>Korvyan-Insurance-Management</code>, executa migrações no PostgreSQL, sincroniza pacotes e reinicia o serviço Systemd.
          </p>
        </div>
        <div class="card-footer">
          <button 
            class="btn btn-outline w-100" 
            :disabled="isRunning" 
            @click="triggerDeploy('backend')"
          >
            <i class="fas fa-play"></i> Deploy Backend
          </button>
        </div>
      </div>

      <!-- 2. Frontend -->
      <div class="deploy-card">
        <div class="card-icon-wrapper bg-emerald">
          <i class="fas fa-globe"></i>
        </div>
        <div class="card-content">
          <div class="card-header-row">
            <h3>Frontend Principal</h3>
            <span class="badge badge-success">Portal Vue 3</span>
          </div>
          <p class="card-desc">
            Sincroniza o <code>korvyan-front</code>, instala dependências, compila os arquivos de produção do Vite e reinicia o Nginx.
          </p>
        </div>
        <div class="card-footer">
          <button 
            class="btn btn-outline w-100" 
            :disabled="isRunning" 
            @click="triggerDeploy('front')"
          >
            <i class="fas fa-play"></i> Deploy Frontend
          </button>
        </div>
      </div>

      <!-- 3. Workers -->
      <div class="deploy-card">
        <div class="card-icon-wrapper bg-amber">
          <i class="fas fa-bolt"></i>
        </div>
        <div class="card-content">
          <div class="card-header-row">
            <h3>Korvyan Workers</h3>
            <span class="badge badge-warning">Node.js / Functions</span>
          </div>
          <p class="card-desc">
            Atualiza o serviço de background workers, tarefas assíncronas, motor de e-mails Hostinger e Cloud Functions.
          </p>
        </div>
        <div class="card-footer">
          <button 
            class="btn btn-outline w-100" 
            :disabled="isRunning" 
            @click="triggerDeploy('workers')"
          >
            <i class="fas fa-play"></i> Deploy Workers
          </button>
        </div>
      </div>

      <!-- 4. Admin App -->
      <div class="deploy-card">
        <div class="card-icon-wrapper bg-purple">
          <i class="fas fa-shield-halved"></i>
        </div>
        <div class="card-content">
          <div class="card-header-row">
            <h3>Admin App</h3>
            <span class="badge badge-purple">Painel Master Root</span>
          </div>
          <p class="card-desc">
            Compila este painel administrativo <code>korvyan-admin-app</code> e atualiza os arquivos estáticos servidos pelo servidor web.
          </p>
        </div>
        <div class="card-footer">
          <button 
            class="btn btn-outline w-100" 
            :disabled="isRunning" 
            @click="triggerDeploy('admin-app')"
          >
            <i class="fas fa-play"></i> Deploy Admin App
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
            <strong>Backend ➔ Workers ➔ Frontend ➔ Admin App</strong>.
            Gera resumo das mudanças via IA (Gemini) e envia e-mail com relatório final para a equipe.
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

      <!-- Resumo com IA Gemini quando concluído -->
      <div v-if="currentDeploy?.aiSummary" class="ai-summary-box">
        <div class="ai-summary-header">
          <i class="fas fa-sparkles text-gold"></i>
          <span>Resumo Executivo Gerado por IA (Gemini):</span>
        </div>
        <div class="ai-summary-content">
          {{ currentDeploy.aiSummary }}
        </div>
      </div>

      <!-- Janela do Terminal -->
      <div class="terminal-body" ref="terminalBodyRef">
        <pre>{{ terminalLogs }}</pre>
        <div v-if="isRunning" class="terminal-cursor">_</div>
      </div>
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import {
  triggerDeployViaWorker,
  getDeployHistoryViaWorker,
  testSshConnectionViaWorker,
  getDeployStreamUrl,
  type DeployTriggerPayload,
} from '@/services/workers.service'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()

const selectedEnv = ref<'prod' | 'beta' | 'dev'>('prod')
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

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  gap: 8px;
}

.card-header-row h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.card-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.45;
  margin-bottom: 1.25rem;
  flex: 1;
}

.card-desc code {
  background: var(--bg-surface);
  color: var(--gold);
  padding: 2px 4px;
  border-radius: 4px;
}

.card-footer {
  margin-top: auto;
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
</style>

