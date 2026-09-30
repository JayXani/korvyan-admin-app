<template>
  <teleport to="body">
    <div v-if="modelValue && ticket" class="modal-overlay" @click.self="onBackdropClick">
      <div class="modal-card ticket-details-modal-card" :class="{ 'is-admin': mode === 'admin' }">
        
        <!-- Header -->
        <div class="modal-header ticket-modal-header">
          <div class="header-main-info">
            <div class="header-top-row">
              <span class="protocol-chip">
                {{ ticket.protocol || ('#TK-' + String(ticket.id).substring(0, 4).toUpperCase()) }}
              </span>
              <span :class="['badge-status', getStatusBadgeClass(ticket.status)]">
                <i :class="getStatusIcon(ticket.status)"></i>
                {{ getStatusLabel(ticket.status) }}
              </span>
              <span :class="['badge-priority', getPriorityClass(ticket.priority)]">
                <i :class="getPriorityIcon(ticket.priority)"></i>
                {{ getPriorityLabel(ticket.priority) }}
              </span>
              <span class="category-tag">
                <i :class="getCategoryIcon(ticket.category)"></i>
                {{ ticket.category || 'Geral' }}
              </span>
            </div>
            <h3 class="ticket-title" :title="ticket.title">{{ ticket.title }}</h3>
          </div>

          <div class="header-actions">
            <!-- Ação rápida de Status no Header -->
            <button
              v-if="mode === 'user' && ticket.status !== 'RESOLVIDO'"
              class="btn btn-outline btn-sm action-btn"
              @click="toggleTicketStatus"
              :disabled="updatingStatus"
              title="Marcar chamado como concluído"
            >
              <i class="fas fa-check-double text-success"></i>
              <span>Marcar como Resolvido</span>
            </button>
            <button
              v-else-if="mode === 'user' && ticket.status === 'RESOLVIDO'"
              class="btn btn-outline btn-sm action-btn"
              @click="toggleTicketStatus"
              :disabled="updatingStatus"
              title="Reabrir chamado para atendimento"
            >
              <i class="fas fa-rotate-left"></i>
              <span>Reabrir Chamado</span>
            </button>

            <button class="close-btn" @click="closeModal" title="Fechar modal">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Meta Bar -->
        <div class="ticket-meta-bar">
          <div class="meta-item">
            <i class="fas fa-building text-gold"></i>
            <span>Empresa: <strong>{{ ticket.tenant_name || ticket.tenant_prefix }}</strong></span>
          </div>
          <div class="meta-item">
            <i class="fas fa-user"></i>
            <span>Solicitante: <strong>{{ ticket.user_name || 'Usuário' }}</strong></span>
            <span v-if="ticket.user_email" class="email-sub">({{ ticket.user_email }})</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-calendar-plus"></i>
            <span>Aberto: <strong>{{ formatDateTime(ticket.created_at) }}</strong></span>
          </div>
          <div v-if="ticket.updated_at" class="meta-item">
            <i class="fas fa-clock-rotate-left"></i>
            <span>Última interação: <strong>{{ formatDateTime(ticket.updated_at) }}</strong></span>
          </div>

          <!-- Controle de Status exclusivo para ADMIN -->
          <div v-if="mode === 'admin'" class="meta-item admin-status-control">
            <label class="admin-status-label"><i class="fas fa-sliders"></i> Alterar Status:</label>
            <select
              :value="ticket.status"
              @change="handleAdminStatusChange(($event.target as HTMLSelectElement).value)"
              class="admin-status-select"
              :disabled="updatingStatus"
            >
              <option value="ABERTO">🟢 Aberto</option>
              <option value="EM_ANALISE">🟡 Em Análise</option>
              <option value="RESOLVIDO">🔵 Resolvido</option>
            </select>
          </div>
        </div>

        <!-- Chat / Timeline de Mensagens -->
        <div class="chat-timeline" ref="timelineChatRef">
          <!-- Mensagem inicial se messages estiver vazia -->
          <div v-if="displayMessages.length === 0" class="empty-messages">
            <p>Nenhuma mensagem registrada neste chamado.</p>
          </div>

          <div
            v-for="(msg, mIdx) in displayMessages"
            :key="msg.id || mIdx"
            :class="['chat-bubble-wrapper', msg.sender]"
          >
            <!-- Mensagem do Suporte -->
            <template v-if="msg.sender === 'support'">
              <div class="chat-avatar support-avatar" title="Suporte Korvyan">
                <i class="fas fa-headset"></i>
              </div>
              <div class="chat-bubble support-bubble">
                <div class="bubble-header">
                  <span class="sender-name">{{ msg.sender_name || 'Suporte Korvyan' }}</span>
                  <span class="support-badge">Especialista</span>
                  <span class="bubble-time">{{ formatDateTime(msg.created_at) }}</span>
                </div>
                <div v-if="msg.message" class="bubble-text">{{ msg.message }}</div>

                <!-- Anexos da Mensagem -->
                <div v-if="msg.attachments && msg.attachments.length > 0" class="bubble-attachments-list">
                  <div
                    v-for="(att, aIdx) in msg.attachments"
                    :key="aIdx"
                    class="attachment-card"
                    :class="{ 'is-expired': isAttachmentExpired(att) }"
                  >
                    <div class="attachment-icon">
                      <i :class="getFileIcon(att.name)"></i>
                    </div>
                    <div class="attachment-meta">
                      <span class="attachment-name" :title="att.name">{{ att.name }}</span>
                      <div class="attachment-info-sub">
                        <span>{{ formatFileSize(att.size) }}</span>
                        <span v-if="isAttachmentExpired(att)" class="attachment-status-expired">
                          <i class="fas fa-ban"></i> Indisponível (expirado após 24h)
                        </span>
                        <span v-else class="attachment-status-active">
                          <i class="fas fa-clock"></i> Expira em 24h ({{ formatTimeRemaining(att.expires_at) }})
                        </span>
                      </div>
                    </div>
                    <div class="attachment-action">
                      <a
                        v-if="!isAttachmentExpired(att) && att.url"
                        :href="att.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn-download-att"
                        title="Abrir / Baixar arquivo"
                      >
                        <i class="fas fa-arrow-up-right-from-square"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Mensagem do Solicitante / Usuário -->
            <template v-else-if="msg.sender === 'user'">
              <div class="chat-bubble user-bubble">
                <div class="bubble-header">
                  <span class="bubble-time">{{ formatDateTime(msg.created_at) }}</span>
                  <span class="sender-name">{{ msg.sender_name || 'Solicitante' }}</span>
                  <span v-if="isMessageFromMe(msg)" class="me-badge">Você</span>
                </div>
                <div v-if="msg.message" class="bubble-text">{{ msg.message }}</div>

                <!-- Anexos da Mensagem -->
                <div v-if="msg.attachments && msg.attachments.length > 0" class="bubble-attachments-list">
                  <div
                    v-for="(att, aIdx) in msg.attachments"
                    :key="aIdx"
                    class="attachment-card"
                    :class="{ 'is-expired': isAttachmentExpired(att) }"
                  >
                    <div class="attachment-icon">
                      <i :class="getFileIcon(att.name)"></i>
                    </div>
                    <div class="attachment-meta">
                      <span class="attachment-name" :title="att.name">{{ att.name }}</span>
                      <div class="attachment-info-sub">
                        <span>{{ formatFileSize(att.size) }}</span>
                        <span v-if="isAttachmentExpired(att)" class="attachment-status-expired">
                          <i class="fas fa-ban"></i> Indisponível (expirado após 24h)
                        </span>
                        <span v-else class="attachment-status-active">
                          <i class="fas fa-clock"></i> Expira em 24h ({{ formatTimeRemaining(att.expires_at) }})
                        </span>
                      </div>
                    </div>
                    <div class="attachment-action">
                      <a
                        v-if="!isAttachmentExpired(att) && att.url"
                        :href="att.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn-download-att"
                        title="Abrir / Baixar arquivo"
                      >
                        <i class="fas fa-arrow-up-right-from-square"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="chat-avatar user-avatar-msg" :title="msg.sender_name || 'Usuário'">
                {{ getInitials(msg.sender_name) }}
              </div>
            </template>

            <!-- Mensagem de Sistema (ex: alteração de status) -->
            <template v-else>
              <div class="chat-system-pill">
                <i class="fas fa-circle-info"></i>
                <span>{{ msg.message }}</span>
                <span class="system-time">({{ formatDateTime(msg.created_at) }})</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Composer / Campo de Envio de Resposta -->
        <div class="chat-composer">
          <!-- Aviso contextual se o ticket estiver RESOLVIDO -->
          <div v-if="ticket.status === 'RESOLVIDO'" class="composer-status-bar">
            <i class="fas fa-circle-check"></i>
            <span v-if="mode === 'user'">
              Este chamado está marcado como <strong>Resolvido</strong>. O envio de uma nova mensagem irá reabri-lo automaticamente para <strong>Em Análise</strong>.
            </span>
            <span v-else>
              Este chamado está marcado como <strong>Resolvido</strong>. Ao responder, você pode manter ou alterar o status acima.
            </span>
          </div>

          <!-- Preview do Anexo Selecionado -->
          <div v-if="selectedFile" class="composer-attachment-preview">
            <div class="attachment-preview-info">
              <i class="fas fa-paperclip text-gold"></i>
              <span class="attachment-preview-name">{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</span>
              <span class="attachment-exp-tag"><i class="fas fa-clock"></i> Link temporário: ficará indisponível após 24h</span>
            </div>
            <button class="remove-attach-btn" @click="clearSelectedFile" title="Remover anexo">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="composer-input-row">
            <!-- Botão de Clips para Anexo -->
            <button
              type="button"
              class="attach-clip-btn"
              title="Anexar arquivo ou print (expira em 24h)"
              @click="triggerFileInput"
              :disabled="sendingReply || uploadingFile"
            >
              <i :class="uploadingFile ? 'fas fa-spinner fa-spin' : 'fas fa-paperclip'"></i>
            </button>
            <input
              type="file"
              ref="fileInputRef"
              @change="onFileSelected"
              style="display: none"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            />

            <textarea
              v-model="replyText"
              class="form-input composer-textarea"
              :placeholder="mode === 'admin' 
                ? 'Digite a resposta do Suporte Korvyan... (Enter para enviar)' 
                : 'Digite sua mensagem ou dúvida... (Enter para enviar)'"
              rows="2"
              @keydown.enter.exact.prevent="sendTicketMessage"
              :disabled="sendingReply || uploadingFile"
            ></textarea>

            <button
              class="btn send-btn"
              :class="mode === 'admin' ? 'btn-master' : 'btn-gold'"
              :disabled="(!replyText.trim() && !selectedFile) || sendingReply || uploadingFile"
              @click="sendTicketMessage"
              title="Enviar mensagem"
            >
              <i v-if="sendingReply || uploadingFile" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-paper-plane"></i>
              <span>Responder</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { db } from '@/services/firebase.config'
import { useToast } from '@/composables/useToast'
import { sendEmail } from '@/services/mail.service'
import { uploadFile, removeFile } from '@/services/storage.service'

export interface TicketAttachment {
  name: string
  size: number
  type: string
  url: string
  storagePath?: string
  uploaded_at: string
  expires_at: string
}

export interface TicketMessage {
  id?: string
  sender: 'user' | 'support' | 'system'
  sender_name: string
  message: string
  created_at: string
  attachments?: TicketAttachment[]
}

export interface TicketItem {
  id: string
  protocol?: string
  title: string
  category?: string
  priority?: string
  status: string
  tenant_prefix: string
  tenant_name?: string
  user_name: string
  user_email: string
  description?: string
  messages: TicketMessage[]
  created_at: string
  updated_at: string
  docRef?: any
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    ticket: TicketItem | null
    mode?: 'admin' | 'user'
    adminName?: string
    userName?: string
    userEmail?: string
  }>(),
  {
    mode: 'user',
    adminName: 'Suporte Korvyan',
    userName: '',
    userEmail: ''
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'ticket-updated', ticket: TicketItem): void
  (e: 'close'): void
}>()

const toast = useToast()

const replyText = ref('')
const sendingReply = ref(false)
const updatingStatus = ref(false)
const timelineChatRef = ref<HTMLElement | null>(null)

// Gestão de Anexos com Expiração de 24h
const selectedFile = ref<File | null>(null)
const uploadingFile = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    // Limite máximo de 10 MB
    if (file.size > 10 * 1024 * 1024) {
      toast.warning('O arquivo excede o limite máximo permitido de 10 MB.')
      target.value = ''
      return
    }
    selectedFile.value = file
  }
}

function clearSelectedFile() {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileIcon(name?: string): string {
  if (!name) return 'fas fa-file'
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'fas fa-file-image'
  if (['pdf'].includes(ext)) return 'fas fa-file-pdf'
  if (['doc', 'docx'].includes(ext)) return 'fas fa-file-word'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'fas fa-file-excel'
  if (['zip', 'rar', '7z'].includes(ext)) return 'fas fa-file-zipper'
  return 'fas fa-file-lines'
}

function isAttachmentExpired(att: TicketAttachment): boolean {
  if (!att || !att.expires_at) return false
  const expTime = new Date(att.expires_at).getTime()
  const isExp = Date.now() > expTime
  if (isExp && att.storagePath) {
    removeFile(att.storagePath).catch(() => {})
  }
  return isExp
}

function formatTimeRemaining(expiresAt?: string): string {
  if (!expiresAt) return ''
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return 'Expirado'
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins}m restantes`
  }
  return `${diffMins}m restantes`
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Resolver usuário logado atual
const resolvedCurrentUser = computed(() => {
  if (props.userName) {
    return { name: props.userName, email: props.userEmail || '' }
  }
  try {
    const raw = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
    if (raw) {
      const u = JSON.parse(raw)
      return {
        name: u.name || u.person?.name || u.username || 'Usuário',
        email: u.email || u.person?.email || ''
      }
    }
  } catch {}
  return { name: 'Usuário', email: '' }
})

// Garantir que caso o chamado venha sem array de messages mas com description, mostre como mensagem inicial
const displayMessages = computed<TicketMessage[]>(() => {
  if (!props.ticket) return []
  if (Array.isArray(props.ticket.messages) && props.ticket.messages.length > 0) {
    return props.ticket.messages
  }
  if (props.ticket.description) {
    return [
      {
        id: 'init_' + props.ticket.id,
        sender: 'user',
        sender_name: props.ticket.user_name || 'Solicitante',
        message: props.ticket.description,
        created_at: props.ticket.created_at || new Date().toISOString()
      }
    ]
  }
  return []
})

let unsubscribeSnapshot: (() => void) | null = null

function setupRealtimeListener() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot()
    unsubscribeSnapshot = null
  }

  if (!props.ticket || !props.ticket.id) return
  const targetPrefix = props.ticket.tenant_prefix || 'korvy'
  const ticketId = props.ticket.id

  if (ticketId.startsWith('demo-') || ticketId.startsWith('local_')) return

  try {
    const ticketDocRef = props.ticket.docRef || doc(db, 'tenants', targetPrefix, 'tickets', ticketId)
    unsubscribeSnapshot = onSnapshot(ticketDocRef, (snap) => {
      if (snap.exists() && props.ticket) {
        const data = snap.data()
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          props.ticket.messages = data.messages
        }
        if (data.status && data.status !== props.ticket.status) {
          props.ticket.status = data.status
        }
        if (data.updated_at) {
          props.ticket.updated_at = data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : data.updated_at
        }
        emit('ticket-updated', props.ticket)
        scrollToBottom()
      }
    }, (err) => {
      console.warn('[TicketDetailsModal] Realtime listener error:', err)
    })
  } catch (err) {
    console.warn('[TicketDetailsModal] Falha ao registrar realtime:', err)
  }
}

// Scroll automático para o final da conversa quando abre ou adiciona mensagem
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      replyText.value = ''
      setupRealtimeListener()
      scrollToBottom()
    } else {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
        unsubscribeSnapshot = null
      }
    }
  },
  { immediate: true }
)

watch(
  () => displayMessages.value.length,
  () => {
    scrollToBottom()
  }
)

onUnmounted(() => {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot()
    unsubscribeSnapshot = null
  }
})

function scrollToBottom() {
  nextTick(() => {
    if (timelineChatRef.value) {
      timelineChatRef.value.scrollTop = timelineChatRef.value.scrollHeight
    }
  })
}

function closeModal() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot()
    unsubscribeSnapshot = null
  }
  emit('update:modelValue', false)
  emit('close')
}

function isMessageFromMe(msg: TicketMessage) {
  if (props.mode === 'user') {
    return msg.sender === 'user'
  }
  return false
}

function getInitials(name?: string) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Limpeza recursiva de campos undefined para compatibilidade estrita com Firestore
function cleanFirestoreData(data: any): any {
  if (data === undefined) return null
  if (data === null || typeof data !== 'object') return data
  if (data instanceof Date) return data.toISOString()
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => cleanFirestoreData(item))
  }
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = cleanFirestoreData(value)
    }
  }
  return result
}

// Persistência unificada no Firestore
async function persistTicketUpdate(payload: {
  status?: string
  messages?: TicketMessage[]
  updated_at?: any
}) {
  if (!props.ticket) return

  const targetPrefix = props.ticket.tenant_prefix || 'korvy'
  const ticketId = props.ticket.id

  const cleaned = cleanFirestoreData(payload)
  cleaned.updated_at = serverTimestamp()

  if (props.ticket.docRef) {
    await updateDoc(props.ticket.docRef, cleaned)
    return
  }

  if (ticketId && !ticketId.startsWith('demo-') && !ticketId.startsWith('local_')) {
    const ticketRef = doc(db, 'tenants', targetPrefix, 'tickets', ticketId)
    await updateDoc(ticketRef, cleaned)
  }
}

// Atualização de Status pelo Admin
async function handleAdminStatusChange(newStatus: string) {
  if (!props.ticket || props.ticket.status === newStatus) return
  updatingStatus.value = true

  const oldStatus = props.ticket.status
  const nowIso = new Date().toISOString()
  props.ticket.status = newStatus
  props.ticket.updated_at = nowIso

  if (!props.ticket.messages) {
    props.ticket.messages = [...displayMessages.value]
  }

  const adminDisplayName = props.adminName || 'Suporte Korvyan'
  const systemMsg: TicketMessage = {
    id: 'sys_' + Date.now(),
    sender: 'system',
    sender_name: 'Sistema Korvyan',
    message: `Status do chamado alterado de "${getStatusLabel(oldStatus)}" para "${getStatusLabel(newStatus)}" por ${adminDisplayName}.`,
    created_at: nowIso
  }
  props.ticket.messages.push(systemMsg)

  try {
    await persistTicketUpdate({
      status: newStatus,
      messages: props.ticket.messages
    })
    toast.success(`Status alterado para ${getStatusLabel(newStatus)}!`)
    emit('ticket-updated', props.ticket)
  } catch (err) {
    console.error('[TicketDetailsModal] Erro ao alterar status admin:', err)
    toast.error('Erro ao atualizar status do chamado no servidor.')
  } finally {
    updatingStatus.value = false
    scrollToBottom()
  }
}

// Alteração de Status pelo Usuário (Alternar Aberto <-> Resolvido)
async function toggleTicketStatus() {
  if (!props.ticket) return
  updatingStatus.value = true

  const isResolved = props.ticket.status === 'RESOLVIDO'
  const newStatus = isResolved ? 'EM_ANALISE' : 'RESOLVIDO'
  const nowIso = new Date().toISOString()

  props.ticket.status = newStatus
  props.ticket.updated_at = nowIso

  if (!props.ticket.messages) {
    props.ticket.messages = [...displayMessages.value]
  }

  const userDisplayName = resolvedCurrentUser.value.name || props.ticket.user_name || 'Solicitante'
  const systemMsg: TicketMessage = {
    id: 'sys_' + Date.now(),
    sender: 'system',
    sender_name: 'Sistema Korvyan',
    message: newStatus === 'RESOLVIDO'
      ? `Chamado concluído e marcado como RESOLVIDO por ${userDisplayName}.`
      : `Chamado reaberto para atendimento por ${userDisplayName}.`,
    created_at: nowIso
  }
  props.ticket.messages.push(systemMsg)

  try {
    await persistTicketUpdate({
      status: newStatus,
      messages: props.ticket.messages
    })
    if (newStatus === 'RESOLVIDO') {
      toast.success('Chamado marcado como Resolvido com sucesso!')
    } else {
      toast.info('Chamado reaberto para atendimento.')
    }
    emit('ticket-updated', props.ticket)
  } catch (err) {
    console.error('[TicketDetailsModal] Erro ao alternar status usuário:', err)
    toast.error('Erro ao atualizar status do chamado.')
  } finally {
    updatingStatus.value = false
    scrollToBottom()
  }
}

// Enviar Mensagem
async function sendTicketMessage() {
  const content = replyText.value.trim()
  if ((!content && !selectedFile.value) || !props.ticket) return

  sendingReply.value = true
  const nowIso = new Date().toISOString()

  if (!props.ticket.messages) {
    props.ticket.messages = [...displayMessages.value]
  }

  const isSupport = props.mode === 'admin'
  const senderName = isSupport
    ? (props.adminName || 'Suporte Korvyan')
    : (resolvedCurrentUser.value.name || props.ticket.user_name || 'Você')

  // Upload de arquivo se houver
  let uploadedAttachments: TicketAttachment[] = []
  if (selectedFile.value) {
    uploadingFile.value = true
    try {
      const file = selectedFile.value
      const targetPrefix = props.ticket.tenant_prefix || 'korvy'
      const ticketId = props.ticket.id
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `tickets/${targetPrefix}/${ticketId}/${Date.now()}_${safeFileName}`
      let downloadUrl = ''
      try {
        downloadUrl = await uploadFile(storagePath, file)
      } catch (storageErr) {
        console.warn('[TicketDetailsModal] Falha ao enviar para storage, tentando fallback:', storageErr)
        if (file.size < 1.5 * 1024 * 1024) {
          downloadUrl = await readFileAsDataURL(file)
        } else {
          throw storageErr
        }
      }
      if (downloadUrl) {
        const attObj: TicketAttachment = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: downloadUrl,
          uploaded_at: nowIso,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
        if (!downloadUrl.startsWith('data:') && storagePath) {
          attObj.storagePath = storagePath
        }
        uploadedAttachments.push(attObj)
      }
    } catch (err) {
      console.warn('[TicketDetailsModal] Erro ao anexar arquivo:', err)
      toast.warning('Não foi possível anexar o arquivo no storage. Mensagem enviada sem o anexo.')
    } finally {
      uploadingFile.value = false
      clearSelectedFile()
    }
  }

  const newMsg: TicketMessage = {
    id: 'msg_' + Date.now(),
    sender: isSupport ? 'support' : 'user',
    sender_name: senderName,
    message: content || (uploadedAttachments.length > 0 ? 'Arquivo anexado' : ''),
    created_at: nowIso
  }
  if (uploadedAttachments.length > 0) {
    newMsg.attachments = uploadedAttachments
  }

  props.ticket.messages.push(newMsg)
  props.ticket.updated_at = nowIso

  // Se o chamado estava RESOLVIDO e o USUÁRIO envia uma mensagem, reabre para EM_ANALISE
  let statusChanged = false
  if (!isSupport && props.ticket.status === 'RESOLVIDO') {
    props.ticket.status = 'EM_ANALISE'
    statusChanged = true
    props.ticket.messages.push({
      id: 'sys_' + (Date.now() + 1),
      sender: 'system',
      sender_name: 'Sistema Korvyan',
      message: 'Chamado reaberto automaticamente para Em Análise devido a nova mensagem do solicitante.',
      created_at: nowIso
    })
  }

  try {
    await persistTicketUpdate({
      status: props.ticket.status,
      messages: props.ticket.messages
    })
    replyText.value = ''
    toast.success('Mensagem enviada com sucesso!')
    emit('ticket-updated', props.ticket)
    scrollToBottom()

    // Notificação por e-mail para o usuário quando o suporte responder
    if (isSupport && props.ticket.user_email) {
      const targetEmail = props.ticket.user_email
      const recipientName = props.ticket.user_name || 'Cliente'
      const protocolCode = props.ticket.protocol || `#TK-${String(props.ticket.id).substring(0, 4).toUpperCase()}`
      const ticketTitle = props.ticket.title || 'Chamado de Suporte'

      sendEmail(targetEmail, {
        subject: `[${protocolCode}] Nova resposta no seu chamado: ${ticketTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
            <div style="background: #111827; padding: 20px; text-align: center;">
              <h2 style="color: #d4af37; margin: 0; font-size: 1.25rem;">Korvyan - Atendimento e Suporte</h2>
            </div>
            <div style="padding: 24px;">
              <p>Olá, <strong>${recipientName}</strong>,</p>
              <p>Seu chamado <strong>${protocolCode}</strong> (<em>"${ticketTitle}"</em>) recebeu uma nova resposta da nossa equipe:</p>
              <div style="background: #f8fafc; border-left: 4px solid #d4af37; padding: 14px; margin: 16px 0; border-radius: 4px;">
                <p style="margin: 0 0 6px; font-weight: bold; color: #0f172a; font-size: 0.9rem;">${senderName}:</p>
                <p style="margin: 0; color: #334155; white-space: pre-line;">${content}</p>
              </div>
              <p style="font-size: 0.9rem; color: #64748b;">Para acompanhar a conversa completa e responder, acesse seu painel Korvyan no menu <strong>FAQ / Meus Chamados</strong>.</p>
            </div>
            <div style="background: #f1f5f9; padding: 12px 20px; font-size: 0.8rem; color: #94a3b8; text-align: center;">
              Mensagem automática do sistema Korvyan • Por favor não responda diretamente a este e-mail.
            </div>
          </div>
        `
      }).catch((mailErr: any) => {
        console.warn('[TicketDetailsModal] Não foi possível enviar e-mail de notificação:', mailErr)
      })
    }
  } catch (err) {
    console.error('[TicketDetailsModal] Erro ao enviar mensagem:', err)
    toast.error('Erro ao enviar mensagem. Tente novamente.')
  } finally {
    sendingReply.value = false
  }
}

// Helpers de Estilização e Labels
function getStatusLabel(status?: string) {
  switch ((status || '').toUpperCase()) {
    case 'ABERTO': return 'Aberto'
    case 'EM_ANALISE': return 'Em Análise'
    case 'RESOLVIDO': return 'Resolvido'
    default: return status || 'Aberto'
  }
}

function getStatusBadgeClass(status?: string) {
  switch ((status || '').toUpperCase()) {
    case 'ABERTO': return 'status-aberto'
    case 'EM_ANALISE': return 'status-analise'
    case 'RESOLVIDO': return 'status-resolvido'
    default: return 'status-aberto'
  }
}

function getStatusIcon(status?: string) {
  switch ((status || '').toUpperCase()) {
    case 'ABERTO': return 'fas fa-clock'
    case 'EM_ANALISE': return 'fas fa-magnifying-glass'
    case 'RESOLVIDO': return 'fas fa-circle-check'
    default: return 'fas fa-circle'
  }
}

function getPriorityLabel(priority?: string) {
  switch ((priority || '').toLowerCase()) {
    case 'baixa': return 'Baixa'
    case 'media': return 'Média'
    case 'alta': return 'Alta'
    case 'urgente': return 'Urgente'
    default: return priority || 'Média'
  }
}

function getPriorityClass(priority?: string) {
  switch ((priority || '').toLowerCase()) {
    case 'baixa': return 'priority-baixa'
    case 'media': return 'priority-media'
    case 'alta': return 'priority-alta'
    case 'urgente': return 'priority-urgente'
    default: return 'priority-media'
  }
}

function getPriorityIcon(priority?: string) {
  switch ((priority || '').toLowerCase()) {
    case 'baixa': return 'fas fa-arrow-down'
    case 'media': return 'fas fa-minus'
    case 'alta': return 'fas fa-arrow-up'
    case 'urgente': return 'fas fa-fire'
    default: return 'fas fa-minus'
  }
}

function getCategoryIcon(cat?: string) {
  switch (cat) {
    case 'Dúvida Operacional': return 'fas fa-circle-question'
    case 'Financeiro e Cobrança': return 'fas fa-wallet'
    case 'Problema no Sistema': return 'fas fa-triangle-exclamation'
    case 'Solicitação de Recurso': return 'fas fa-lightbulb'
    case 'Integração': return 'fas fa-plug'
    default: return 'fas fa-headset'
  }
}

function onBackdropClick() {
  if (props.mode === 'admin') {
    // No modo admin, não fecha ao clicar fora - apenas X ou ESC
    return
  }
  closeModal()
}

function handleEscKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    closeModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscKey)
})

function formatDateTime(d?: any) {
  if (!d) return '-'
  try {
    let date: Date
    if (d?.toDate && typeof d.toDate === 'function') {
      date = d.toDate()
    } else if (typeof d === 'object' && ('seconds' in d || '_seconds' in d)) {
      const sec = d.seconds ?? d._seconds
      date = new Date(sec * 1000)
    } else if (typeof d === 'number') {
      date = new Date(d > 1e11 ? d : d * 1000)
    } else if (typeof d === 'string') {
      if (/^\d{2}\/\d{2}\/\d{4}/.test(d)) {
        const parts = d.split('/')
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      } else {
        date = new Date(d)
      }
    } else {
      date = new Date(d)
    }
    if (isNaN(date.getTime())) return typeof d === 'string' ? d : '-'
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const hours = String(date.getHours()).padStart(2, '0')
    const mins = String(date.getMinutes()).padStart(2, '0')
    if (isToday) return `Hoje às ${hours}:${mins}`
    return `${date.toLocaleDateString('pt-BR')} ${hours}:${mins}`
  } catch {
    return typeof d === 'string' ? d : '-'
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(3px);
  padding: 1rem;
}

.ticket-details-modal-card {
  background: var(--bg-card, #1c1d22);
  border: 1px solid var(--border, #2e3038);
  border-radius: var(--radius-lg, 14px);
  width: 100%;
  max-width: 980px;
  height: 88vh;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.ticket-details-modal-card.is-admin {
  max-width: 1260px;
  width: 96vw;
  height: 92vh;
  max-height: 94vh;
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Header */
.ticket-modal-header {
  padding: 1.25rem 1.5rem;
  background: var(--bg-surface, #24262f);
  border-bottom: 1px solid var(--border-light, #2e3038);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.header-main-info {
  flex: 1;
  min-width: 0;
}

.header-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.protocol-chip {
  font-family: monospace;
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba(212, 175, 55, 0.12);
  color: var(--gold, #d4af37);
  border: 1px solid rgba(212, 175, 55, 0.3);
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.ticket-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary, #ffffff);
  margin: 0;
  line-height: 1.35;
  word-break: break-word;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  padding: 6px 12px;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted, #8b92a5);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-primary, #ffffff);
  background: rgba(255, 255, 255, 0.08);
}

/* Badges */
.badge-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-aberto {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.35);
}

.status-analise {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.status-resolvido {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.35);
}

.badge-priority {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.priority-baixa {
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.priority-media {
  background: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.priority-alta {
  background: rgba(249, 115, 22, 0.15);
  color: #fb923c;
  border: 1px solid rgba(249, 115, 22, 0.35);
}

.priority-urgente {
  background: rgba(239, 68, 68, 0.18);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  color: var(--text-secondary, #b3b9c9);
  background: var(--bg-input, rgba(255, 255, 255, 0.05));
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--border-light, #2e3038);
}

/* Meta Bar */
.ticket-meta-bar {
  padding: 0.85rem 1.5rem;
  background: var(--bg-input, rgba(0, 0, 0, 0.2));
  border-bottom: 1px solid var(--border-light, #2e3038);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary, #b3b9c9);
}

.meta-item strong {
  color: var(--text-primary, #ffffff);
  font-weight: 600;
}

.email-sub {
  color: var(--text-muted, #8b92a5);
  font-size: 0.74rem;
}

.admin-status-control {
  margin-left: auto;
  gap: 8px;
}

.admin-status-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--gold, #d4af37);
  display: flex;
  align-items: center;
  gap: 5px;
}

.admin-status-select {
  background: var(--bg-surface, #24262f);
  color: var(--text-primary, #ffffff);
  border: 1px solid var(--border, #3b3e4a);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.admin-status-select:focus {
  border-color: var(--gold, #d4af37);
}

/* Timeline */
.chat-timeline {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: var(--bg-card, #1c1d22);
  min-height: 280px;
  max-height: 440px;
}

.empty-messages {
  text-align: center;
  color: var(--text-muted, #8b92a5);
  padding: 2rem 0;
  font-size: 0.9rem;
}

.chat-bubble-wrapper {
  display: flex;
  gap: 10px;
  max-width: 82%;
}

.chat-bubble-wrapper.user {
  margin-left: auto;
  flex-direction: row;
  justify-content: flex-end;
}

.chat-bubble-wrapper.support {
  margin-right: auto;
  flex-direction: row;
}

.chat-bubble-wrapper.system {
  margin: 0.4rem auto;
  max-width: 100%;
}

.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.support-avatar {
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold, #d4af37);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.user-avatar-msg {
  background: var(--bg-input, #2a2c36);
  color: var(--text-primary, #ffffff);
  border: 1px solid var(--border, #3b3e4a);
}

.chat-bubble {
  padding: 0.85rem 1.1rem;
  border-radius: 12px;
  position: relative;
  word-break: break-word;
}

.support-bubble {
  background: var(--bg-surface, #24262f);
  border: 1px solid var(--border-light, #2e3038);
  border-left: 3px solid var(--gold, #d4af37);
  border-top-left-radius: 2px;
}

.user-bubble {
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-top-right-radius: 2px;
}

.bubble-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.75rem;
}

.sender-name {
  font-weight: 700;
  color: var(--text-primary, #ffffff);
}

.support-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--gold, #d4af37);
  background: rgba(212, 175, 55, 0.15);
  padding: 1px 6px;
  border-radius: 4px;
}

.me-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted, #8b92a5);
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 6px;
  border-radius: 4px;
}

.bubble-time {
  color: var(--text-muted, #8b92a5);
  font-size: 0.7rem;
}

.bubble-text {
  font-size: 0.88rem;
  color: var(--text-primary, #ffffff);
  line-height: 1.5;
  white-space: pre-wrap;
}

.chat-system-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted, #8b92a5);
  background: var(--bg-input, rgba(255, 255, 255, 0.04));
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid var(--border-light, #2e3038);
}

.system-time {
  opacity: 0.7;
}

/* Composer */
.chat-composer {
  padding: 1rem 1.5rem;
  background: var(--bg-surface, #24262f);
  border-top: 1px solid var(--border-light, #2e3038);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.composer-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.composer-input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.composer-textarea {
  flex: 1;
  resize: none;
  min-height: 48px;
  max-height: 120px;
  padding: 10px 12px;
  font-size: 0.88rem;
  line-height: 1.4;
  background: var(--bg-input, #1c1d22);
  border: 1px solid var(--border, #3b3e4a);
  color: var(--text-primary, #ffffff);
  border-radius: 8px;
}

.composer-textarea:focus {
  border-color: var(--gold, #d4af37);
  outline: none;
}

.send-btn {
  height: 48px;
  padding: 0 1.25rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.text-gold { color: var(--gold, #d4af37) !important; }
.text-success { color: #22c55e !important; }

/* Anexos de Arquivos com Expiração de 24h */
.bubble-attachments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.attachment-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.support-bubble .attachment-card {
  background: rgba(212, 175, 55, 0.08);
  border-color: rgba(212, 175, 55, 0.22);
}

.attachment-card.is-expired {
  opacity: 0.6;
  border-style: dashed;
  border-color: rgba(239, 68, 68, 0.3);
}

.attachment-icon {
  font-size: 1.25rem;
  color: var(--gold, #d4af37);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  flex-shrink: 0;
}

.attachment-meta {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary, #ffffff);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-info-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.73rem;
  color: var(--text-muted, #8b92a5);
  margin-top: 3px;
  flex-wrap: wrap;
}

.attachment-status-active {
  color: #38bdf8;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.attachment-status-expired {
  color: #f87171;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-download-att {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold, #d4af37);
  border: 1px solid rgba(212, 175, 55, 0.35);
  text-decoration: none;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-download-att:hover {
  background: var(--gold, #d4af37);
  color: #111827;
}

/* Botão de Clips e Preview no Composer */
.attach-clip-btn {
  height: 48px;
  width: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input, #1c1d22);
  border: 1px solid var(--border, #3b3e4a);
  color: var(--text-muted, #8b92a5);
  border-radius: 8px;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.attach-clip-btn:hover:not(:disabled) {
  border-color: var(--gold, #d4af37);
  color: var(--gold, #d4af37);
  background: rgba(212, 175, 55, 0.08);
}

.attach-clip-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.composer-attachment-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 8px;
  font-size: 0.8rem;
  gap: 8px;
}

.attachment-preview-info {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  flex-wrap: wrap;
}

.attachment-preview-name {
  font-weight: 600;
  color: var(--text-primary, #ffffff);
}

.attachment-exp-tag {
  color: #38bdf8;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.remove-attach-btn {
  background: none;
  border: none;
  color: var(--text-muted, #8b92a5);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.remove-attach-btn:hover {
  color: #f87171;
}

/* Responsividade Mobile e Telas Compactas */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
  }

  .ticket-details-modal-card,
  .ticket-details-modal-card.is-admin {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    max-width: 100vw;
    border-radius: 0;
    border: none;
  }

  .ticket-modal-header {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .header-actions {
    justify-content: space-between;
    width: 100%;
  }

  .ticket-meta-bar {
    padding: 0.75rem 1rem;
    gap: 8px 16px;
    font-size: 0.75rem;
  }

  .chat-timeline-container {
    padding: 1rem 0.75rem;
  }

  .chat-bubble {
    max-width: 90%;
  }

  .chat-composer {
    padding: 0.75rem 1rem;
  }

  .composer-input-row {
    gap: 6px;
  }

  .send-btn {
    padding: 0 1rem;
    font-size: 0.85rem;
  }

  .send-btn span {
    display: none;
  }
}
</style>
