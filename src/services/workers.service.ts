import axios from 'axios'

const WORKERS_BASE_URL = import.meta.env.VITE_WORKERS_URL || 'https://southamerica-east1-korvyan-50830.cloudfunctions.net/api'

export const workersApi = axios.create({
  baseURL: WORKERS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Adiciona header de tenant automaticamente
workersApi.interceptors.request.use((config) => {
  const host = window.location.hostname
  const prefix = host.split('.')[0] || 'demo'
  config.headers['x-tenant-prefix'] = prefix
  return config
})

// ─── Storage Workers ──────────────────────────────────────────────────────────
export async function uploadFileViaWorker(file: File, path?: string, isPublic = true): Promise<{ path: string; url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  if (path) formData.append('path', path)
  formData.append('is_public', String(isPublic))

  const res = await workersApi.post('/api/storage/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function uploadTenantLogoViaWorker(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await workersApi.post('/api/storage/upload/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.url
}

export async function deleteFileViaWorker(urlOrPath: string): Promise<void> {
  await workersApi.delete('/api/storage/delete', { data: { url: urlOrPath } })
}

// ─── Mail Workers ─────────────────────────────────────────────────────────────
export async function sendEmailViaWorker(to: string | string[], message: { subject: string; text?: string; html?: string; _testConfig?: any }) {
  const res = await workersApi.post('/api/mail/send', { to, message })
  return res.data
}

export async function sendTemplateEmailViaWorker(to: string | string[], templateId: string, variables: Record<string, any> = {}) {
  const res = await workersApi.post('/api/mail/send-template', { to, template_id: templateId, variables })
  return res.data
}

export async function getEmailSettingsViaWorker(tenant?: string) {
  const res = await workersApi.get('/api/mail/settings', { params: { tenant } })
  return res.data.settings
}

export async function saveEmailSettingsViaWorker(settings: any, tenant?: string) {
  const res = await workersApi.post('/api/mail/settings', { settings, tenant_prefix: tenant })
  return res.data
}

export async function getEmailTemplatesViaWorker(tenant?: string) {
  const res = await workersApi.get('/api/mail/templates', { params: { tenant } })
  return res.data.templates
}

export async function saveEmailTemplateViaWorker(templateId: string, data: any, tenant?: string) {
  const res = await workersApi.post(`/api/mail/templates/${templateId}`, { ...data, tenant_prefix: tenant })
  return res.data
}

// ─── Status Metadata Workers ──────────────────────────────────────────────────
export async function getStatusMetadataMapViaWorker(tenant?: string) {
  const res = await workersApi.get('/api/status/metadata', { params: { tenant } })
  return res.data.metadata || {}
}

export async function saveStatusMetadataViaWorker(statusId: string, metadata: { icon?: string; name?: string }, tenant?: string) {
  const res = await workersApi.post(`/api/status/metadata/${statusId}`, { ...metadata, tenant_prefix: tenant })
  return res.data
}

// ─── Notifications Workers ────────────────────────────────────────────────────
export async function listNotificationsViaWorker(tenant?: string, limit = 30) {
  const res = await workersApi.get('/api/notifications', { params: { tenant, limit } })
  return res.data.notifications || []
}

export async function notifyTenantViaWorker(payload: { title: string; text: string; type?: string; icon?: string; color?: string }, tenant?: string) {
  const res = await workersApi.post('/api/notifications', { ...payload, tenant_prefix: tenant })
  return res.data
}

export async function markNotificationReadViaWorker(id: string, tenant?: string) {
  const res = await workersApi.patch(`/api/notifications/${id}/read`, { tenant_prefix: tenant })
  return res.data
}

// ─── Reports Workers ──────────────────────────────────────────────────────────
export async function getReportsViaWorker(tenant?: string) {
  const res = await workersApi.get('/api/reports', { params: { tenant } })
  return res.data.reports || []
}

export async function saveReportViaWorker(report: any) {
  const res = await workersApi.post('/api/reports', report)
  return res.data.id
}

export async function deleteReportViaWorker(id: string) {
  const res = await workersApi.delete(`/api/reports/${id}`)
  return res.data
}

// ─── Tenants Config Workers ───────────────────────────────────────────────────
export async function getAllTenantConfigsViaWorker() {
  const res = await workersApi.get('/api/tenants/configs')
  return res.data.configs || []
}

export async function getTenantConfigViaWorker(prefix: string) {
  const res = await workersApi.get(`/api/tenants/${prefix}/config`)
  return res.data.config
}

export async function saveTenantConfigViaWorker(prefix: string, config: any) {
  const res = await workersApi.post(`/api/tenants/${prefix}/config`, { config })
  return res.data
}

export async function deleteTenantConfigViaWorker(prefix: string) {
  const res = await workersApi.delete(`/api/tenants/${prefix}/config`)
  return res.data
}

export async function getUserAvatarViaWorker(prefix: string, userId: string): Promise<string> {
  const res = await workersApi.get(`/api/tenants/${prefix}/users/${userId}/avatar`)
  return res.data.avatar || ''
}

// ─── Deploy CI/CD Workers ─────────────────────────────────────────────────────
export interface DeployTriggerPayload {
  target: 'backend' | 'front' | 'workers' | 'admin-app' | 'pipeline'
  env?: 'dev' | 'prod'
  branch?: string
  author?: string
  sendEmail?: boolean
}

export async function triggerDeployViaWorker(payload: DeployTriggerPayload) {
  const res = await workersApi.post('/api/deploy/trigger', payload)
  return res.data
}

export async function getDeployStatusViaWorker(deployId: string) {
  const res = await workersApi.get(`/api/deploy/status/${deployId}`)
  return res.data.deploy
}

export async function getDeployHistoryViaWorker(limit = 20) {
  const res = await workersApi.get('/api/deploy/history', { params: { limit } })
  return res.data.history || []
}

export async function testSshConnectionViaWorker() {
  const res = await workersApi.post('/api/deploy/test-connection')
  return res.data
}

export function getDeployStreamUrl(deployId: string): string {
  return `${WORKERS_BASE_URL}/api/deploy/stream/${deployId}`
}
