/**
 * statusHelper.ts
 * Utilitários para normalização e checagem de tipos de status (contract vs payment/installments),
 * garantindo compatibilidade com o retorno em inglês e português do backend.
 */

export function normalizeStatusType(rawType: any): 'contract' | 'payment' | string {
  if (!rawType) return ''
  const t = String(typeof rawType === 'string' ? rawType : (rawType?.status_type || rawType?.type || '')).trim().toLowerCase()
  if (t === 'contract' || t === 'contrato') return 'contract'
  if (t === 'payment' || t === 'pagamento' || t === 'installments' || t === 'parcelas' || t === 'parcela') return 'payment'
  return t
}

export function isContractStatus(status: any): boolean {
  if (!status) return false
  const t = normalizeStatusType(status)
  return t === 'contract'
}

export function isPaymentStatus(status: any): boolean {
  if (!status) return false
  const t = normalizeStatusType(status)
  return t === 'payment'
}

export function getStatusTypeLabel(rawType: any): string {
  const norm = normalizeStatusType(rawType)
  if (norm === 'contract') return 'Contrato'
  if (norm === 'payment') return 'Pagamento'
  return String(rawType || 'Desconhecido')
}
