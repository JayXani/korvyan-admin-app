// src/data/emailTemplates.data.ts

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  trigger: string
  html: string
  vars: string[]
  enabled: boolean
  category: 'sistema' | 'usuario'
  preferenceKey?: string
}

export function createModernEmailHtml({
  badge,
  title,
  subtitle,
  greeting,
  description,
  infoRows = [],
  codeBlock = null,
  alertNote = null,
  btnText = null,
  btnUrl = '#',
  accentColor = '#d4af37'
}: {
  badge?: string
  title: string
  subtitle?: string
  greeting?: string
  description: string
  infoRows?: [string, string][]
  codeBlock?: { label: string; value: string } | null
  alertNote?: { text: string; color?: string; bg?: string } | null
  btnText?: string | null
  btnUrl?: string
  accentColor?: string
}): string {
  const infoRowsHtml = infoRows.length > 0 ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #161f32; border: 1px solid #223049; border-radius: 12px; overflow: hidden;">
      ${infoRows.map(([label, val], idx) => `
        <tr style="${idx < infoRows.length - 1 ? 'border-bottom: 1px solid #1f2c42;' : ''}">
          <td style="padding: 12px 18px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #818cf8; width: 38%; vertical-align: top;">
            ${label}
          </td>
          <td style="padding: 12px 18px; font-size: 14px; font-weight: 600; color: #f8fafc; vertical-align: top;">
            ${val}
          </td>
        </tr>
      `).join('')}
    </table>
  ` : ''

  const codeBlockHtml = codeBlock ? `
    <div style="margin: 20px 0; padding: 14px 18px; background-color: #0b0f19; border: 1px dashed #334155; border-radius: 10px;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 6px;">
        ${codeBlock.label}
      </div>
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px; font-weight: 700; color: #fbbf24; word-break: break-all; letter-spacing: 1px;">
        ${codeBlock.value}
      </div>
    </div>
  ` : ''

  const alertNoteHtml = alertNote ? `
    <div style="margin: 20px 0; padding: 14px 18px; background-color: ${alertNote.bg || 'rgba(212, 175, 55, 0.08)'}; border-left: 4px solid ${alertNote.color || accentColor}; border-radius: 6px; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
      ${alertNote.text}
    </div>
  ` : ''

  const btnHtml = btnText ? `
    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="${btnUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #aa820a 100%); color: #0b0f19; font-weight: 700; font-size: 14px; padding: 14px 34px; border-radius: 8px; text-decoration: none; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);">
        ${btnText}
      </a>
    </div>
  ` : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #080c14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #111827; border-radius: 16px; border: 1px solid #1f293d; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.45);">
          
          <!-- Accent Top Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #d4af37 0%, #f59e0b 50%, #d4af37 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 16px 36px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 3px; text-transform: uppercase;">
                      KORV<span style="color: #d4af37;">•</span>YAN
                    </span>
                  </td>
                </tr>
                ${badge ? `
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <span style="display: inline-block; background-color: rgba(212, 175, 55, 0.12); color: #fbbf24; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 9999px; font-size: 11px; padding: 4px 14px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;">
                      ${badge}
                    </span>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 16px 36px 32px 36px;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.35; margin: 0 0 8px 0; text-align: center;">
                ${title}
              </h1>
              ${subtitle ? `
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
                ${subtitle}
              </p>` : ''}
              
              <div style="height: 1px; background: #1e293b; margin: 16px 0 22px 0;"></div>

              ${greeting ? `
              <p style="color: #f1f5f9; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">
                ${greeting}
              </p>` : ''}

              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                ${description}
              </p>

              ${infoRowsHtml}
              ${codeBlockHtml}
              ${alertNoteHtml}
              ${btnHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; background-color: #0d121e; border-top: 1px solid #1a2233; text-align: center;">
              <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 8px 0;">
                Este é um e-mail transacional automático enviado pela plataforma Korvyan.
              </p>
              <p style="color: #475569; font-size: 11px; margin: 0;">
                &copy; ${new Date().getFullYear()} Korvyan &bull; Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export const defaultTemplates: EmailTemplate[] = [
  // ─── E-MAILS DO SISTEMA ───────────────────────────────────────────────────
  {
    id: 'novo_acesso',
    name: 'Novo Acesso (Boas-vindas)',
    subject: 'Bem-vindo ao portal Korvyan - Seus dados de acesso',
    trigger: 'Criação de Usuário (Admin)',
    category: 'sistema',
    vars: ['{{ name }}', '{{ login }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Conta Criada',
      title: 'Bem-vindo à Plataforma Korvyan',
      subtitle: 'Sua conta de acesso foi cadastrada com sucesso.',
      greeting: 'Olá, {{ name }}!',
      description: 'Sua conta de acesso à plataforma foi cadastrada com sucesso. Você já pode acessar o sistema utilizando suas credenciais cadastradas:',
      infoRows: [
        ['Nome', '{{ name }}'],
        ['Usuário / Login', '{{ login }}']
      ],
      alertNote: {
        text: '<strong>Dica de Segurança:</strong> Nunca compartilhe seu usuário e senha com terceiros. Mantenha suas credenciais sempre seguras.',
        color: '#818cf8',
        bg: 'rgba(99, 102, 241, 0.08)'
      },
      btnText: 'Acessar o Sistema',
      btnUrl: 'https://korvy.korvyan.com'
    })
  },
  {
    id: 'recuperar_senha',
    name: 'Recuperar Senha',
    subject: 'Instruções para redefinir sua senha',
    trigger: 'Manual / API',
    category: 'sistema',
    vars: ['{{ name }}', '{{ link }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Segurança da Conta',
      title: 'Redefinição de Senha',
      subtitle: 'Recebemos uma solicitação para cadastrar uma nova senha.',
      greeting: 'Olá, {{ name }}',
      description: 'Uma solicitação de redefinição de senha foi gerada para a sua conta. Se foi você quem solicitou, clique no botão seguro abaixo para prosseguir:',
      alertNote: {
        text: 'Se você não reconhece esta solicitação, desconsidere esta mensagem. Sua senha atual permanecerá segura e inalterada.',
        color: '#818cf8',
        bg: 'rgba(99, 102, 241, 0.08)'
      },
      btnText: 'Redefinir Minha Senha',
      btnUrl: '{{ link }}'
    })
  },
  {
    id: 'fatura_gerada',
    name: 'Boleto / Fatura',
    subject: 'Sua fatura Korvyan está disponível para pagamento',
    trigger: 'Faturamento Mensal',
    category: 'sistema',
    vars: ['{{ name }}', '{{ amount }}', '{{ due_date }}', '{{ barcode }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Cobrança Mensal',
      title: 'Nova Fatura Disponível',
      subtitle: 'O boleto referente ao seu ciclo de faturamento foi emitido.',
      greeting: 'Olá, {{ name }}',
      description: 'A sua fatura mensal já está pronta para pagamento. Confira os dados do título abaixo:',
      infoRows: [
        ['Valor', 'R$ {{ amount }}'],
        ['Vencimento', '{{ due_date }}']
      ],
      codeBlock: {
        label: 'Linha Digitável / Código de Barras',
        value: '{{ barcode }}'
      },
      alertNote: {
        text: 'Você também pode efetuar o pagamento via PIX Copia e Cola acessando o portal do solicitante.',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.08)'
      },
      btnText: 'Acessar Área do Cliente',
      btnUrl: 'https://korvy.korvyan.com'
    })
  },
  {
    id: 'fatura_atrasada',
    name: 'Cobrança Atrasada',
    subject: 'Aviso: Fatura em atraso - Evite a suspensão do plano',
    trigger: 'Rotina de Inadimplência',
    category: 'sistema',
    vars: ['{{ name }}', '{{ amount }}', '{{ due_date }}', '{{ barcode }}', '{{ days_late }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Aviso de Pendência',
      title: 'Fatura em Atraso',
      subtitle: 'Identificamos que a fatura indicada abaixo ainda consta como pendente.',
      greeting: 'Prezado(a) {{ name }},',
      description: 'Consta em nosso sistema uma fatura em aberto com data de vencimento expirada. Regularize para garantir a continuidade ininterrupta de todas as suas coberturas:',
      infoRows: [
        ['Valor em Aberto', 'R$ {{ amount }}'],
        ['Data de Vencimento', '{{ due_date }}'],
        ['Dias em Atraso', '{{ days_late }} dia(s)']
      ],
      codeBlock: {
        label: 'Linha Digitável para Pagamento',
        value: '{{ barcode }}'
      },
      alertNote: {
        text: '<strong>Atenção:</strong> Caso o pagamento já tenha sido efetuado nas últimas 48 horas úteis, favor desconsiderar este comunicado.',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.08)'
      },
      btnText: 'Regularizar no Portal',
      btnUrl: 'https://korvy.korvyan.com'
    })
  },
  {
    id: 'pagamento_confirmado',
    name: 'Pagamento Confirmado',
    subject: 'Pagamento recebido com sucesso!',
    trigger: 'Baixa de Fatura',
    category: 'sistema',
    vars: ['{{ name }}', '{{ amount }}', '{{ ref_month }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Confirmação',
      title: 'Pagamento Confirmado!',
      subtitle: 'A baixa da sua fatura foi processada no sistema com êxito.',
      greeting: 'Olá, {{ name }}',
      description: 'Confirmamos o recebimento e compensação do pagamento. Muito obrigado por manter suas mensalidades em dia!',
      infoRows: [
        ['Valor Quitado', 'R$ {{ amount }}'],
        ['Referência', '{{ ref_month }}'],
        ['Status', 'Compensado e Ativo']
      ],
      alertNote: {
        text: 'Seu recibo de quitação já se encontra disponível para consulta e download na sua Área do Cliente.',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.08)'
      },
      btnText: 'Acessar Comprovante',
      btnUrl: 'https://korvy.korvyan.com'
    })
  },
  {
    id: 'boas_vindas',
    name: 'Boas-vindas ao Plano',
    subject: 'Parabéns! Seu plano Korvyan já está ativo',
    trigger: 'Contrato Assinado',
    category: 'sistema',
    vars: ['{{ name }}', '{{ plan_name }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Contrato Ativo',
      title: 'Boas-vindas à Família Korvyan!',
      subtitle: 'Seu contrato foi formalizado e todas as coberturas estão ativas.',
      greeting: 'Parabéns, {{ name }}!',
      description: 'É uma satisfação imensa ter você conosco. Seu plano foi habilitado com sucesso e você e seus dependentes já podem usufruir de todos os benefícios contratados:',
      infoRows: [
        ['Titular', '{{ name }}'],
        ['Plano Contratado', '{{ plan_name }}'],
        ['Vigência', 'Ativa']
      ],
      btnText: 'Acessar Minha Área',
      btnUrl: 'https://korvy.korvyan.com'
    })
  },
  {
    id: 'renovacao_contrato',
    name: 'Renovação de Contrato',
    subject: 'Seu contrato Korvyan será renovado em breve',
    trigger: 'Expiração de Vigência',
    category: 'sistema',
    vars: ['{{ name }}', '{{ plan_name }}', '{{ expiration_date }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Vigência Contratual',
      title: 'Renovação de Contrato',
      subtitle: 'Seu plano está se aproximando do término do ciclo atual.',
      greeting: 'Olá, {{ name }}',
      description: 'Informamos que o seu contrato está programado para continuidade e renovação automática, garantindo tranquilidade sem interrupção dos serviços:',
      infoRows: [
        ['Plano', '{{ plan_name }}'],
        ['Data de Vencimento/Renovação', '{{ expiration_date }}']
      ],
      alertNote: {
        text: 'Caso deseje alterar planos, dependentes ou solicitar condições especiais, entre em contato com nossa equipe antes da data limite.',
        color: '#d4af37',
        bg: 'rgba(212, 175, 55, 0.08)'
      },
      btnText: 'Gerenciar Contrato',
      btnUrl: 'https://korvy.korvyan.com'
    })
  },
  {
    id: 'cancelamento_contrato',
    name: 'Cancelamento de Contrato',
    subject: 'Confirmação de Cancelamento de Contrato',
    trigger: 'Rescisão Contratual',
    category: 'sistema',
    vars: ['{{ name }}', '{{ plan_name }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Rescisão Contratual',
      title: 'Cancelamento Confirmado',
      subtitle: 'A rescisão do seu contrato foi concluída.',
      greeting: 'Olá, {{ name }}',
      description: 'Confirmamos o encerramento do plano indicado. Lamentamos a sua partida e agradecemos imensamente o tempo em que estivemos juntos.',
      infoRows: [
        ['Titular', '{{ name }}'],
        ['Plano Encerrado', '{{ plan_name }}'],
        ['Status', 'Cancelado']
      ],
      alertNote: {
        text: 'Nossas portas estarão sempre abertas caso você decida retornar. Se você não solicitou este cancelamento, entre em contato imediatamente.',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)'
      },
      btnText: 'Falar com Suporte',
      btnUrl: 'https://korvy.korvyan.com'
    })
  },
  {
    id: 'lembrete_cobranca',
    name: 'Lembrete de Cobrança',
    subject: 'Lembrete amigável: Sua fatura vence em breve',
    trigger: 'Pré-vencimento',
    category: 'sistema',
    vars: ['{{ name }}', '{{ amount }}', '{{ due_date }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Lembrete Preventivo',
      title: 'Fatura Próxima do Vencimento',
      subtitle: 'Um lembrete preventivo para você se programar tranquilamente.',
      greeting: 'Olá, {{ name }}',
      description: 'Passando para lembrar que a fatura mensal do seu plano está com vencimento próximo. Mantenha os pagamentos em dia para usufruir de todas as vantagens sem preocupações:',
      infoRows: [
        ['Valor da Fatura', 'R$ {{ amount }}'],
        ['Data de Vencimento', '{{ due_date }}']
      ],
      btnText: 'Ver Boleto no Portal',
      btnUrl: 'https://korvy.korvyan.com'
    })
  },
  {
    id: 'reajuste_anual',
    name: 'Reajuste Anual',
    subject: 'Comunicado: Aplicação de reajuste anual no contrato',
    trigger: 'Aniversário Contratual',
    category: 'sistema',
    vars: ['{{ name }}', '{{ percent }}', '{{ new_amount }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Reajuste de Contrato',
      title: 'Reajuste Anual Aplicado',
      subtitle: 'Atualização periódica de valores conforme cláusula contratual.',
      greeting: 'Olá, {{ name }}',
      description: 'Informamos a aplicação da correção monetária anual prevista em contrato, necessária para a manutenção do equilíbrio econômico e da qualidade dos serviços:',
      infoRows: [
        ['Índice de Reajuste', '{{ percent }}%'],
        ['Novo Valor Mensal', 'R$ {{ new_amount }}']
      ],
      alertNote: {
        text: 'O novo valor entrará em vigor a partir do próximo ciclo de faturamento.',
        color: '#818cf8',
        bg: 'rgba(99, 102, 241, 0.08)'
      },
      btnText: 'Visualizar Contrato',
      btnUrl: 'https://korvy.korvyan.com'
    })
  },

  // ─── E-MAILS DO USUÁRIO (NOTIFICAÇÕES & PREFERÊNCIAS) ────────────────────
  {
    id: 'aviso_login',
    name: 'Login em Novo Dispositivo',
    subject: 'Alerta de Acesso: Novo login detectado na sua conta',
    trigger: 'Autenticação no Portal',
    category: 'usuario',
    preferenceKey: 'new_device_login',
    vars: ['{{ name }}', '{{ login }}', '{{ date }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Segurança & Auditoria',
      title: 'Novo Acesso Detectado',
      subtitle: 'Identificamos um acesso recente à sua conta no sistema.',
      greeting: 'Olá, {{ name }}!',
      description: 'Um novo login foi realizado com as suas credenciais no portal Korvyan. Confira os detalhes do registro:',
      infoRows: [
        ['Usuário', '{{ login }}'],
        ['Data e Hora', '{{ date }}'],
        ['Canal de Acesso', 'Web Portal Korvyan']
      ],
      alertNote: {
        text: 'Se foi você, não é necessário fazer nada. <strong>Se você NÃO reconhece este acesso</strong>, altere imediatamente sua senha para proteger seus dados.',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)'
      },
      btnText: 'Proteger Minha Conta',
      btnUrl: 'https://korvy.korvyan.com/meu-perfil'
    })
  },
  {
    id: 'alerta_seguranca',
    name: 'Alerta de Segurança',
    subject: 'Alerta Crítico de Segurança na sua conta',
    trigger: 'Atividade Suspeita / Bloqueio',
    category: 'usuario',
    preferenceKey: 'security_alert',
    vars: ['{{ name }}', '{{ details }}', '{{ date }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Alerta Crítico',
      title: 'Atividade de Segurança Detectada',
      subtitle: 'Nossa camada de proteção identificou um evento relevante.',
      greeting: 'Atenção, {{ name }}',
      description: 'O sistema registrou uma ação sensível ou tentativa de acesso atípica associada ao seu perfil:',
      infoRows: [
        ['Evento Registrado', '{{ details }}'],
        ['Horário da Ocorrência', '{{ date }}']
      ],
      alertNote: {
        text: 'Caso suspeite de atividade não autorizada, bloqueie o acesso ou altere suas credenciais agora mesmo.',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.08)'
      },
      btnText: 'Revisar Segurança',
      btnUrl: 'https://korvy.korvyan.com/meu-perfil'
    })
  },
  {
    id: 'alteracao_perfil',
    name: 'Alteração de Perfil',
    subject: 'Confirmação: Seus dados cadastrais foram atualizados',
    trigger: 'Edição de Dados / Senha',
    category: 'usuario',
    preferenceKey: 'profile_update',
    vars: ['{{ name }}', '{{ date }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Cadastro Atualizado',
      title: 'Dados Cadastrais Alterados',
      subtitle: 'Alterações no seu cadastro foram gravadas com sucesso.',
      greeting: 'Olá, {{ name }}',
      description: 'Confirmamos que os dados do seu perfil ou preferências de acesso foram atualizados com sucesso.',
      infoRows: [
        ['Usuário', '{{ name }}'],
        ['Data da Alteração', '{{ date }}'],
        ['Status', 'Gravado com Sucesso']
      ],
      alertNote: {
        text: 'Se você não realizou essas modificações, entre em contato imediatamente com o administrador da sua empresa.',
        color: '#d4af37',
        bg: 'rgba(212, 175, 55, 0.08)'
      },
      btnText: 'Conferir Meu Perfil',
      btnUrl: 'https://korvy.korvyan.com/meu-perfil'
    })
  },
  {
    id: 'novo_chamado',
    name: 'Novo Chamado de Suporte',
    subject: 'Chamado #{{ ticket_id }} registrado com sucesso',
    trigger: 'Ticket Aberto',
    category: 'usuario',
    preferenceKey: 'ticket_updates',
    vars: ['{{ name }}', '{{ ticket_id }}', '{{ title }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Suporte Técnico',
      title: 'Chamado Registrado',
      subtitle: 'Seu ticket foi encaminhado para a equipe de atendimento.',
      greeting: 'Olá, {{ name }}',
      description: 'Confirmamos o registro do seu chamado de suporte. Nossa equipe já foi notificada e retornará em breve:',
      infoRows: [
        ['Protocolo', '#{{ ticket_id }}'],
        ['Assunto / Título', '{{ title }}'],
        ['Status Inicial', 'Aberto / Em Análise']
      ],
      btnText: 'Acompanhar Chamado',
      btnUrl: 'https://korvy.korvyan.com/ajuda'
    })
  },
  {
    id: 'atualizacao_chamado',
    name: 'Atualização no Chamado',
    subject: 'Atualização no chamado #{{ ticket_id }}',
    trigger: 'Ticket Respondido',
    category: 'usuario',
    preferenceKey: 'ticket_updates',
    vars: ['{{ name }}', '{{ ticket_id }}', '{{ status }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Suporte Técnico',
      title: 'Nova Resposta no Chamado',
      subtitle: 'Houve uma nova interação no seu ticket de suporte.',
      greeting: 'Olá, {{ name }}',
      description: 'Seu chamado recebeu uma nova mensagem ou teve o status atualizado pela equipe técnica:',
      infoRows: [
        ['Protocolo', '#{{ ticket_id }}'],
        ['Novo Status', '{{ status }}']
      ],
      btnText: 'Ver Mensagem no Portal',
      btnUrl: 'https://korvy.korvyan.com/ajuda'
    })
  },
  {
    id: 'relatorio_disponivel',
    name: 'Relatório Disponível',
    subject: 'Seu relatório está pronto para download',
    trigger: 'Geração Concluída',
    category: 'usuario',
    preferenceKey: 'report_available',
    vars: ['{{ name }}', '{{ report_name }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Relatórios & Exportações',
      title: 'Relatório Processado',
      subtitle: 'O documento solicitado foi gerado com êxito.',
      greeting: 'Olá, {{ name }}',
      description: 'O relatório que você solicitou foi compilado pelo sistema e está disponível para visualização e exportação:',
      infoRows: [
        ['Nome do Relatório', '{{ report_name }}'],
        ['Status', 'Pronto para Download']
      ],
      btnText: 'Baixar Relatório',
      btnUrl: 'https://korvy.korvyan.com/relatorios'
    })
  },
  {
    id: 'novo_solicitante',
    name: 'Novo Solicitante',
    subject: 'Novo solicitante registrado no sistema',
    trigger: 'Cadastro de Solicitante',
    category: 'usuario',
    preferenceKey: 'new_requester',
    vars: ['{{ name }}', '{{ requester_name }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Gestão de Clientes',
      title: 'Novo Solicitante Cadastrado',
      subtitle: 'Um novo solicitante foi incorporado à sua carteira.',
      greeting: 'Olá, {{ name }}',
      description: 'Um novo cadastro de solicitante foi concluído com sucesso e vinculado à sua base de atendimento:',
      infoRows: [
        ['Solicitante', '{{ requester_name }}'],
        ['Responsável', '{{ name }}'],
        ['Status', 'Ativo']
      ],
      btnText: 'Ver Solicitantes',
      btnUrl: 'https://korvy.korvyan.com/solicitantes'
    })
  },
  {
    id: 'novo_documento',
    name: 'Novo Documento Anexado',
    subject: 'Novo documento anexado ao seu contrato',
    trigger: 'Upload de Arquivo',
    category: 'usuario',
    preferenceKey: 'new_document',
    vars: ['{{ name }}', '{{ doc_name }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Documentação Digital',
      title: 'Documento Anexado',
      subtitle: 'Um novo arquivo foi vinculado com segurança ao contrato.',
      greeting: 'Olá, {{ name }}',
      description: 'Um novo documento foi anexado ao seu prontuário digital e está disponível para consulta protegida:',
      infoRows: [
        ['Arquivo', '{{ doc_name }}'],
        ['Titular', '{{ name }}'],
        ['Armazenamento', 'Protegido e Criptografado']
      ],
      btnText: 'Consultar Documentos',
      btnUrl: 'https://korvy.korvyan.com/contratos'
    })
  },
  {
    id: 'manutencao_sistema',
    name: 'Manutenção do Sistema',
    subject: 'Comunicado: Janela de manutenção programada',
    trigger: 'Aviso Global',
    category: 'usuario',
    preferenceKey: 'system_maintenance',
    vars: ['{{ name }}', '{{ date }}', '{{ duration }}'],
    enabled: true,
    html: createModernEmailHtml({
      badge: 'Manutenção Preventiva',
      title: 'Janela de Atualização',
      subtitle: 'Melhorias de desempenho e segurança programadas.',
      greeting: 'Prezado(a) {{ name }},',
      description: 'Informamos que realizaremos uma janela de manutenção programada na nossa infraestrutura de servidores para aplicação de melhorias contínuas:',
      infoRows: [
        ['Data e Horário', '{{ date }}'],
        ['Duração Prevista', '{{ duration }}'],
        ['Impacto Previsto', 'Possível instabilidade temporária']
      ],
      alertNote: {
        text: 'Nenhum dado ou cadastro será impactado durante o procedimento. Agradecemos a compreensão.',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.08)'
      },
      btnText: 'Acessar Plataforma',
      btnUrl: 'https://korvy.korvyan.com'
    })
  }
]
