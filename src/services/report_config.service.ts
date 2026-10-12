/**
 * report_config.service.ts — Gerenciamento de configurações e templates de relatórios dinâmicos
 * Rotas do backend: /v1/reports/config/fields
 */

import { apiPost, apiGet } from './api'

export interface ReportConfigField {
  id?: string
  code: string
  label: string
  source_domain: string
  field_type: 'string' | 'number' | 'date' | 'boolean'
  is_selectable: boolean
  is_filterable: boolean
  is_sortable: boolean
}

export interface ReportConfigDefinition {
  id?: string
  report_name: string
  report_type: 'contract' | 'financial'
  is_active: boolean
  fields: ReportConfigField[]
  sources_domain?: string[]
  created_at?: string
  updated_at?: string
}

/**
 * Lista todas as configurações de relatórios cadastradas
 */
export async function listReportConfigs(): Promise<ReportConfigDefinition[]> {
  try {
    const res = await apiPost<any>('/v1/reports/config/fields/list/', {
      columns: {
        id: true,
        report_name: true,
        report_type: true,
        is_active: true,
        fields: {
          code: true,
          label: true,
          source_domain: true,
          field_type: true,
          is_selectable: true,
          is_filterable: true,
          is_sortable: true
        }
      },
      filters: {},
      offset: 0
    })

    const items = res?.data?.data || res?.data || res || []
    return Array.isArray(items) ? items : []
  } catch (err) {
    console.warn('[ReportConfigService] Falha ao listar configurações:', err)
    return []
  }
}

/**
 * Busca uma configuração de relatório por ID com lista de domínios permitidos
 */
export async function getReportConfigById(id: string): Promise<ReportConfigDefinition | null> {
  try {
    const res = await apiGet<any>(`/v1/reports/config/fields/${id}`)
    const data = res?.data?.data || res?.data || res
    if (Array.isArray(data) && data.length > 0) return data[0]
    return data || null
  } catch (err) {
    console.error(`[ReportConfigService] Erro ao buscar config ${id}:`, err)
    return null
  }
}

/**
 * Cria ou publica uma nova configuração de relatório no domínio central (Core)
 */
export async function createReportConfig(payload: {
  report_name: string
  report_type: 'contract' | 'financial'
  is_active: boolean
  fields: ReportConfigField[]
}): Promise<any> {
  return await apiPost<any>('/v1/reports/config/fields', payload)
}

/**
 * Presets oficiais recomendados da plataforma Korvyan para Contratos e Financeiro
 */
export function getDefaultPresets(): Record<'contract' | 'financial', ReportConfigDefinition> {
  return {
    contract: {
      report_name: 'Relatório Geral de Contratos',
      report_type: 'contract',
      is_active: true,
      fields: [
        { code: 'code', label: 'Código do Contrato', source_domain: 'contract', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'name', label: 'Nome / Identificador', source_domain: 'contract', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'value_enrollment', label: 'Valor de Adesão', source_domain: 'contract', field_type: 'number', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'payment_recurrence_type', label: 'Recorrência de Pagamento', source_domain: 'contract', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'date_enrollment', label: 'Data de Adesão', source_domain: 'contract', field_type: 'date', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'start_at', label: 'Data de Início da Vigência', source_domain: 'contract', field_type: 'date', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'end_at', label: 'Data de Fim da Vigência', source_domain: 'contract', field_type: 'date', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'grace_period', label: 'Possui Carência', source_domain: 'contract', field_type: 'boolean', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'grace_period_days', label: 'Dias de Carência', source_domain: 'contract', field_type: 'number', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'observations', label: 'Observações do Contrato', source_domain: 'contract', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: false },
        { code: 'name', label: 'Nome do Banco', source_domain: 'banks', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'identifier_code', label: 'Código de Compensação do Banco', source_domain: 'banks', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'type_plan', label: 'Nome / Categoria do Plano', source_domain: 'plans', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'price', label: 'Mensalidade do Plano', source_domain: 'plans', field_type: 'number', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'name', label: 'Status do Contrato', source_domain: 'status', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'status_type', label: 'Tipo do Status', source_domain: 'status', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'family_relationship_type', label: 'Grau de Parentesco', source_domain: 'dependents', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'is_primary_holder', label: 'É Titular Principal', source_domain: 'dependents', field_type: 'boolean', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'name', label: 'Nome do Titular / Solicitante', source_domain: 'dependents.applicant.person', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'email', label: 'E-mail do Titular', source_domain: 'dependents.applicant.person', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'gender', label: 'Gênero do Titular', source_domain: 'dependents.applicant.person', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'date_birthday', label: 'Data de Nascimento', source_domain: 'dependents.applicant.person', field_type: 'date', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'pair', label: 'Número da Parcela', source_domain: 'installments', field_type: 'number', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'amount', label: 'Valor da Parcela', source_domain: 'installments', field_type: 'number', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'due_at', label: 'Data de Vencimento da Parcela', source_domain: 'installments', field_type: 'date', is_selectable: true, is_filterable: true, is_sortable: true }
      ]
    },
    financial: {
      report_name: 'Relatório Financeiro & Arrecadação',
      report_type: 'financial',
      is_active: true,
      fields: [
        { code: 'total', label: 'Valor do Pagamento', source_domain: 'financial', field_type: 'number', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'method', label: 'Forma de Pagamento (PIX, Boleto, Cartão)', source_domain: 'financial', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'payment_type', label: 'Tipo de Cobrança', source_domain: 'financial', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'name', label: 'Banco Recebedor', source_domain: 'bank', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'name', label: 'Status da Liquidação', source_domain: 'status', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'status_type', label: 'Tipo de Status', source_domain: 'status', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'amount', label: 'Valor Nominal da Parcela', source_domain: 'installments', field_type: 'number', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'due_at', label: 'Vencimento Original', source_domain: 'installments', field_type: 'date', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'pair', label: 'Parcela', source_domain: 'installments', field_type: 'number', is_selectable: true, is_filterable: true, is_sortable: true },
        { code: 'code', label: 'Código do Contrato Vinculado', source_domain: 'contract', field_type: 'string', is_selectable: true, is_filterable: true, is_sortable: true }
      ]
    }
  }
}
