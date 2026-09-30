/**
 * addons/index.ts — Registro central de todos os add-ons da plataforma Korvyan.
 * Cada addon possui uma chave única (key) que deve corresponder ao campo no
 * objeto addons do Firestore do tenant.
 */

export interface AddonMeta {
  key: string
  name: string
  shortName: string
  icon: string
  color: string
  description: string
}

export const ADDONS_REGISTRY: AddonMeta[] = [
  {
    key: 'ai_insights',
    name: 'Insights com IA',
    shortName: 'Insights',
    icon: 'fas fa-brain',
    color: '#a78bfa',
    description: 'Análise inteligente da carteira de contratos e indicadores preditivos',
  },
  {
    key: 'ai_ocr',
    name: 'OCR com IA',
    shortName: 'OCR',
    icon: 'fas fa-robot',
    color: '#fbbf24',
    description: 'Leitura automática de documentos de identidade via inteligência artificial',
  },
  {
    key: 'ai_chat',
    name: 'Chat Interno',
    shortName: 'Chat',
    icon: 'fas fa-comments',
    color: '#34d399',
    description: 'Chat em tempo real entre operadores do mesmo tenant',
  },
  {
    key: 'ai_financial',
    name: 'Assistente Financeiro IA',
    shortName: 'Finanças',
    icon: 'fas fa-coins',
    color: '#60a5fa',
    description: 'Projeções financeiras e análise de faturamento com IA',
  },
  {
    key: 'ai_templates',
    name: 'Gerador de Modelos IA',
    shortName: 'Modelos',
    icon: 'fas fa-file-signature',
    color: '#f472b6',
    description: 'Minutas de contratos e cláusulas geradas automaticamente por IA',
  },
  {
    key: 'ai_fraud',
    name: 'Detector de Fraudes IA',
    shortName: 'Fraude',
    icon: 'fas fa-shield-virus',
    color: '#f87171',
    description: 'Auditoria preditiva de sinistros e detecção de anomalias',
  },
  {
    key: 'whatsapp_bot',
    name: 'Bot WhatsApp',
    shortName: 'WhatsApp',
    icon: 'fab fa-whatsapp',
    color: '#25D366',
    description: 'Lembretes automatizados de boletos e vencimentos no WhatsApp',
  },
  {
    key: 'digital_signature',
    name: 'Assinatura Digital',
    shortName: 'Assinatura',
    icon: 'fas fa-pen-nib',
    color: '#0ea5e9',
    description: 'Assinatura digital com validade jurídica integrada aos contratos',
  },
  {
    key: 'custom_domain',
    name: 'Domínio Customizado',
    shortName: 'Domínio',
    icon: 'fas fa-globe',
    color: '#8b5cf6',
    description: 'URL com a marca da sua empresa (ex: app.suaempresa.com.br)',
  },
]

/**
 * Retorna o AddonMeta para uma chave específica, ou undefined se não existir.
 */
export function getAddonMeta(key: string): AddonMeta | undefined {
  return ADDONS_REGISTRY.find(a => a.key === key)
}
