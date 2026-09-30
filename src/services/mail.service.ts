/**
 * mail.service.ts — Envio de e-mails via korvyan-workers
 */
import { sendEmailViaWorker, sendTemplateEmailViaWorker } from './workers.service'

export interface EmailMessage {
  subject: string
  text?: string
  html?: string
  _testConfig?: any
}

export async function sendEmail(to: string | string[], message: EmailMessage) {
  return sendEmailViaWorker(to, message)
}

export async function sendTemplateEmail(to: string | string[], templateId: string, variables: Record<string, any> = {}) {
  return sendTemplateEmailViaWorker(to, templateId, variables)
}
