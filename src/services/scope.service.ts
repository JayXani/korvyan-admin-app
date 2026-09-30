/**
 * scope.service.ts
 * Real response: { success, data: [{id, code}], meta: {total, total_in_page}, message }
 *
 * Estratégia:
 *   - API REST  → cria/deleta escopos (código)
 *   - Firestore → armazena description, created_at, updated_at
 *     Coleção: scopes/{code}
 */
import { apiPost, apiPatch, apiDelete } from './api'

export interface Scope {
  id?: string
  code: string
  name?: string
  description?: string
  created_at?: string
  updated_at?: string
}

// ─── Firestore helpers ────────────────────────────────────────────────────────



// ─── API pública ──────────────────────────────────────────────────────────────

const DEFAULT_SCOPE_DESCRIPTIONS: Record<string, string> = {
  'contracts.view': 'Visualizar listagem e detalhes de contratos',
  'contracts.create': 'Cadastrar novos contratos de clientes',
  'contracts.update': 'Editar informações de contratos existentes',
  'contracts.deactivate': 'Desativar ou cancelar contratos',
  'contracts.dependents.add': 'Adicionar dependentes a um contrato',
  'contracts.dependents.remove': 'Remover dependentes de um contrato',
  'contracts.writeOffPayment': 'Realizar baixa manual de pagamentos de contratos',
  'contracts.template.view': 'Visualizar modelos e minutas de contratos',
  'contracts.template.create': 'Criar novos modelos de contratos',
  'contracts.template.update': 'Editar modelos e cláusulas de contratos',
  'contracts.template.deactivate': 'Desativar modelos de contratos',

  'payment.create': 'Gerar novas cobranças e transações de pagamento',
  'payment.update': 'Alterar valores e vencimentos de pagamentos',
  'payment.delete': 'Excluir registros de cobranças e pagamentos',

  'plans.view': 'Visualizar planos de saúde/benefícios ativos',
  'plans.create': 'Cadastrar novos planos e valores de adesão',
  'plans.update': 'Editar coberturas e mensalidades de planos',
  'plans.delete': 'Excluir planos de benefícios',

  'operator.view': 'Visualizar perfis e dados de colaboradores',
  'operator.list.view': 'Consultar listagem completa de colaboradores',
  'operator.create': 'Cadastrar novos colaboradores no sistema',
  'operator.update': 'Editar dados cadastrais e cargos de colaboradores',
  'operator.delete': 'Excluir acesso de colaboradores',
  'operator.system.access': 'Conceder autorização de login no portal',
  'operator.scope.add': 'Atribuir escopos de permissão privada a colaboradores',
  'operator.scope.remove': 'Remover permissões privadas de colaboradores',

  'profiles.view': 'Visualizar cargos e permissões base',
  'profiles.create': 'Cadastrar novos cargos de acesso (ex: Gerente, Admin)',
  'profiles.update': 'Editar cargos e permissões padrão',
  'profiles.delete': 'Excluir cargos de acesso',

  'scopes.view': 'Visualizar dicionário de escopos de segurança',
  'scopes.create': 'Cadastrar novos escopos de sistema',
  'scopes.update': 'Editar descrições e nomes legíveis dos escopos',
  'scopes.delete': 'Excluir escopos do sistema',

  'applicant.view': 'Visualizar cadastro de clientes e dependentes',
  'applicant.create': 'Cadastrar novos clientes no sistema',
  'applicant.update': 'Editar dados de contato e pessoais de clientes',
  'applicant.delete': 'Excluir registros de clientes',

  'benefits.view': 'Visualizar catálogo de benefícios',
  'benefits.create': 'Cadastrar novos benefícios',
  'benefits.update': 'Editar vantagens e coberturas dos benefícios',
  'benefits.delete': 'Excluir benefícios cadastrados',

  'banks.view': 'Visualizar instituições bancárias para cobrança',
  'banks.create': 'Cadastrar novos bancos e convênios',
  'banks.update': 'Editar dados bancários e carteiras',
  'banks.delete': 'Excluir registros bancários',

  'religion.create': 'Cadastrar opções de religião',
  'religion.update': 'Editar cadastro de religiões',
  'religion.delete': 'Excluir cadastro de religiões',

  'status.list': 'Listar etapas e status de contratos',
  'status.create': 'Cadastrar novos status de acompanhamento',
  'status.update': 'Editar nomenclaturas de status',
  'status.delete': 'Excluir status de contratos',

  'logs.view': 'Visualizar histórico de auditoria e logs do servidor',
  'admin.view': 'Acesso à área administrativa global',
  'admin.create': 'Cadastrar novos administradores globais',
  'manager.view': 'Visualizar gerentes de equipe',
  'manager.create': 'Cadastrar novos gerentes de equipe',
  'manager.update': 'Editar permissões e gerentes de equipe',
  'manager.delete': 'Remover perfil de gerente de equipe',
  'manager.scope.add': 'Atribuir escopos a gerentes',
  'manager.scope.remove': 'Remover escopos de gerentes',
  'apiKey.use': 'Utilizar chaves de integração de API externa'
}

/** Lista todos os escopos, buscando nome e descrição do backend */
export async function getAllScopes(payload = {
  columns: { id: true, code: true, name: true, description: true },
  filters: {}
}, onEnriched?: (enriched: Scope[]) => void): Promise<Scope[]> {
  
  // Ensure name and description are requested
  if (payload.columns) {
    (payload.columns as any).name = true;
    (payload.columns as any).description = true;
  }

  let apiScopes: any[] = []
  try {
    const apiRaw = await apiPost<any>('/v1/scope/list', payload)
    apiScopes = Array.isArray(apiRaw) ? apiRaw : (apiRaw?.data ?? [])
  } catch (e) {
    console.warn('[ScopeService] Falha na API:', e)
  }

  const result = apiScopes.map((s: any) => {
    let rawDesc = s.description || DEFAULT_SCOPE_DESCRIPTIONS[s.code] || `Permissão do módulo ${s.code.split('.')[0]}`
    if (typeof rawDesc === 'string') {
      rawDesc = rawDesc.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
    }
    return {
      ...s,
      name: s.name || s.code,
      description: rawDesc
    }
  })

  if (onEnriched) {
    onEnriched(result)
  }

  return result
}

/** Cria escopo na API */
export async function createScope(code: string, description?: string): Promise<void> {
  await apiPost('/v1/scope/', [{ code, description }])
}

/** Atualiza description na API */
export async function updateScope(id: string, code: string, description?: string): Promise<void> {
  await apiPatch(`/v1/scope/${id}`, { description })
}

/** Deleta escopo da API */
export async function deleteScope(id: string, code: string): Promise<void> {
  await apiDelete('/v1/scope/', { ids: [id] })
}

/**
 * Formata o texto de descrição do escopo com suporte a:
 * - Quebras de linha (\n ou literais escapados)
 * - Negrito via asteriscos: *texto* ou **texto**
 */
export function formatScopeDescription(text?: string): string {
  if (!text) return ''
  const str = String(text).replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
  
  // Escapa entidades HTML por segurança
  const safe = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // Converte **texto** e *texto* para <strong>
  return safe
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
}
