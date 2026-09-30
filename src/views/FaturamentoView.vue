<template>
  <div class="faturamento-container">
    <!-- Header Principal -->
    <div class="bo-page-header">
      <div class="bo-page-header-left">
        <div class="title-with-badge">
          <h1>Faturamento & Gateways</h1>
          <span class="badge-bo">ADMIN</span>
        </div>
        <p>Gestão centralizada de cobranças, MRR, integração de gateways e emissão de boletos/PIX para tenants.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="loadTenants" :disabled="loading" title="Atualizar Lista">
          <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
          <span>Atualizar</span>
        </button>
      </div>
    </div>

    <!-- 1. Cards de Métricas KPI no topo -->
    <div class="kpi-grid">
      <!-- KPI 1: MRR -->
      <div class="kpi-card kpi-highlight">
        <div class="kpi-icon gold-bg">
          <i class="fas fa-coins"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Receita Recorrente (MRR)</span>
          <span class="kpi-value valor-gold">{{ formatCurrency(totalMRR) }}</span>
          <span class="kpi-sub">Soma das mensalidades ativas</span>
        </div>
      </div>

      <!-- KPI 2: Quantidade de Empresas Faturáveis -->
      <div class="kpi-card">
        <div class="kpi-icon green-bg">
          <i class="fas fa-building-circle-check"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Empresas Faturáveis</span>
          <span class="kpi-value">
            {{ activeTenants.length }}
            <span class="kpi-total">/ {{ tenants.length }} total</span>
          </span>
          <span class="kpi-sub">{{ activeWithPriceCount }} com valor cadastrado</span>
        </div>
      </div>

      <!-- KPI 3: Ticket Médio -->
      <div class="kpi-card">
        <div class="kpi-icon purple-bg">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Ticket Médio</span>
          <span class="kpi-value">{{ formatCurrency(averageTicket) }}</span>
          <span class="kpi-sub">Média por tenant ativo</span>
        </div>
      </div>

      <!-- KPI 4: Status do Gateway Ativo -->
      <div class="kpi-card">
        <div class="kpi-icon blue-bg">
          <i class="fas fa-network-wired"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Gateway de Cobrança</span>
          <div class="gateway-status-line">
            <span class="gateway-name">{{ activeGatewayLabel }}</span>
            <span class="gateway-badge" :class="gatewayStatus.badgeClass">
              <span class="status-pulse-dot" :class="gatewayStatus.dotClass"></span>
              {{ gatewayStatus.text }}
            </span>
          </div>
          <span class="kpi-sub">{{ gatewayStatus.subtext }}</span>
        </div>
      </div>
    </div>

    <!-- Conta e Configuração de Faturamento / Gateway -->
    <div class="card gateway-card">
      <div class="card-section-header">
        <div class="card-title-icon">
          <i class="fas fa-building-columns"></i>
        </div>
        <div>
          <h4>Configuração do Gateway de Pagamento</h4>
          <p class="section-desc">Defina as credenciais bancárias e os métodos de recebimento para o faturamento dos portais.</p>
        </div>
      </div>

      <div class="gateway-form-grid">
        <div class="form-field">
          <label class="form-label">GATEWAY DE PAGAMENTO</label>
          <select class="filter-select full-width" v-model="billingAccount.gateway">
            <option value="custom">Integração Própria (PIX Direto sem Taxas)</option>
            <option value="asaas">Asaas (Padrão)</option>
            <option value="cora">Cora Bank</option>
            <option value="iugu">Iugu</option>
            <option value="pagarme">Pagar.me</option>
          </select>
        </div>

        <div class="form-field" v-if="billingAccount.gateway !== 'custom'">
          <label class="form-label">TOKEN DA API (SECRET KEY)</label>
          <input
            type="password"
            class="filter-select full-width"
            v-model="billingAccount.apiToken"
            placeholder="sk_test_... ou secret key do gateway"
          />
        </div>
        <div class="form-field" v-else>
          <label class="form-label">URL DO SEU WEBHOOK (OPCIONAL)</label>
          <input
            type="url"
            class="filter-select full-width"
            v-model="billingAccount.webhookUrl"
            placeholder="https://sua-api.com/webhook/pix"
          />
        </div>

        <div class="form-field">
          <label class="form-label">RAZÃO SOCIAL (BENEFICIÁRIO)</label>
          <input
            type="text"
            class="filter-select full-width"
            v-model="billingAccount.name"
            placeholder="Korvyan Tecnologia LTDA"
          />
        </div>

        <div class="form-field">
          <label class="form-label">CNPJ DO BENEFICIÁRIO</label>
          <input
            type="text"
            class="filter-select full-width"
            v-model="billingAccount.cnpj"
            placeholder="00.000.000/0001-00"
          />
        </div>

        <div class="form-field" :class="{ 'full-span': billingAccount.gateway === 'custom' }">
          <label class="form-label">
            CHAVE PIX (OBRIGATÓRIO PARA INTEGRAÇÃO PRÓPRIA)
          </label>
          <input
            type="text"
            class="filter-select full-width"
            v-model="billingAccount.pixKey"
            placeholder="CNPJ, E-mail, Chave Aleatória ou Telefone"
          />
        </div>
      </div>

      <!-- Banner Informativo PIX Próprio -->
      <div v-if="billingAccount.gateway === 'custom'" class="gateway-info-banner">
        <i class="fas fa-bolt banner-icon"></i>
        <div>
          <strong>PIX Estático / BR Code NATIVO:</strong>
          <span> Os pagamentos são transferidos 100% diretamente para sua conta bancária sem intermediação, sem taxa de transação e com liquidação em tempo real.</span>
        </div>
      </div>

      <!-- Banner Informativo API Gateway -->
      <div v-else class="gateway-info-banner api-banner">
        <i class="fas fa-shield-halved banner-icon"></i>
        <div>
          <strong>Gateway {{ activeGatewayLabel }} Ativo:</strong>
          <span> Boletos registrados e cobranças com conciliação automática via webhook do provedor contratado.</span>
        </div>
      </div>

      <div class="gateway-footer">
        <button class="btn btn-primary btn-save-config" @click="saveBillingAccount">
          <i class="fas fa-check"></i>
          <span>Salvar Configurações de Cobrança</span>
        </button>
      </div>
    </div>

    <!-- 2. Barra de Busca, Filtros Rápidos e Tabela de Tenants -->
    <div class="card billing-table-card">
      <div class="table-toolbar">
        <div class="search-input-wrapper">
          <i class="fas fa-magnifying-glass search-icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nome da empresa ou prefixo..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''" title="Limpar busca">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="filters-group">
          <!-- Filtro por Plano -->
          <div class="filter-item">
            <label class="filter-label"><i class="fas fa-layer-group"></i> Plano:</label>
            <select v-model="filterPlan" class="filter-select">
              <option value="all">Todos os Planos</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <!-- Filtro por Status -->
          <div class="filter-item">
            <label class="filter-label"><i class="fas fa-circle-dot"></i> Status:</label>
            <select v-model="filterStatus" class="filter-select">
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos / Bloqueados</option>
            </select>
          </div>

          <div class="results-badge">
            <span>{{ filteredTenants.length }} {{ filteredTenants.length === 1 ? 'empresa' : 'empresas' }}</span>
          </div>
        </div>
      </div>

      <!-- 3. Polimento da Tabela de Cobrança dos Tenants -->
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="min-width: 260px;">TENANT / EMPRESA</th>
              <th style="width: 220px; min-width: 190px;">MENSALIDADE BASE</th>
              <th style="width: 140px; min-width: 120px;">STATUS</th>
              <th style="width: 210px; min-width: 190px; text-align: right;">AÇÕES DE COBRANÇA</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="text-center-loading">
                <i class="fas fa-spinner fa-spin"></i> Carregando tenants e mensalidades...
              </td>
            </tr>
            <tr v-else-if="filteredTenants.length === 0">
              <td colspan="4" class="empty-state-cell">
                <div class="empty-state-content">
                  <i class="fas fa-building-circle-exclamation"></i>
                  <p>Nenhuma empresa encontrada com os filtros selecionados.</p>
                  <button class="btn btn-outline btn-sm" @click="clearFilters">Limpar Filtros</button>
                </div>
              </td>
            </tr>
            <tr v-for="t in filteredTenants" :key="t.tenant_prefix" class="tenant-row">
              <td>
                <div class="tenant-meta-cell">
                  <div
                    class="tenant-avatar"
                    :style="{ background: (t.primary_color as string) || 'var(--gold)' }"
                  >
                    {{ (t.name || t.tenant_prefix).substring(0, 2).toUpperCase() }}
                  </div>
                  <div class="tenant-info">
                    <strong class="tenant-name">{{ t.name || t.tenant_prefix }}</strong>
                    <div class="tenant-tags">
                      <code class="prefix-tag">{{ t.tenant_prefix }}</code>
                      <span class="plan-tag">Plano: {{ t.plan || 'Standard' }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div class="price-cell">
                  <span class="valor-gold">{{ formatCurrency(t.addon_values?.monthly_price || 0) }}</span>
                  <button
                    class="quick-edit-btn"
                    @click="openPriceModal(t)"
                    title="Editar valor da mensalidade"
                  >
                    <i class="fas fa-pen-to-square"></i>
                    <span>Editar</span>
                  </button>
                </div>
              </td>
              <td>
                <span class="badge-status" :class="isTenantActive(t) ? 'badge-ativo' : 'badge-bloqueado'">
                  <span class="status-dot"></span>
                  {{ isTenantActive(t) ? 'ATIVO' : 'BLOQUEADO' }}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="row-actions">
                  <button
                    class="btn btn-cobrar"
                    @click="openBillingModal(t)"
                    title="Gerar Cobrança (PIX / Boleto)"
                  >
                    <i class="fas fa-bolt"></i>
                    <span>Cobrar (PIX / Boleto)</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: Edição Rápida de Mensalidade com feedback imediato -->
    <div v-if="priceModal" class="modal-overlay" @click.self="priceModal = false">
      <div class="modal-content modal-price-edit">
        <div class="modal-header">
          <div class="modal-title-with-icon">
            <i class="fas fa-pen-to-square"></i>
            <h3>Editar Mensalidade</h3>
          </div>
          <button class="close-btn" @click="priceModal = false"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="tenant-card-preview">
            <span class="preview-label">Empresa Selecionada:</span>
            <strong class="preview-name">{{ selectedTenant?.name }}</strong>
            <code class="preview-prefix">{{ selectedTenant?.tenant_prefix }}</code>
          </div>

          <p class="modal-helper-text">
            Defina o valor base cobrado mensalmente deste tenant. Este valor será refletido no cálculo do MRR e na emissão de boletos/PIX.
          </p>

          <div class="form-field">
            <label class="form-label">VALOR DA MENSALIDADE (R$)</label>
            <div class="price-input-wrapper">
              <span class="currency-prefix">R$</span>
              <input
                v-model="tempPrice"
                type="number"
                step="0.01"
                min="0"
                max="1000000000"
                @input="tempPrice = String(Math.min(Number(tempPrice) || 0, 1000000000))"
                class="filter-select price-input"
                placeholder="Ex: 450.00"
                @keyup.enter="savePrice"
                ref="priceInputRef"
              />
            </div>
          </div>

          <div class="modal-actions-stacked">
            <button
              class="btn btn-primary btn-save-price"
              @click="savePrice"
              :disabled="savingPrice"
            >
              <i class="fas fa-save" v-if="!savingPrice"></i>
              <i class="fas fa-spinner fa-spin" v-else></i>
              <span>{{ savingPrice ? 'Salvando Alteração...' : 'Salvar Mensalidade' }}</span>
            </button>
            <button class="btn btn-outline" @click="priceModal = false">Cancelar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. MODAL: Gerar Cobrança (Boleto & PIX) -->
    <div v-if="billingModal" class="modal-overlay" @click.self="billingModal = false">
      <div class="modal-content modal-billing">
        <div class="modal-header">
          <div class="modal-title-with-icon">
            <i class="fas fa-receipt"></i>
            <h3>Cobrança — {{ selectedTenant?.name }}</h3>
          </div>
          <button class="close-btn" @click="billingModal = false"><i class="fas fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <!-- Tabs Boleto / PIX -->
          <div class="billing-tabs-nav">
            <button
              class="tab-btn"
              :class="{ active: billingType === 'pix' }"
              @click="switchToPix"
            >
              <i class="fas fa-qrcode"></i>
              <span>PIX Instantâneo</span>
            </button>
            <button
              class="tab-btn"
              :class="{ active: billingType === 'boleto' }"
              @click="billingType = 'boleto'"
            >
              <i class="fas fa-barcode"></i>
              <span>Boleto Bancário</span>
            </button>
          </div>

          <!-- TAB: PIX -->
          <div v-if="billingType === 'pix'" class="tab-pane-pix">
            <div class="pix-charge-header">
              <span class="charge-label">Total a Pagar via PIX:</span>
              <span class="charge-amount valor-gold">{{ formatCurrency(basePrice) }}</span>
              <span class="charge-subtitle">Baixa automática sem taxas adicionais</span>
            </div>

            <div class="qr-preview-container">
              <div class="qr-box">
                <img v-if="pixQrUrl" :src="pixQrUrl" alt="QR Code PIX" class="qr-img" />
                <div v-else class="qr-loading-box">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>Gerando QR Code...</span>
                </div>
              </div>
              <span class="qr-scan-instruction">
                <i class="fas fa-camera"></i> Aponte a câmera do aplicativo do seu banco para ler o QR Code
              </span>
            </div>

            <!-- Botão de Cópia com feedback visual de sucesso -->
            <div class="pix-copy-section">
              <label class="form-label">CÓDIGO PIX COPIA E COLA</label>
              <div class="copy-input-group">
                <input
                  type="text"
                  readonly
                  :value="pixPayload"
                  class="filter-select font-mono pix-input"
                  placeholder="Gerando código BR Code..."
                />
                <button
                  class="btn btn-copy"
                  :class="{ 'btn-copied': pixCopied }"
                  @click="copyPix"
                  title="Copiar código PIX"
                >
                  <i :class="pixCopied ? 'fas fa-check' : 'fas fa-copy'"></i>
                  <span>{{ pixCopied ? 'Chave PIX copiada!' : 'Copiar' }}</span>
                </button>
              </div>
            </div>

            <!-- Resumo detalhado da cobrança PIX -->
            <div class="charge-details-summary">
              <div class="summary-header">
                <i class="fas fa-info-circle"></i>
                <span>Resumo Detalhado da Transação</span>
              </div>
              <div class="summary-grid-details">
                <div class="summary-item">
                  <span class="s-label">Tenant / Pagador:</span>
                  <span class="s-val">{{ selectedTenant?.name }} (<code>{{ selectedTenant?.tenant_prefix }}</code>)</span>
                </div>
                <div class="summary-item">
                  <span class="s-label">Beneficiário:</span>
                  <span class="s-val">{{ billingAccount.name }}</span>
                </div>
                <div class="summary-item">
                  <span class="s-label">CNPJ Beneficiário:</span>
                  <span class="s-val">{{ billingAccount.cnpj }}</span>
                </div>
                <div class="summary-item">
                  <span class="s-label">Chave PIX Destino:</span>
                  <span class="s-val font-mono">{{ billingAccount.pixKey || 'Chave padrão' }}</span>
                </div>
                <div class="summary-item">
                  <span class="s-label">Tipo de Liquidação:</span>
                  <span class="s-val text-success font-semibold">Instantânea (24h / 7 dias)</span>
                </div>
              </div>
            </div>

            <div class="modal-footer-actions">
              <button class="btn btn-outline" @click="downloadQrCode">
                <i class="fas fa-download"></i> Baixar Imagem QR
              </button>
              <button class="btn btn-primary btn-mail" @click="openEmailModal('PIX')">
                <i class="fas fa-envelope"></i> Enviar por E-mail
              </button>
            </div>
          </div>

          <!-- TAB: BOLETO -->
          <div v-if="billingType === 'boleto'" class="tab-pane-boleto">
            <!-- Seleção de meses com cálculo dinâmico de desconto -->
            <div class="form-field">
              <label class="form-label">SELEÇÃO DE PERÍODO & DESCONTO</label>
              <div class="period-selector-grid">
                <div
                  v-for="(info, months) in boletoDiscounts"
                  :key="months"
                  class="period-card"
                  :class="{ active: boletoMonths === Number(months) }"
                  @click="boletoMonths = Number(months)"
                >
                  <div class="period-header">
                    <span class="period-months">{{ months }} {{ Number(months) === 1 ? 'Mês' : 'Meses' }}</span>
                    <span v-if="info.rate > 0" class="discount-pill">-{{ info.rate * 100 }}%</span>
                  </div>
                  <div class="period-pricing">
                    <span class="period-total">{{ formatCurrency((basePrice * Number(months)) * (1 - info.rate)) }}</span>
                    <span v-if="info.rate > 0" class="period-strike">
                      {{ formatCurrency(basePrice * Number(months)) }}
                    </span>
                  </div>
                  <span class="period-desc">{{ info.label }}</span>
                </div>
              </div>
            </div>

            <!-- Resumo dos dados do pagador e cálculo do boleto -->
            <div class="payer-summary-card">
              <div class="payer-card-title">
                <i class="fas fa-file-invoice-dollar"></i>
                <span>Resumo da Cobrança & Dados do Sacado</span>
              </div>
              <div class="payer-grid">
                <div class="payer-col">
                  <div class="data-group">
                    <span class="d-label">Razão Social / Sacado:</span>
                    <strong class="d-val">{{ selectedTenant?.name }}</strong>
                  </div>
                  <div class="data-group">
                    <span class="d-label">Prefixo da Instância:</span>
                    <code class="d-val">{{ selectedTenant?.tenant_prefix }}</code>
                  </div>
                  <div class="data-group">
                    <span class="d-label">E-mail Cadastrado:</span>
                    <span class="d-val">{{ selectedTenant?.email || 'contato@' + selectedTenant?.tenant_prefix + '.com' }}</span>
                  </div>
                </div>

                <div class="payer-col">
                  <div class="data-group">
                    <span class="d-label">Vencimento Previsto:</span>
                    <span class="d-val font-semibold">{{ estimatedDueDate }} (3 dias úteis)</span>
                  </div>
                  <div class="data-group">
                    <span class="d-label">Mensalidade Contratada:</span>
                    <span class="d-val">{{ formatCurrency(basePrice) }} / mês</span>
                  </div>
                  <div class="data-group" v-if="currentDiscountRate > 0">
                    <span class="d-label">Desconto Aplicado:</span>
                    <span class="d-val text-success font-semibold">
                      - {{ formatCurrency(boletoDiscountVal) }} ({{ currentDiscountRate * 100 }}%)
                    </span>
                  </div>
                </div>
              </div>

              <div class="payer-total-footer">
                <div class="total-text-group">
                  <span class="total-caption">Total Final a Faturar:</span>
                  <span class="total-highlight valor-gold">{{ formatCurrency(boletoFinalTotal) }}</span>
                </div>
                <span class="total-months-tag">Referente a {{ boletoMonths }} {{ boletoMonths === 1 ? 'mês' : 'meses' }} de serviço</span>
              </div>
            </div>

            <div class="modal-footer-actions">
              <button class="btn btn-outline" @click="downloadBoleto">
                <i class="fas fa-file-pdf"></i> Baixar Boleto PDF
              </button>
              <button class="btn btn-primary btn-mail" @click="openEmailModal('Boleto')">
                <i class="fas fa-envelope"></i> Enviar por E-mail
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. MODAL: Enviar E-mail de Cobrança com Pré-visualização Enriquecida -->
    <div v-if="emailModal" class="modal-overlay" @click.self="emailModal = false">
      <div class="modal-content modal-email">
        <div class="modal-header">
          <div class="modal-title-with-icon">
            <i class="fas fa-paper-plane"></i>
            <h3>Disparo de Cobrança por E-mail</h3>
          </div>
          <button class="close-btn" @click="emailModal = false"><i class="fas fa-xmark"></i></button>
        </div>

        <div class="modal-body email-modal-body">
          <div class="email-form-fields">
            <div class="form-field">
              <label class="form-label">DESTINATÁRIO DO TENANT</label>
              <input
                v-model="emailTo"
                type="email"
                class="filter-select full-width"
                placeholder="financeiro@empresa.com.br"
              />
            </div>

            <div class="form-field">
              <label class="form-label">MODELO DE TEMPLATE</label>
              <select class="filter-select full-width" v-model="selectedEmailTemplate" @change="onTemplateChange">
                <option value="boleto_fatura">Boleto / Fatura Mensal Recorrente</option>
                <option value="pix">PIX — Cobrança Instantânea</option>
                <option value="lembrete">Lembrete Preventivo de Vencimento</option>
                <option value="boas_vindas">Boas-Vindas (Novo Tenant Faturável)</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">ASSUNTO DO E-MAIL</label>
              <input v-model="emailSubject" type="text" class="filter-select full-width" />
            </div>
          </div>

          <!-- Pré-visualização Enriquecida do Disparo -->
          <div class="email-preview-wrapper">
            <div class="email-client-bar">
              <div class="client-dots">
                <span class="dot-red"></span>
                <span class="dot-yellow"></span>
                <span class="dot-green"></span>
              </div>
              <span class="client-title"><i class="fas fa-eye"></i> Pré-visualização em Tempo Real do E-mail</span>
            </div>

            <div class="email-envelope-info">
              <div><strong>De:</strong> faturamento@korvyan.com.br (Korvyan Backoffice)</div>
              <div><strong>Para:</strong> {{ emailTo || 'destinatario@empresa.com' }}</div>
              <div><strong>Assunto:</strong> {{ emailSubject }}</div>
            </div>

            <!-- Corpo Estilizado do E-mail Transacional -->
            <div class="email-preview-rendered">
              <div class="email-corp-header">
                <span class="corp-brand">KORVYAN PLATAFORMA</span>
                <span class="corp-badge">AVISO DE FATURAMENTO</span>
              </div>

              <div class="email-corp-body">
                <p class="email-greeting">Olá, <strong>{{ selectedTenant?.name }}</strong>!</p>
                <p class="email-text">
                  Sua cobrança referente ao plano de uso da plataforma Korvyan está disponível para liquidação via <strong>{{ emailBillingType }}</strong>.
                </p>

                <div class="email-invoice-card">
                  <div class="email-invoice-row">
                    <span>Beneficiário:</span>
                    <strong>{{ billingAccount.name }}</strong>
                  </div>
                  <div class="email-invoice-row">
                    <span>CNPJ:</span>
                    <strong>{{ billingAccount.cnpj }}</strong>
                  </div>
                  <div class="email-invoice-row">
                    <span>Vencimento:</span>
                    <strong>{{ estimatedDueDate }}</strong>
                  </div>
                  <div class="email-invoice-row">
                    <span>Período:</span>
                    <strong>{{ emailBillingType === 'Boleto' ? `${boletoMonths} Mês(es)` : 'Cobrança Mensal' }}</strong>
                  </div>
                  <div class="email-invoice-divider"></div>
                  <div class="email-invoice-total">
                    <span>Total a Pagar:</span>
                    <span class="email-total-amount valor-gold">{{ formatCurrency(currentEmailAmount) }}</span>
                  </div>
                </div>

                <!-- Preview Bloco PIX -->
                <div v-if="emailBillingType === 'PIX'" class="email-pix-box">
                  <div class="email-pix-title">
                    <i class="fas fa-bolt"></i> Chave PIX (Copia e Cola):
                  </div>
                  <code class="email-pix-code">{{ pixPayload || '00020126580014BR.GOV.BCB.PIX0114...' }}</code>
                  <span class="email-pix-help">A compensação bancária é imediata no sistema.</span>
                </div>

                <!-- Preview Bloco Boleto -->
                <div v-else class="email-boleto-box">
                  <button class="email-btn-mock">
                    <i class="fas fa-file-pdf"></i> Visualizar Boleto Bancário
                  </button>
                  <span class="email-boleto-help">Linha digitável disponível no arquivo anexo.</span>
                </div>

                <p class="email-footer-notice">
                  Caso tenha alguma dúvida sobre esta fatura, responda diretamente a esta mensagem ou contate o suporte administrativo.
                </p>
              </div>

              <div class="email-corp-footer">
                Korvyan Tecnologia LTDA • Este é um comunicado oficial gerado pelo sistema.
              </div>
            </div>
          </div>

          <button
            class="btn btn-primary btn-send-now"
            @click="confirmSendEmail"
            :disabled="sendingEmail"
          >
            <i class="fas fa-paper-plane" v-if="!sendingEmail"></i>
            <i class="fas fa-spinner fa-spin" v-else></i>
            <span>{{ sendingEmail ? 'Enviando Disparo...' : 'Disparar E-mail Agora' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import { getAllTenants, updateTenantConfig } from '@/services/tenant.service'
import { sendEmail } from '@/services/mail.service'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

const tenants = ref<any[]>([])
const loading = ref(false)

// Configuração do Gateway persistente em LocalStorage
const STORAGE_KEY = 'korvyan_billing_gateway_config'

const billingAccount = reactive({
  gateway: 'custom',
  apiToken: '',
  webhookUrl: '',
  name: 'Korvyan Tecnologia LTDA',
  cnpj: '12.345.678/0001-99',
  pixKey: 'contato@flowstage.com.br'
})

function loadSavedBillingAccount() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(billingAccount, parsed)
    }
  } catch (e) {
    console.warn('Erro ao carregar configurações salvas de faturamento:', e)
  }
}

function saveBillingAccount() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(billingAccount))
    toastSuccess('Configurações de cobrança salvas com sucesso!')
  } catch {
    toastError('Erro ao salvar configurações localmente.')
  }
}

// ─── Status do Gateway Ativo ──────────────────────────────────────────────────
const activeGatewayLabel = computed(() => {
  switch (billingAccount.gateway) {
    case 'custom':
      return 'PIX Direto'
    case 'asaas':
      return 'Asaas'
    case 'cora':
      return 'Cora Bank'
    case 'iugu':
      return 'Iugu'
    case 'pagarme':
      return 'Pagar.me'
    default:
      return 'Gateway'
  }
})

const gatewayStatus = computed(() => {
  if (billingAccount.gateway === 'custom') {
    if (billingAccount.pixKey) {
      return {
        text: 'Ativo (0% Taxas)',
        badgeClass: 'badge-status-online',
        dotClass: 'dot-online',
        subtext: 'Chave PIX pronta para repasse direto'
      }
    }
    return {
      text: 'Chave Pendente',
      badgeClass: 'badge-status-warning',
      dotClass: 'dot-warning',
      subtext: 'Informe a chave PIX do beneficiário'
    }
  } else {
    if (billingAccount.apiToken) {
      return {
        text: 'Conectado',
        badgeClass: 'badge-status-online',
        dotClass: 'dot-online',
        subtext: 'API Key configurada'
      }
    }
    return {
      text: 'Token Pendente',
      badgeClass: 'badge-status-warning',
      dotClass: 'dot-warning',
      subtext: 'Insira a Secret Key do gateway'
    }
  }
})

// ─── Verificação de Status Ativo do Tenant ────────────────────────────────────
function isTenantActive(t: any): boolean {
  if (t.tenant_enabled === false) return false
  if (t.status === 'BLOCKED' || t.status === 'INACTIVE' || t.status === 'CANCELLED') return false
  return true
}

// ─── Cálculos de Métricas KPI ─────────────────────────────────────────────────
const activeTenants = computed(() => {
  return tenants.value.filter(isTenantActive)
})

const activeWithPriceCount = computed(() => {
  return activeTenants.value.filter(t => Number(t.addon_values?.monthly_price || 0) > 0).length
})

const totalMRR = computed(() => {
  return activeTenants.value.reduce((acc, t) => acc + Number(t.addon_values?.monthly_price || 0), 0)
})

const averageTicket = computed(() => {
  const count = activeTenants.value.length
  return count > 0 ? totalMRR.value / count : 0
})

// ─── Barra de Busca e Filtros Rápidos ─────────────────────────────────────────
const searchQuery = ref('')
const filterPlan = ref('all')
const filterStatus = ref('all')

const filteredTenants = computed(() => {
  return tenants.value.filter(t => {
    // Busca por nome ou prefixo
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const name = (t.name || '').toLowerCase()
      const prefix = (t.tenant_prefix || '').toLowerCase()
      if (!name.includes(q) && !prefix.includes(q)) return false
    }

    // Filtro por Plano
    if (filterPlan.value !== 'all') {
      const plan = (t.plan || 'standard').toLowerCase()
      if (plan !== filterPlan.value.toLowerCase()) return false
    }

    // Filtro por Status
    if (filterStatus.value === 'active') {
      if (!isTenantActive(t)) return false
    } else if (filterStatus.value === 'inactive') {
      if (isTenantActive(t)) return false
    }

    return true
  })
})

function clearFilters() {
  searchQuery.value = ''
  filterPlan.value = 'all'
  filterStatus.value = 'all'
}

// Formatação de Moeda BRL
function formatCurrency(val: number | string | undefined | null): string {
  const num = Number(val || 0)
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Carregamento de Tenants ──────────────────────────────────────────────────
async function loadTenants() {
  loading.value = true
  try {
    tenants.value = await getAllTenants()
  } catch (err: any) {
    toastError('Erro ao carregar tenants: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// ─── Modal de Edição de Mensalidade ───────────────────────────────────────────
const priceModal = ref(false)
const selectedTenant = ref<any>(null)
const tempPrice = ref('')
const savingPrice = ref(false)
const priceInputRef = ref<HTMLInputElement | null>(null)

function openPriceModal(tenant: any) {
  selectedTenant.value = tenant
  tempPrice.value = String(tenant.addon_values?.monthly_price || '')
  priceModal.value = true
  nextTick(() => {
    priceInputRef.value?.focus()
  })
}

async function savePrice() {
  if (!selectedTenant.value) return
  const rawParsed = parseFloat(tempPrice.value)
  if (isNaN(rawParsed) || rawParsed < 0) {
    toastError('Por favor, informe um valor de mensalidade válido!')
    return
  }
  const parsed = Math.min(rawParsed, 1000000000)
  savingPrice.value = true
  try {
    const payload = {
      addon_values: {
        ...selectedTenant.value.addon_values,
        monthly_price: parsed
      }
    }
    await updateTenantConfig(selectedTenant.value.tenant_prefix, payload)
    selectedTenant.value.addon_values = payload.addon_values

    // Atualiza também na lista principal
    const item = tenants.value.find(t => t.tenant_prefix === selectedTenant.value.tenant_prefix)
    if (item) {
      if (!item.addon_values) item.addon_values = {}
      item.addon_values.monthly_price = parsed
    }

    toastSuccess(`Mensalidade de ${selectedTenant.value.name} atualizada para ${formatCurrency(parsed)}!`)
    priceModal.value = false
  } catch (err: any) {
    toastError('Erro ao atualizar mensalidade: ' + (err.message || err))
  } finally {
    savingPrice.value = false
  }
}

// ─── Modal de Cobrança (Boleto & PIX) ─────────────────────────────────────────
const billingModal = ref(false)
const billingType = ref<'boleto' | 'pix'>('pix')
const boletoMonths = ref(1)
const pixQrUrl = ref('')
const pixPayload = ref('')
const pixCopied = ref(false)

const basePrice = computed(() => {
  return selectedTenant.value ? Number(selectedTenant.value.addon_values?.monthly_price || 0) : 0
})

// Descontos dinâmicos por período
const boletoDiscounts: Record<number, { rate: number; label: string }> = {
  1: { rate: 0, label: 'Mensal padrão' },
  3: { rate: 0.05, label: 'Desconto trimestral (5%)' },
  6: { rate: 0.10, label: 'Desconto semestral (10%)' },
  12: { rate: 0.15, label: 'Desconto anual (15%)' }
}

const currentDiscountRate = computed(() => boletoDiscounts[boletoMonths.value]?.rate || 0)
const boletoSubtotal = computed(() => basePrice.value * boletoMonths.value)
const boletoDiscountVal = computed(() => boletoSubtotal.value * currentDiscountRate.value)
const boletoFinalTotal = computed(() => boletoSubtotal.value - boletoDiscountVal.value)

const estimatedDueDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toLocaleDateString('pt-BR')
})

function openBillingModal(tenant: any) {
  if (Number(tenant.addon_values?.monthly_price || 0) <= 0) {
    toastError('Configure o valor da mensalidade deste tenant antes de gerar a cobrança.')
    openPriceModal(tenant)
    return
  }
  selectedTenant.value = tenant
  billingType.value = 'pix'
  boletoMonths.value = 1
  pixQrUrl.value = ''
  pixPayload.value = ''
  pixCopied.value = false
  billingModal.value = true
  generatePixQr()
}

async function switchToPix() {
  billingType.value = 'pix'
  if (!pixQrUrl.value) {
    await generatePixQr()
  }
}

// Gerador padrão EMV BR Code / PIX Bacen
function buildPixPayload(pixKey: string, merchantName: string, amount: number): string {
  const name = merchantName.substring(0, 25).replace(/[^a-zA-Z0-9 ]/g, '').padEnd(5, ' ')
  const amountStr = amount.toFixed(2)
  const gui = '0014BR.GOV.BCB.PIX'
  const keyField = `01${pixKey.length.toString().padStart(2, '0')}${pixKey}`
  const merchantInfoValue = `${gui}${keyField}`
  const merchantInfo = `26${merchantInfoValue.length.toString().padStart(2, '0')}${merchantInfoValue}`
  const mcc = '52040000'
  const currency = '5303986'
  const amountField = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`
  const country = '5802BR'
  const merchantNameField = `59${name.length.toString().padStart(2, '0')}${name}`
  const city = '6009SAO PAULO'
  const addData = '62070503***'
  const payload = `000201${merchantInfo}${mcc}${currency}${amountField}${country}${merchantNameField}${city}${addData}6304`
  
  // CRC16 CCITT
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021
      else crc = crc << 1
    }
  }
  return payload + (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0')
}

async function generatePixQr() {
  try {
    const payload = buildPixPayload(
      billingAccount.pixKey || 'contato@flowstage.com.br',
      billingAccount.name || 'Korvyan',
      basePrice.value
    )
    pixPayload.value = payload
    pixQrUrl.value = await QRCode.toDataURL(payload, { width: 220, margin: 1 })
  } catch (e) {
    console.error('Erro ao gerar QR Code:', e)
    toastError('Erro ao gerar QR Code PIX.')
  }
}

async function copyPix() {
  try {
    if (!pixPayload.value) {
      await generatePixQr()
    }
    if (!pixPayload.value) {
      toastError('Nenhum código PIX disponível para copiar.')
      return
    }
    await navigator.clipboard.writeText(pixPayload.value)
    pixCopied.value = true
    toastSuccess('Chave PIX copiada!')
    setTimeout(() => {
      pixCopied.value = false
    }, 2500)
  } catch {
    toastError('Não foi possível copiar automaticamente. Selecione e copie o código manualmente.')
  }
}

function downloadBoleto() {
  toastSuccess(`Boleto bancário gerado para ${selectedTenant.value?.name} no valor de ${formatCurrency(boletoFinalTotal.value)}.`)
}

async function downloadQrCode() {
  if (!pixQrUrl.value) return
  const link = document.createElement('a')
  link.href = pixQrUrl.value
  link.download = `pix-${selectedTenant.value?.tenant_prefix || 'cobranca'}.png`
  link.click()
  toastSuccess('QR Code PIX baixado em alta definição.')
}

// ─── Modal de E-mail Enriquecido ──────────────────────────────────────────────
const emailModal = ref(false)
const emailTo = ref('')
const emailSubject = ref('')
const emailBillingType = ref<'PIX' | 'Boleto'>('PIX')
const selectedEmailTemplate = ref('pix')
const sendingEmail = ref(false)

const currentEmailAmount = computed(() => {
  return emailBillingType.value === 'PIX' ? basePrice.value : boletoFinalTotal.value
})

function openEmailModal(type: 'PIX' | 'Boleto') {
  emailBillingType.value = type
  emailTo.value = selectedTenant.value?.email || `${selectedTenant.value?.tenant_prefix || 'financeiro'}@empresa.com.br`
  selectedEmailTemplate.value = type === 'PIX' ? 'pix' : 'boleto_fatura'

  const amount = type === 'PIX' ? basePrice.value : boletoFinalTotal.value
  emailSubject.value = type === 'PIX'
    ? `Cobrança PIX — ${selectedTenant.value?.name || selectedTenant.value?.tenant_prefix} — ${formatCurrency(amount)}`
    : `Boleto Bancário (${boletoMonths.value}x) — ${selectedTenant.value?.name || selectedTenant.value?.tenant_prefix} — ${formatCurrency(amount)}`

  emailModal.value = true
}

function onTemplateChange() {
  const amount = currentEmailAmount.value
  if (selectedEmailTemplate.value === 'lembrete') {
    emailSubject.value = `Lembrete de Vencimento de Fatura — ${selectedTenant.value?.name}`
  } else if (selectedEmailTemplate.value === 'boas_vindas') {
    emailSubject.value = `Boas-vindas à Korvyan — Fatura Inicial Disponível`
  } else if (selectedEmailTemplate.value === 'pix') {
    emailSubject.value = `Cobrança PIX — ${selectedTenant.value?.name} — ${formatCurrency(amount)}`
  } else {
    emailSubject.value = `Boleto Bancário (${boletoMonths.value}x) — ${selectedTenant.value?.name} — ${formatCurrency(amount)}`
  }
}

async function confirmSendEmail() {
  if (!emailTo.value) {
    toastError('Informe o e-mail do destinatário.')
    return
  }
  sendingEmail.value = true
  try {
    const amount = currentEmailAmount.value
    const html = `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;color:#1e293b;">
        <div style="text-align:center;padding-bottom:20px;border-bottom:2px solid #8b5cf6;">
          <h2 style="color:#8b5cf6;margin:0 0 6px;font-size:22px;">Korvyan Cloud</h2>
          <span style="font-size:12px;color:#64748b;letter-spacing:1px;text-transform:uppercase;">Notificação de Faturamento</span>
        </div>
        <div style="padding:24px 0;">
          <p style="font-size:15px;margin:0 0 16px;">Olá, <strong>${selectedTenant.value?.name || 'Cliente'}</strong>!</p>
          <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px;">
            Sua fatura referente ao serviço da plataforma Korvyan está disponível para pagamento via <strong>${emailBillingType.value}</strong>.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
            <table style="width:100%;font-size:13px;color:#475569;">
              <tr><td style="padding:4px 0;">Beneficiário:</td><td style="text-align:right;font-weight:600;color:#0f172a;">${billingAccount.name}</td></tr>
              <tr><td style="padding:4px 0;">CNPJ:</td><td style="text-align:right;font-weight:600;color:#0f172a;">${billingAccount.cnpj}</td></tr>
              <tr><td style="padding:4px 0;">Vencimento:</td><td style="text-align:right;font-weight:600;color:#0f172a;">${estimatedDueDate.value}</td></tr>
              <tr><td style="padding:4px 0;">Período:</td><td style="text-align:right;font-weight:600;color:#0f172a;">${emailBillingType.value === 'Boleto' ? `${boletoMonths.value} Mês(es)` : 'Cobrança Mensal'}</td></tr>
              <tr style="border-top:1px dashed #cbd5e1;"><td style="padding:10px 0 0;font-size:15px;font-weight:bold;color:#0f172a;">Valor Total:</td><td style="text-align:right;padding:10px 0 0;font-size:18px;font-weight:bold;color:#8b5cf6;">${formatCurrency(amount)}</td></tr>
            </table>
          </div>
          ${emailBillingType.value === 'PIX' && pixPayload.value ? `
          <div style="background:#f3e8ff;border:1px solid #d8b4fe;border-radius:8px;padding:16px;margin:0 0 20px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b21a8;">Código PIX Copia e Cola:</p>
            <div style="background:#ffffff;border:1px solid #e9d5ff;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;word-break:break-all;color:#4a044e;">
              ${pixPayload.value}
            </div>
            <p style="margin:8px 0 0;font-size:11px;color:#7e22ce;">Pague no app de qualquer banco. A compensação é instantânea.</p>
          </div>
          ` : ''}
          <p style="font-size:13px;color:#64748b;margin:0;">Em caso de dúvidas, responda diretamente a este e-mail ou contate nosso time de suporte.</p>
        </div>
        <div style="border-top:1px solid #e2e8f0;padding-top:16px;text-align:center;font-size:11px;color:#94a3b8;">
          Korvyan Tecnologia LTDA • Gerado automaticamente pelo sistema backoffice.
        </div>
      </div>`

    await sendEmail([emailTo.value], { subject: emailSubject.value, html })
    toastSuccess(`E-mail de cobrança enviado com sucesso para ${emailTo.value}!`)
    emailModal.value = false
  } catch (err: any) {
    toastError('Erro ao enviar e-mail: ' + (err.message || err))
  } finally {
    sendingEmail.value = false
  }
}

onMounted(() => {
  loadSavedBillingAccount()
  loadTenants()
})
</script>

<style scoped>
.faturamento-container {
  padding: 0.5rem 0;
}

/* ── Header ── */
.bo-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-with-badge h1 {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-bo, #f8fafc);
}

.badge-bo {
  font-size: 0.65rem;
  background: rgba(139, 92, 246, 0.15);
  color: var(--master-brand, #8b5cf6);
  padding: 3px 7px;
  border-radius: 4px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.bo-page-header p {
  color: var(--text-bo-muted, #94a3b8);
  font-size: 0.88rem;
  margin: 6px 0 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ── 1. KPI Cards Grid ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 12px;
  padding: 1.25rem 1.4rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  border-color: rgba(212, 175, 55, 0.4);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.kpi-card.kpi-highlight {
  border-color: rgba(212, 175, 55, 0.35);
  position: relative;
  overflow: hidden;
}

.kpi-card.kpi-highlight::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--gold, #D4AF37), var(--master-brand, #8b5cf6));
}

.kpi-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.gold-bg {
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold, #D4AF37);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.green-bg {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.purple-bg {
  background: rgba(139, 92, 246, 0.15);
  color: var(--master-brand, #8b5cf6);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.blue-bg {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.kpi-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-bo-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 3px;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-bo, #f8fafc);
  line-height: 1.2;
}

.kpi-total {
  font-size: 0.78rem;
  color: var(--text-bo-muted, #94a3b8);
  font-weight: 500;
}

.kpi-sub {
  font-size: 0.72rem;
  color: var(--text-bo-muted, #94a3b8);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gateway-status-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.gateway-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-bo, #f8fafc);
}

.gateway-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.badge-status-online {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge-status-warning {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-online {
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
  animation: pulse-green 2s infinite;
}

.dot-warning {
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}

@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

/* ── Card Gateway ── */
.gateway-card {
  margin-bottom: 2rem;
  padding: 1.8rem;
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 12px;
}

.card-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.5rem;
}

.card-title-icon {
  width: 38px;
  height: 38px;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: var(--master-brand, #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.card-section-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-bo, #f8fafc);
}

.section-desc {
  margin: 2px 0 0 0;
  font-size: 0.8rem;
  color: var(--text-bo-muted, #94a3b8);
}

.gateway-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.full-span {
  grid-column: 1 / -1;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-bo-muted, #94a3b8);
  letter-spacing: 0.5px;
}

.filter-select {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 8px;
  color: var(--text-bo, #f8fafc);
  padding: 9px 12px;
  font-size: 0.88rem;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--master-brand, #8b5cf6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.full-width {
  width: 100%;
}

.gateway-info-banner {
  margin-top: 1.5rem;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-left: 4px solid var(--master-brand, #8b5cf6);
  padding: 1rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  color: var(--text-bo, #f8fafc);
}

.api-banner {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.25);
  border-left-color: #3b82f6;
}

.banner-icon {
  color: var(--master-brand, #8b5cf6);
  font-size: 1.2rem;
  flex-shrink: 0;
}

.api-banner .banner-icon {
  color: #3b82f6;
}

.gateway-footer {
  margin-top: 1.5rem;
  text-align: right;
  border-top: 1px solid var(--border-bo, #334155);
  padding-top: 1.25rem;
}

.btn-save-config {
  background: var(--master-brand, #8b5cf6);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-save-config:hover {
  background: var(--master-hover, #7c3aed);
  transform: translateY(-1px);
}

/* ── 2. Toolbar & Table ── */
.billing-table-card {
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-bo, #334155);
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 260px;
}

.search-input {
  width: 100%;
  padding: 10px 36px 10px 38px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 8px;
  color: var(--text-bo, #f8fafc);
  font-size: 0.88rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--master-brand, #8b5cf6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-bo-muted, #94a3b8);
  font-size: 0.85rem;
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-bo-muted, #94a3b8);
  cursor: pointer;
  padding: 4px;
}

.filters-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 0.78rem;
  color: var(--text-bo-muted, #94a3b8);
  font-weight: 600;
  white-space: nowrap;
}

.results-badge {
  background: rgba(139, 92, 246, 0.1);
  color: var(--master-brand, #8b5cf6);
  border: 1px solid rgba(139, 92, 246, 0.25);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

/* ── 3. Table Polish ── */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background: rgba(15, 23, 42, 0.5);
  color: var(--text-bo-muted, #94a3b8);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-bo, #334155);
}

.data-table td {
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid var(--border-bo, #334155);
  color: var(--text-bo, #f8fafc);
  font-size: 0.88rem;
  vertical-align: middle;
}

.tenant-row {
  transition: background 0.15s;
}

.tenant-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.tenant-meta-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tenant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 0.9rem;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.tenant-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tenant-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-bo, #f8fafc);
}

.tenant-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.prefix-tag {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid var(--border-bo, #334155);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.72rem;
  color: var(--text-bo-muted, #94a3b8);
}

.plan-tag {
  font-size: 0.72rem;
  color: var(--gold, #D4AF37);
  font-weight: 600;
}

.price-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.valor-gold {
  color: var(--gold, #D4AF37);
  font-weight: 800;
}

.quick-edit-btn {
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold, #D4AF37);
  border: 1px solid rgba(212, 175, 55, 0.25);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
}

.quick-edit-btn:hover {
  background: rgba(212, 175, 55, 0.22);
  border-color: var(--gold, #D4AF37);
  transform: translateY(-1px);
}

.badge-status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.3px;
}

.badge-ativo {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.badge-bloqueado {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.btn-cobrar {
  background: linear-gradient(135deg, var(--master-brand, #8b5cf6), #7c3aed);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.25);
  transition: all 0.2s;
}

.btn-cobrar:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.text-center-loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-bo-muted, #94a3b8);
}

.empty-state-cell {
  text-align: center;
  padding: 3.5rem 1rem;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-bo-muted, #94a3b8);
}

.empty-state-content i {
  font-size: 2.2rem;
  opacity: 0.4;
}

/* ── 4. Modais ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.modal-content {
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 14px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: modal-appear 0.2s ease-out;
}

@keyframes modal-appear {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-bo, #334155);
}

.modal-title-with-icon {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--master-brand, #8b5cf6);
}

.modal-title-with-icon h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-bo, #f8fafc);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: var(--text-bo-muted, #94a3b8);
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s;
}

.close-btn:hover {
  color: var(--text-bo, #f8fafc);
  background: rgba(255, 255, 255, 0.08);
}

.modal-body {
  padding: 1.5rem;
}

/* Modal Price Edit */
.modal-price-edit {
  max-width: 440px;
}

.tenant-card-preview {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 8px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
}

.preview-label {
  font-size: 0.75rem;
  color: var(--text-bo-muted, #94a3b8);
}

.preview-name {
  font-size: 0.9rem;
  color: var(--text-bo, #f8fafc);
}

.preview-prefix {
  font-size: 0.72rem;
  background: rgba(139, 92, 246, 0.15);
  color: var(--master-brand, #8b5cf6);
  padding: 2px 6px;
  border-radius: 4px;
}

.modal-helper-text {
  font-size: 0.82rem;
  color: var(--text-bo-muted, #94a3b8);
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.price-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-prefix {
  position: absolute;
  left: 14px;
  color: var(--gold, #D4AF37);
  font-weight: 700;
  font-size: 0.95rem;
}

.price-input {
  width: 100%;
  padding-left: 42px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gold, #D4AF37);
}

.modal-actions-stacked {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 1.5rem;
}

.btn-save-price {
  background: var(--master-brand, #8b5cf6);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-save-price:hover {
  background: var(--master-hover, #7c3aed);
}

/* Modal Billing (PIX / Boleto) */
.modal-billing {
  max-width: 580px;
}

.billing-tabs-nav {
  display: flex;
  gap: 10px;
  border-bottom: 1px solid var(--border-bo, #334155);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 8px;
  color: var(--text-bo-muted, #94a3b8);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: var(--master-brand, #8b5cf6);
  color: var(--master-brand, #8b5cf6);
}

.pix-charge-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 1.25rem;
}

.charge-label {
  font-size: 0.8rem;
  color: var(--text-bo-muted, #94a3b8);
  text-transform: uppercase;
}

.charge-amount {
  font-size: 1.8rem;
  font-weight: 800;
}

.charge-subtitle {
  font-size: 0.75rem;
  color: #22c55e;
}

.qr-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}

.qr-box {
  background: white;
  padding: 14px;
  border-radius: 12px;
  border: 2px solid var(--border-bo, #334155);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-img {
  width: 100%;
  height: 100%;
  display: block;
}

.qr-loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 0.82rem;
}

.qr-scan-instruction {
  margin-top: 8px;
  font-size: 0.75rem;
  color: var(--text-bo-muted, #94a3b8);
}

.pix-copy-section {
  margin-bottom: 1.25rem;
}

.copy-input-group {
  display: flex;
  gap: 8px;
}

.pix-input {
  flex: 1;
  font-size: 0.75rem;
}

.btn-copy {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid var(--master-brand, #8b5cf6);
  color: var(--master-brand, #8b5cf6);
  padding: 0 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-copy:hover {
  background: var(--master-brand, #8b5cf6);
  color: white;
}

.btn-copied {
  background: #22c55e !important;
  border-color: #22c55e !important;
  color: white !important;
}

.charge-details-summary {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--master-brand, #8b5cf6);
  text-transform: uppercase;
  margin-bottom: 10px;
}

.summary-grid-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
}

.s-label {
  color: var(--text-bo-muted, #94a3b8);
}

.s-val {
  color: var(--text-bo, #f8fafc);
  font-weight: 500;
}

/* Boleto Period Selector Grid */
.period-selector-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 1.5rem;
}

.period-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s;
}

.period-card:hover {
  border-color: var(--gold, #D4AF37);
  transform: translateY(-1px);
}

.period-card.active {
  background: rgba(212, 175, 55, 0.1);
  border-color: var(--gold, #D4AF37);
  box-shadow: 0 0 0 1px var(--gold, #D4AF37);
}

.period-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.period-months {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-bo, #f8fafc);
}

.discount-pill {
  background: #22c55e;
  color: #0f172a;
  font-weight: 800;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 10px;
}

.period-pricing {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.period-total {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--gold, #D4AF37);
}

.period-strike {
  font-size: 0.75rem;
  color: var(--text-bo-muted, #94a3b8);
  text-decoration: line-through;
}

.period-desc {
  font-size: 0.72rem;
  color: var(--text-bo-muted, #94a3b8);
}

/* Payer Summary Card */
.payer-summary-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.payer-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--gold, #D4AF37);
  text-transform: uppercase;
  margin-bottom: 12px;
}

.payer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.data-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.d-label {
  font-size: 0.7rem;
  color: var(--text-bo-muted, #94a3b8);
}

.d-val {
  font-size: 0.85rem;
  color: var(--text-bo, #f8fafc);
}

.payer-total-footer {
  border-top: 1px dashed var(--border-bo, #334155);
  margin-top: 8px;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.total-text-group {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.total-caption {
  font-size: 0.88rem;
  color: var(--text-bo-muted, #94a3b8);
}

.total-highlight {
  font-size: 1.5rem;
  font-weight: 800;
}

.total-months-tag {
  font-size: 0.75rem;
  color: var(--text-bo-muted, #94a3b8);
}

.modal-footer-actions {
  display: flex;
  gap: 12px;
}

.modal-footer-actions .btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-mail {
  background: var(--master-brand, #8b5cf6);
  color: white;
  border: none;
}

.btn-mail:hover {
  background: var(--master-hover, #7c3aed);
}

/* Modal Email */
.modal-email {
  max-width: 620px;
}

.email-modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.email-form-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.email-preview-wrapper {
  background: #0f172a;
  border: 1px solid var(--border-bo, #334155);
  border-radius: 10px;
  overflow: hidden;
}

.email-client-bar {
  background: #1e293b;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-bo, #334155);
}

.client-dots {
  display: flex;
  gap: 5px;
}

.dot-red { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; }
.dot-yellow { width: 10px; height: 10px; border-radius: 50%; background: #f59e0b; }
.dot-green { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; }

.client-title {
  font-size: 0.75rem;
  color: var(--text-bo-muted, #94a3b8);
  font-weight: 600;
}

.email-envelope-info {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.75rem;
  color: var(--text-bo-muted, #94a3b8);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.email-preview-rendered {
  padding: 20px;
  background: #ffffff;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.email-corp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #8b5cf6;
  padding-bottom: 10px;
  margin-bottom: 14px;
}

.corp-brand {
  font-size: 1rem;
  font-weight: 800;
  color: #8b5cf6;
  letter-spacing: 0.5px;
}

.corp-badge {
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.email-greeting {
  font-size: 0.92rem;
  margin: 0 0 8px 0;
  color: #0f172a;
}

.email-text {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.5;
  margin: 0 0 14px 0;
}

.email-invoice-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 14px;
}

.email-invoice-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 4px;
}

.email-invoice-divider {
  border-top: 1px dashed #cbd5e1;
  margin: 8px 0;
}

.email-invoice-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 800;
  color: #0f172a;
}

.email-total-amount {
  color: #8b5cf6 !important;
  font-size: 1.1rem;
}

.email-pix-box {
  background: #f3e8ff;
  border: 1px solid #d8b4fe;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 14px;
}

.email-pix-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #6b21a8;
  margin-bottom: 6px;
}

.email-pix-code {
  display: block;
  background: #ffffff;
  border: 1px solid #e9d5ff;
  border-radius: 6px;
  padding: 8px;
  font-size: 0.7rem;
  word-break: break-all;
  color: #4a044e;
}

.email-pix-help {
  display: block;
  font-size: 0.7rem;
  color: #7e22ce;
  margin-top: 6px;
}

.email-btn-mock {
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: default;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.email-boleto-help {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 6px;
}

.email-footer-notice {
  font-size: 0.72rem;
  color: #94a3b8;
  margin: 12px 0 0 0;
}

.email-corp-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
  margin-top: 14px;
  text-align: center;
  font-size: 0.68rem;
  color: #94a3b8;
}

.btn-send-now {
  background: var(--master-brand, #8b5cf6);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-send-now:hover {
  background: var(--master-hover, #7c3aed);
}

/* ── 5. Responsividade ── */
@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .gateway-form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input-wrapper {
    width: 100%;
  }

  .filters-group {
    width: 100%;
    justify-content: space-between;
  }

  .payer-grid {
    grid-template-columns: 1fr;
  }

  .period-selector-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .bo-page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .modal-footer-actions {
    flex-direction: column;
  }

  .filters-group {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-select {
    width: 100%;
  }
}

/* ── Botões Genéricos Utilitários ── */
.btn {
  font-family: inherit;
  transition: all 0.2s ease;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-bo, #334155);
  color: var(--text-bo, #f8fafc);
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--text-bo-muted, #94a3b8);
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.78rem;
}

.font-mono {
  font-family: monospace;
}

.font-semibold {
  font-weight: 600;
}

.text-success {
  color: #22c55e !important;
}
</style>
