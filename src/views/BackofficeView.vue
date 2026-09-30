<template>
  <div class="backoffice-layout" :data-theme="theme">
    <!-- Navbar -->
    <header class="bo-header">
      <div class="bo-header-left">
        <button class="mobile-toggle-btn" @click="mobileSidebarOpen = !mobileSidebarOpen" :aria-label="mobileSidebarOpen ? 'Fechar menu' : 'Abrir menu'" title="Menu de Navegação">
          <i :class="mobileSidebarOpen ? 'fas fa-xmark' : 'fas fa-bars'"></i>
        </button>
        <div class="bo-brand">
          <div class="brand-logo"><i class="fas fa-satellite-dish"></i></div>
          <span>Korvyan <span class="badge-bo">MASTER</span></span>
        </div>
      </div>
      <div class="bo-actions">
        <button class="icon-btn theme-btn" @click="toggleTheme" title="Mudar Tema">
          <i :class="theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>

        <!-- Dropdown Interativo no Avatar do Usuário -->
        <div class="user-menu-container" ref="userMenuRef">
          <div class="user-avatar-bo" style="background: var(--master-brand);" @click.stop="userMenuOpen = !userMenuOpen" :title="masterUser.name">
            {{ masterInitials }}
          </div>

          <transition name="dropdown-scale">
            <div v-if="userMenuOpen" class="bo-user-dropdown" @click.stop>
              <div class="bo-dropdown-header">
                <div class="user-dropdown-info">
                  <div class="user-avatar-bo mini-avatar" style="background: var(--master-brand);">
                    {{ masterInitials }}
                  </div>
                  <div class="user-text-info">
                    <span class="user-name-title">{{ masterUser.name }}</span>
                    <span class="badge-root"><i class="fas fa-shield-halved"></i> ROOT MASTER</span>
                  </div>
                </div>
              </div>

              <div class="bo-dropdown-divider"></div>

              <div class="bo-dropdown-menu">
                <button class="bo-dropdown-item" @click="navigateTo('/dashboard')">
                  <i class="fas fa-chart-line"></i>
                  <span>Ir para o Painel Geral</span>
                </button>
                <button class="bo-dropdown-item" @click="navigateTo('/meu-perfil')">
                  <i class="fas fa-user-gear"></i>
                  <span>Meu Perfil</span>
                </button>
              </div>

              <div class="bo-dropdown-divider"></div>

              <div class="bo-dropdown-menu">
                <button class="bo-dropdown-item logout-item" @click="doLogout">
                  <i class="fas fa-arrow-right-from-bracket"></i>
                  <span>Sair / Logout</span>
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <!-- Mobile Drawer Overlay / Backdrop -->
    <transition name="fade">
      <div v-if="mobileSidebarOpen" class="sidebar-backdrop" @click="mobileSidebarOpen = false"></div>
    </transition>

    <main class="bo-main">
      <aside class="bo-sidebar" :class="{ 'open': mobileSidebarOpen }">
        <div class="bo-sidebar-mobile-header">
          <div class="bo-brand">
            <div class="brand-logo"><i class="fas fa-satellite-dish"></i></div>
            <span>Korvyan <span class="badge-bo">MASTER</span></span>
          </div>
          <button class="icon-btn close-sidebar-btn" @click="mobileSidebarOpen = false" title="Fechar menu">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <nav class="bo-nav">
          <div class="nav-section-title">VISÃO GLOBAL</div>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'dashboard' }" @click.prevent="setTab('dashboard')"><i class="fas fa-chart-line"></i> Dashboard (MRR)</a>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'faturamento' }" @click.prevent="setTab('faturamento')"><i class="fas fa-file-invoice-dollar"></i> Faturamento</a>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'kanban' }" @click.prevent="setTab('kanban')"><i class="fas fa-columns"></i> Quadro de Tarefas</a>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'tenants' }" @click.prevent="setTab('tenants')"><i class="fas fa-building"></i> Empresas (Tenants)</a>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'chamados' }" @click.prevent="setTab('chamados')"><i class="fas fa-headset"></i> Chamados (Tickets)</a>

          <div class="nav-section-title mt-4">GESTÃO DO PORTAL</div>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'modulos' }" @click.prevent="setTab('modulos')"><i class="fas fa-puzzle-piece"></i> Módulos (Loja/IA)</a>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'emails' }" @click.prevent="setTab('emails')"><i class="fas fa-envelope-open-text"></i> Templates de Email</a>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'faq' }" @click.prevent="setTab('faq')"><i class="fas fa-question-circle"></i> FAQ (Base de Conhecimento)</a>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'notificacoes' }" @click.prevent="setTab('notificacoes')"><i class="fas fa-bullhorn"></i> Notificações</a>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'scopes' }" @click.prevent="setTab('scopes')"><i class="fas fa-key"></i> Permissões (Scopes)</a>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'api-keys' }" @click.prevent="setTab('api-keys')"><i class="fas fa-shield-halved"></i> Chaves de API</a>

          <div class="nav-section-title mt-4">SISTEMA</div>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'masters' }" @click.prevent="setTab('masters')"><i class="fas fa-user-astronaut"></i> Admins (Root)</a>
          <a href="#" class="bo-nav-item" :class="{ active: activeTab === 'logs' }" @click.prevent="setTab('logs')"><i class="fas fa-server"></i> Audit Logs</a>
        </nav>
      </aside>

      <div class="bo-content">
        <transition name="fade" mode="out-in">
          <!-- TAB: DASHBOARD -->
          <div v-if="activeTab === 'dashboard'" key="dashboard">
            <div class="bo-page-header">
              <div class="bo-page-header-left">
                <div class="title-with-badge">
                  <h1>Visão Geral do Portal</h1>
                  <span class="badge-bo">DASHBOARD</span>
                </div>
                <p>Métricas em tempo real de crescimento, receita (MRR) e saúde da plataforma.</p>
              </div>
            </div>

            <div v-if="loadingDash" class="loading-state">
              <i class="fas fa-spinner fa-spin"></i> Carregando métricas...
            </div>
            <template v-else>
              <!-- 1. Cards de Métricas KPI no topo (Design System Faturamento) -->
              <div class="kpi-grid">
                <!-- KPI 1: MRR Highlight -->
                <div class="kpi-card kpi-highlight">
                  <div class="kpi-icon gold-bg">
                    <i class="fas fa-coins"></i>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-label">Receita Recorrente (MRR)</span>
                    <span class="kpi-value valor-gold">
                      R$ {{ tenantsData.reduce((acc, t) => acc + Number(t.addon_values?.monthly_price || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
                    </span>
                    <span class="kpi-sub">Soma das mensalidades ativas</span>
                  </div>
                </div>

                <!-- KPI 2: Tenants Ativos -->
                <div class="kpi-card">
                  <div class="kpi-icon green-bg">
                    <i class="fas fa-building"></i>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-label">Tenants Ativos</span>
                    <span class="kpi-value">{{ tenantsData.length }}</span>
                    <span class="kpi-sub">Empresas na plataforma</span>
                  </div>
                </div>

                <!-- KPI 3: Usuários Totais -->
                <div class="kpi-card">
                  <div class="kpi-icon purple-bg">
                    <i class="fas fa-users"></i>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-label">Usuários Totais</span>
                    <span class="kpi-value">{{ totalUsers > 0 ? totalUsers : '—' }}</span>
                    <span class="kpi-sub">Contas cadastradas</span>
                  </div>
                </div>

                <!-- KPI 4: Chamadas API (24h) -->
                <div class="kpi-card">
                  <div class="kpi-icon blue-bg">
                    <i class="fas fa-server"></i>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-label">Chamadas API (24h)</span>
                    <span class="kpi-value">{{ dashStats?.total ?? '—' }}</span>
                    <span class="kpi-sub">Tráfego recente</span>
                  </div>
                </div>

                <!-- KPI 5: Taxa de Erro (24h) -->
                <div class="kpi-card">
                  <div class="kpi-icon amber-bg" :style="errorRateColor">
                    <i class="fas fa-triangle-exclamation"></i>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-label">Taxa de Erro (24h)</span>
                    <span class="kpi-value">{{ dashStats ? dashStats.error_rate + '%' : '—' }}</span>
                    <span class="kpi-sub">Status dos serviços</span>
                  </div>
                </div>
              </div>

              <div class="dash-tables-row">
                <!-- Top Rotas -->
                <div v-if="dashStats?.top_routes?.length" class="table-container dash-table-col" style="flex: 1; background: var(--bg-bo-card); border-color: var(--border-bo);">
                  <div class="table-header-bar" style="border-bottom-color: var(--border-bo);">
                    <h3 style="color: var(--text-bo);">Rotas Mais Acessadas (Últimas 24h)</h3>
                  </div>
                  <table class="data-table">
                    <thead><tr><th style="color: var(--text-bo-muted); border-bottom-color: var(--border-bo);">ROTA</th><th style="color: var(--text-bo-muted); border-bottom-color: var(--border-bo);">CHAMADAS</th><th style="text-align:right; color: var(--text-bo-muted); border-bottom-color: var(--border-bo);">% DO TOTAL</th></tr></thead>
                    <tbody>
                      <tr v-for="r in dashStats.top_routes" :key="r.route">
                        <td style="border-bottom-color: var(--border-bo);"><code class="prefix-code" style="color: var(--master-brand); background: rgba(139, 92, 246, 0.1);">{{ r.route }}</code></td>
                        <td style="border-bottom-color: var(--border-bo); color: var(--text-bo);">{{ r.count }}</td>
                        <td style="text-align:right; border-bottom-color: var(--border-bo); color: var(--text-bo);">{{ dashStats.total ? Math.round((r.count / dashStats.total) * 100) : 0 }}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Por Tenant -->
                <div v-if="dashStats?.by_tenant?.length" class="table-container dash-table-col" style="flex: 1; background: var(--bg-bo-card); border-color: var(--border-bo);">
                  <div class="table-header-bar" style="border-bottom-color: var(--border-bo);">
                    <h3 style="color: var(--text-bo);">Atividades (Últimas 24h)</h3>
                  </div>
                  <table class="data-table">
                    <thead><tr><th style="color: var(--text-bo-muted); border-bottom-color: var(--border-bo);">TENANT</th><th style="text-align:right; color: var(--text-bo-muted); border-bottom-color: var(--border-bo);">CHAMADAS</th></tr></thead>
                    <tbody>
                      <tr v-for="t in dashStats.by_tenant" :key="t.tenant">
                        <td style="border-bottom-color: var(--border-bo);"><div class="tenant-badge" style="background: rgba(139, 92, 246, 0.1); color: var(--master-brand); border-color: rgba(139, 92, 246, 0.3);">{{ t.tenant }}</div></td>
                        <td style="text-align:right; border-bottom-color: var(--border-bo); color: var(--text-bo);">{{ t.count }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </div>

          <!-- TAB: TENANTS -->
          <div v-else-if="activeTab === 'tenants'" key="tenants" class="fade-panel">
            <div class="bo-page-header">
              <div class="bo-page-header-left">
                <div class="title-with-badge">
                  <h1>Gestão de Clientes (Tenants)</h1>
                  <span class="badge-bo">ADMIN</span>
                </div>
                <p>Visualize e gerencie todas as empresas cadastradas na plataforma.</p>
              </div>
              <div class="header-actions">
                <button class="btn btn-outline" @click="loadTenants" :disabled="loadingTenants" title="Atualizar">
                  <i :class="loadingTenants ? 'fas fa-spinner fa-spin' : 'fas fa-rotate-right'"></i>
                  <span>Atualizar</span>
                </button>
                <button class="btn btn-master" @click="openTenantModal()"><i class="fas fa-plus"></i> Novo Tenant</button>
              </div>
            </div>

            <div v-if="tenantError" class="error-bar">
              <i class="fas fa-circle-exclamation"></i> {{ tenantError }}
              <button class="icon-btn" @click="loadTenants" style="margin-left:auto"><i class="fas fa-rotate-right"></i></button>
            </div>

            <div class="table-container">
              <div class="table-search-bar">
                <i class="fas fa-magnifying-glass"></i>
                <input v-model="tenantSearch" type="text" placeholder="Buscar tenant..." />
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Prefixo</th>
                    <th>Plano</th>
                    <th>Status</th>
                    <th style="text-align:right"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingTenants">
                    <td colspan="5" class="empty-cell"><i class="fas fa-spinner fa-spin"></i></td>
                  </tr>
                  <tr v-else-if="!filteredTenants.length">
                    <td colspan="5" class="empty-cell"><i class="fas fa-building"></i><p>Nenhum tenant encontrado.</p></td>
                  </tr>
                  <tr v-for="t in filteredTenants" :key="t.tenant_prefix">
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="tenant-logo-mini" :style="{ background: t.primary_color || '#D4AF37' }">
                          {{ (t.name || t.tenant_prefix || '?').substring(0,2).toUpperCase() }}
                        </div>
                        <div>
                          <p style="font-weight:600;color:var(--text-primary)">{{ t.name || t.tenant_prefix }}</p>
                          <p style="font-size:0.72rem;color:var(--text-muted)">{{ t.support_phone || '—' }}</p>
                        </div>
                      </div>
                    </td>
                    <td><code class="prefix-code">{{ t.tenant_prefix }}</code></td>
                    <td>
                      <span class="plan-badge">{{ t.plan || 'basic' }}</span>
                    </td>
                    <td>
                      <span :class="['badge', t.status === 'ACTIVE' || t.tenant_enabled !== false ? 'success' : 'danger']">
                        {{ t.status === 'ACTIVE' || t.tenant_enabled !== false ? 'Ativo' : 'Inativo' }}
                      </span>
                    </td>
                    <td style="text-align:right">
                      <button class="icon-btn" title="Editar" @click="openTenantModal(t)"><i class="fas fa-pen"></i></button>
                      <button class="icon-btn" title="Alternar status"
                        :style="{ color: t.tenant_enabled !== false ? 'var(--danger)' : '#27c93f' }"
                        @click="toggleTenantStatus(t)">
                        <i :class="t.tenant_enabled !== false ? 'fas fa-ban' : 'fas fa-check'"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB: MASTERS/ADMINS -->
          <div v-else-if="activeTab === 'masters'" key="masters" class="fade-panel">
            <div class="bo-page-header">
              <div class="bo-page-header-left">
                <div class="title-with-badge">
                  <h1>Usuários Super Admin</h1>
                  <span class="badge-bo">ROOT</span>
                </div>
                <p>Operadores com acesso master ao sistema.</p>
              </div>
              <div class="header-actions">
                <router-link to="/app/usuarios/novo" class="btn btn-master"><i class="fas fa-user-plus"></i> Novo Admin</router-link>
              </div>
            </div>

            <div class="table-container">
              <div class="table-search-bar">
                <i class="fas fa-magnifying-glass"></i>
                <input v-model="mastersSearch" type="text" placeholder="Buscar admin..." />
              </div>
              <table class="data-table">
                <thead>
                  <tr><th>Usuário</th><th>Login</th><th>Perfil</th><th></th></tr>
                </thead>
                <tbody>
                  <tr v-if="loadingMasters">
                    <td colspan="4" class="empty-cell"><i class="fas fa-spinner fa-spin"></i></td>
                  </tr>
                  <tr v-else-if="!filteredMasters.length">
                    <td colspan="4" class="empty-cell"><i class="fas fa-user-astronaut"></i><p>Nenhum admin encontrado.</p></td>
                  </tr>
                  <tr v-for="u in filteredMasters" :key="u.id">
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="user-avatar-bo" style="width:34px;height:34px;font-size:0.72rem;background:var(--master-brand)">
                          {{ initials(u.person?.name ?? u.username ?? '?') }}
                        </div>
                        <div>
                          <p style="font-weight:600;color:var(--text-primary);font-size:0.88rem">{{ u.person?.name ?? u.username ?? '—' }}</p>
                          <p style="font-size:0.72rem;color:var(--text-muted)">{{ u.person?.email ?? '—' }}</p>
                        </div>
                      </div>
                    </td>
                    <td><code class="prefix-code">{{ u.username ?? u.user_login ?? '—' }}</code></td>
                    <td><span class="badge master-badge"><i class="fas fa-crown"></i> {{ u.profile?.name ?? 'Master' }}</span></td>
                    <td>
                      <router-link :to="`/app/usuarios/${u.id}/editar`" class="icon-btn" title="Editar Admin"><i class="fas fa-pen"></i></router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB: AUDIT LOGS (API) -->
          <div v-else-if="activeTab === 'logs'" key="logs" class="fade-panel">
            <div class="bo-page-header">
              <div class="bo-page-header-left">
                <div class="title-with-badge">
                  <h1>Audit Logs <span style="font-size:0.8rem;color:var(--text-bo-muted);font-weight:400">(API)</span></h1>
                  <span class="badge-bo">LOGS</span>
                </div>
                <p>Registro de todas as chamadas de API feitas pelos operadores.</p>
              </div>
              <div class="header-actions">
                <select v-model="logDays" @change="loadLogs" class="filter-select">
                  <option :value="1">Últimas 24h</option>
                  <option :value="3">Últimos 3 dias</option>
                  <option :value="7">Últimos 7 dias</option>
                </select>
                <button class="icon-btn" @click="loadLogs" title="Recarregar"><i class="fas fa-rotate-right"></i></button>
              </div>
            </div>

            <!-- Filtros -->
            <div class="log-filters">
              <div class="table-search-bar" style="flex:1">
                <i class="fas fa-magnifying-glass"></i>
                <input v-model="logSearch" type="text" placeholder="Filtrar por rota, mensagem ou usuário..." />
              </div>
              <select v-model="logTenantFilter" class="filter-select" @change="loadLogs">
                <option value="">Todos os Tenants</option>
                <option value="korvy">Korvyan (Master)</option>
                <option value="mundialgolden">Mundial Golden</option>
                <option v-for="t in tenantsData" :key="t.id" :value="t.tenant_prefix">{{ t.name }} ({{ t.tenant_prefix }})</option>
              </select>
              <select v-model="logStatusFilter" class="filter-select">
                <option value="">Todos os status</option>
                <option value="success">Somente sucesso</option>
                <option value="error">Somente erros</option>
              </select>
            </div>

            <div v-if="loadingLogs" class="loading-state">
              <i class="fas fa-spinner fa-spin"></i> Carregando logs do Firebase...
            </div>
            <div v-else-if="logsError" class="error-bar">
              <i class="fas fa-circle-exclamation"></i> {{ logsError }}
            </div>
            <div v-else class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>ROTA</th>
                    <th>MÉTODO</th>
                    <th>STATUS</th>
                    <th>DURAÇÃO</th>
                    <th>TENANT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!filteredLogs.length">
                    <td colspan="6" class="empty-cell">
                      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;width:100%;min-height:180px">
                        <i class="fas fa-server"></i>
                        <p>Nenhum log encontrado para o período selecionado.</p>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="(log, i) in filteredLogs" :key="i" :class="{ 'row-error': !log.success }">
                    <td style="font-size:0.78rem;color:var(--text-muted);white-space:nowrap">
                      {{ formatLogTime(log.timestamp) }}
                    </td>
                    <td><code class="prefix-code" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;display:inline-block">{{ log.route }}</code></td>
                    <td>
                      <span :class="['method-badge', log.method?.toLowerCase()]">{{ log.method }}</span>
                    </td>
                    <td>
                      <span :class="['badge', log.success ? 'success' : 'danger']">{{ log.status }}</span>
                    </td>
                    <td style="font-size:0.82rem">
                      <span :style="{ color: log.duration_ms> 1000 ? '#f59e0b' : 'var(--text-secondary)' }">
                        {{ log.duration_ms }}ms
                      </span>
                    </td>
                    <td style="font-size:0.8rem;color:var(--text-muted)">{{ log.tenant }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="table-footer-bar">
                <span>{{ filteredLogs.length }} registros exibidos</span>
              </div>
            </div>
          </div>

          <!-- TAB: SCOPES -->
          <div v-else-if="activeTab === 'scopes'" key="scopes" class="fade-panel">
            <div class="bo-page-header">
              <div class="bo-page-header-left">
                <div class="title-with-badge">
                  <h1>Tabela de Permissões (Scopes)</h1>
                  <span class="badge-bo">RBAC</span>
                </div>
                <p>Controle do RBAC (Role-Based Access Control) a nível de código fonte.</p>
              </div>
              <div class="header-actions">
                <button class="btn btn-master" @click="openScopeModal()"><i class="fas fa-plus"></i> Novo Escopo</button>
              </div>
            </div>

            <div class="table-container">
              <div class="table-search-bar">
                <i class="fas fa-magnifying-glass"></i>
                <input v-model="scopeSearch" type="text" placeholder="Filtrar por código..." />
              </div>
              <table class="data-table">
                <thead>
                  <tr><th>CÓDIGO</th><th>DESCRIÇÃO</th><th></th></tr>
                </thead>
                <tbody>
                  <tr v-if="loadingScopes">
                    <td colspan="3" class="empty-cell"><i class="fas fa-spinner fa-spin"></i></td>
                  </tr>
                  <tr v-else-if="!filteredScopes.length">
                    <td colspan="3" class="empty-cell"><i class="fas fa-key"></i><p>Nenhum escopo encontrado.</p></td>
                  </tr>
                  <tr v-for="s in filteredScopes" :key="s.id ?? s.code">
                    <td><code class="prefix-code" style="color:var(--master-brand)">{{ s.code }}</code></td>
                    <td style="color:var(--text-secondary);font-size:0.85rem;white-space:pre-line;" v-html="formatScopeDescription(s.description)"></td>
                    <td>
                      <button class="icon-btn" @click="openScopeModal(s)"><i class="fas fa-pen"></i></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB: API KEYS -->
          <div v-else-if="activeTab === 'api-keys'" key="api-keys" class="fade-panel">
            <ApiKeysView />
          </div>

          <div v-else-if="activeTab === 'faturamento'" key="faturamento" class="fade-panel">
            <FaturamentoView />
          </div>

          <div v-else-if="activeTab === 'kanban'" key="kanban" class="fade-panel">
            <KeepAlive>
              <KanbanView />
            </KeepAlive>
          </div>

          <div v-else-if="activeTab === 'emails'" key="emails" class="fade-panel">
            <EmailsView />
          </div>

          <!-- TAB: CHAMADOS -->
          <div v-else-if="activeTab === 'chamados'" key="chamados" class="fade-panel">
            <div class="bo-page-header">
              <div class="bo-page-header-left">
                <div class="title-with-badge">
                  <h1>Central de Chamados Global</h1>
                  <span class="badge-bo">SUPORTE</span>
                </div>
                <p>Tickets de suporte abertos pelos usuários em todas as empresas.</p>
              </div>
              <div class="header-actions">
                <button class="icon-btn" @click="loadTickets" title="Atualizar"><i class="fas fa-rotate-right"></i></button>
              </div>
            </div>

            <div class="table-container">
              <div class="table-search-bar">
                <i class="fas fa-magnifying-glass"></i>
                <input v-model="ticketSearch" type="text" placeholder="Filtrar por título, usuário ou tenant..." />
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>DATA</th>
                    <th>TENANT</th>
                    <th>USUÁRIO</th>
                    <th>TÍTULO</th>
                    <th>PRIORIDADE</th>
                    <th>STATUS</th>
                    <th style="text-align:right"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingTickets">
                    <td colspan="7" class="empty-cell"><i class="fas fa-spinner fa-spin"></i></td>
                  </tr>
                  <tr v-else-if="!filteredTickets.length">
                    <td colspan="7" class="empty-cell"><i class="fas fa-headset"></i><p>Nenhum chamado encontrado.</p></td>
                  </tr>
                  <tr v-for="t in filteredTickets" :key="t.id" style="cursor: pointer;" @click="openTicketDetails(t)">
                    <td style="font-size:0.8rem;color:var(--text-muted)">{{ formatDate(t.created_at) }}</td>
                    <td><span class="tenant-badge">{{ t.tenant_prefix || 'korvy' }}</span></td>
                    <td>
                      <p style="font-weight:600;margin:0;font-size:0.88rem;color:var(--text-primary)">{{ t.user_name || 'Usuário' }}</p>
                      <p style="font-size:0.72rem;color:var(--text-muted);margin:0">{{ t.user_email || '—' }}</p>
                    </td>
                    <td style="font-weight:500">
                      <div>{{ t.title }}</div>
                      <span v-if="t.protocol" style="font-family: monospace; font-size: 0.72rem; color: var(--gold, #d4af37);">{{ t.protocol }}</span>
                    </td>
                    <td>
                      <span :class="['badge', t.priority === 'alta' || t.priority === 'urgente' ? 'danger' : 'master-badge']">
                        {{ t.priority || 'média' }}
                      </span>
                    </td>
                    <td>
                      <span :class="['badge', t.status === 'RESOLVIDO' ? 'success' : (t.status === 'EM_ANALISE' ? 'warning' : 'master-badge')]">
                        {{ t.status || 'ABERTO' }}
                      </span>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px" @click.stop>
                        <button class="btn btn-outline btn-xs" @click="openTicketDetails(t)" title="Ver histórico e responder">
                          <i class="fas fa-comment-dots"></i> Detalhes
                        </button>
                        <button class="icon-btn" title="Alternar status" @click="toggleTicketStatus(t)">
                          <i :class="t.status === 'RESOLVIDO' ? 'fas fa-rotate-left' : 'fas fa-check-double'" style="color:var(--success)"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB: MODULOS & ADD-ONS (Add-on Centric) -->
          <div v-else-if="activeTab === 'modulos'" key="modulos" class="fade-panel">
            <div class="bo-page-header">
              <div class="bo-page-header-left">
                <div class="title-with-badge">
                  <h1>Módulos & Add-ons</h1>
                  <span class="badge-bo">PORTAL</span>
                </div>
                <p>Gerencie quais empresas têm acesso a cada recurso. Clique no chip de uma empresa para ativar ou desativar.</p>
              </div>
            </div>

            <!-- Barra de controles: pesquisa + filtro -->
            <div class="addons-controls-bar">
              <div class="table-search-bar" style="flex:1; max-width: 340px; margin-bottom: 0;">
                <i class="fas fa-magnifying-glass"></i>
                <input v-model="addonTenantSearch" type="text" placeholder="Filtrar por empresa..." />
              </div>
              <div class="addons-filter-tabs">
                <button :class="['filter-tab', addonFilter === 'all' ? 'active' : '']" @click="addonFilter = 'all'">Todos</button>
                <button :class="['filter-tab', addonFilter === 'active' ? 'active' : '']" @click="addonFilter = 'active'">Ativos</button>
                <button :class="['filter-tab', addonFilter === 'inactive' ? 'active' : '']" @click="addonFilter = 'inactive'">Inativos</button>
              </div>
            </div>

            <!-- Estado vazio: sem tenants no cache -->
            <div v-if="!tenantsData.length && !loadingTenants" class="empty-cell" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-bo); border-radius: 12px; padding: 4rem 2rem; text-align: center; margin-top: 1rem; box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);">
              <div style="background: rgba(139, 92, 246, 0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                <i class="fas fa-building" style="font-size: 2.5rem; color: var(--master-brand);"></i>
              </div>
              <h3 style="color: var(--text-bo); margin: 0 0 8px 0; font-size: 1.2rem;">Nenhuma empresa cadastrada</h3>
              <p style="color: var(--text-bo-muted); font-size: 0.9rem; max-width: 400px; margin: 0 auto 1.5rem; line-height: 1.5;">O banco de dados não retornou nenhum tenant no momento. Aguarde a sincronização automática ou force a atualização.</p>
              <button class="btn btn-primary" style="background: var(--master-brand); color: white;" @click="loadTenants"><i class="fas fa-rotate-right"></i> Sincronizar Agora</button>
            </div>

            <!-- Grid de Add-on Cards -->
            <div v-else class="addons-full-grid">
              <div v-for="addon in ADDON_CATALOG" :key="addon.key" class="addon-full-card">

                <!-- Cabeçalho do card -->
                <div class="addon-full-header">
                  <i :class="addon.icon" :style="{ color: addon.color }"></i>
                  <div class="addon-full-info">
                    <h4>{{ addon.label }}</h4>
                    <span>{{ addon.subtitle }}</span>
                  </div>
                  <span class="addon-active-count">
                    <i class="fas fa-check-circle" style="color: var(--gold); font-size: 0.7rem;"></i>
                    {{ activeCountForAddon(addon.key, addon.defaultActive) }} ativa(s)
                  </span>
                </div>

                <!-- Descrição -->
                <p class="addon-desc" style="margin: 0; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">{{ addon.desc }}</p>

                <!-- Chips de tenants -->
                  <div class="tenant-chips-row">
                    <template v-if="loadingTenants">
                      <span class="chip-empty"><i class="fas fa-spinner fa-spin"></i> Carregando empresas...</span>
                    </template>
                    <template v-else>
                      <div
                        v-for="t in filteredTenantsForAddon(addon.key, addon.defaultActive, true)"
                        :key="t.tenant_prefix"
                        class="tenant-chip active"
                        title="Remover acesso"
                        @click="toggleTenantAddon(t, addon.key)"
                      >
                        <div class="chip-dot" :style="{ background: t.primary_color || '#D4AF37' }">
                          {{ (t.name || t.tenant_prefix || '?').substring(0, 1).toUpperCase() }}
                        </div>
                        <span>{{ t.name || t.tenant_prefix }}</span>
                        <i class="fas fa-times"></i>
                      </div>

                      <select class="add-tenant-select" @change="e => { addAddonToTenantId(e.target.value, addon.key); e.target.value = '' }">
                        <option value="" disabled selected>+ Adicionar Empresa</option>
                        <option v-for="t in filteredTenantsForAddon(addon.key, addon.defaultActive, false)" :key="t.tenant_prefix" :value="t.tenant_prefix">
                          {{ t.name || t.tenant_prefix }}
                        </option>
                      </select>
                    </template>
                  </div>
                  
                  <!-- Botão de config de IA (só para addons com hasConfig) -->
                <template v-if="addon.hasConfig">
                  <button class="btn-config-ia" @click="expandedAiConfig = expandedAiConfig === addon.key ? '' : addon.key">
                    <i class="fas fa-key"></i>
                    {{ expandedAiConfig === addon.key ? 'Fechar credenciais de IA' : 'Configurar credenciais de IA' }}
                    <i :class="expandedAiConfig === addon.key ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" style="font-size: 0.65rem; margin-left: auto;"></i>
                  </button>

                  <!-- Painel expandível de credenciais de IA -->
                  <div v-if="expandedAiConfig === addon.key" class="ai-config-panel">
                    <h5 style="margin: 0 0 12px; font-size: 0.75rem; font-weight: 700; color: var(--gold); letter-spacing: 0.5px;">CREDENCIAIS DE IA — POR EMPRESA</h5>

                    <!-- Seletor de empresa para configurar credenciais -->
                    <div class="form-group" style="margin-bottom: 12px;">
                      <label>EMPRESA PARA CONFIGURAR</label>
                      <select v-model="selectedTenantForAddons" class="form-input" style="height: 38px;">
                        <option value="">-- Selecione a empresa --</option>
                        <option v-for="t in tenantsData" :key="t.tenant_prefix" :value="t.tenant_prefix">
                          {{ t.name || t.tenant_prefix }} ({{ t.tenant_prefix }})
                        </option>
                      </select>
                    </div>

                    <div v-if="selectedTenantAddonsObj">
                      <div class="ai-provider-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div class="form-group">
                          <label>PROVEDOR DE IA *</label>
                          <select v-model="aiProvider" class="form-input" style="height: 38px;">
                            <option value="gemini">Google Gemini AI</option>
                            <option value="openai">OpenAI (ChatGPT)</option>
                          </select>
                        </div>
                        <div class="form-group">
                          <label>MODELO *</label>
                          <input v-model="aiModel" type="text" class="form-input" placeholder="ex: gemini-1.5-flash" />
                        </div>
                      </div>
                      <div class="form-group" style="margin-bottom: 12px;">
                        <label>CHAVE DE API (API KEY) *</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                          <input :type="showApiKey ? 'text' : 'password'" v-model="aiApiKey" class="form-input" placeholder="Cole a chave privada do provedor aqui" />
                          <button class="btn btn-outline" style="height: 38px; padding: 0 12px; flex-shrink:0;" @click="showApiKey = !showApiKey">
                            <i :class="showApiKey ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                          </button>
                        </div>
                      </div>
                      <button class="btn btn-gold" style="height: 36px;" @click="saveTenantAiConfig" :disabled="savingAiConfig">
                        <i v-if="savingAiConfig" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-floppy-disk"></i>
                        Salvar Credenciais
                      </button>
                    </div>
                    <p v-else style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Selecione uma empresa acima para configurar as credenciais de IA.</p>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- TAB: FAQ / MANUAIS E VIDEOS (FAQ CRUD) -->
          <div v-else-if="activeTab === 'conhecimento' || activeTab === 'faq'" key="faq" class="fade-panel">
            <div class="bo-page-header">
              <div class="bo-page-header-left">
                <div class="title-with-badge">
                  <h1>Gestão de Manuais e Vídeos</h1>
                  <span class="badge-bo">FAQ</span>
                </div>
                <p>Crie e edite os artigos e vídeos do FAQ exibidos para todos os clientes.</p>
              </div>
              <div class="header-actions">
                <button class="btn btn-master" @click="openFaqModal()"><i class="fas fa-plus"></i> Novo Artigo</button>
              </div>
            </div>

            <div class="table-container">
              <div class="table-search-bar">
                <i class="fas fa-magnifying-glass"></i>
                <input v-model="faqSearch" type="text" placeholder="Filtrar artigos..." />
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>CATEGORIA</th>
                    <th>TÍTULO</th>
                    <th>TIPO</th>
                    <th>CRIADO EM</th>
                    <th style="text-align:right"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingFaq">
                    <td colspan="5" class="empty-cell"><i class="fas fa-spinner fa-spin"></i></td>
                  </tr>
                  <tr v-else-if="!filteredFaqArticles.length">
                    <td colspan="5" class="empty-cell"><i class="fas fa-book-open"></i><p>Nenhum artigo encontrado. Clique em "Novo Artigo" para começar.</p></td>
                  </tr>
                  <tr v-for="a in filteredFaqArticles" :key="a.id">
                    <td><span class="tenant-badge">{{ a.category }}</span></td>
                    <td style="font-weight:600">{{ a.title }}</td>
                    <td>
                      <span v-if="a.hasVideo" class="badge success"><i class="fas fa-video"></i> Vídeo</span>
                      <span v-else class="badge master-badge"><i class="fas fa-file-lines"></i> Artigo</span>
                    </td>
                    <td style="font-size:0.8rem;color:var(--text-muted)">{{ formatDate(a.created_at) }}</td>
                    <td style="text-align:right;display:flex;gap:6px;justify-content:flex-end">
                      <button class="icon-btn" @click="openFaqModal(a)" title="Editar"><i class="fas fa-pen"></i></button>
                      <button class="icon-btn" @click="deleteFaqArticle(a.id)" title="Excluir"><i class="fas fa-trash" style="color:var(--danger)"></i></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB: NOTIFICAÇÕES / BROADCAST -->
          <div v-else-if="activeTab === 'notificacoes'" key="notificacoes" class="fade-panel">
            <div class="bo-page-header">
              <div class="bo-page-header-left">
                <div class="title-with-badge">
                  <h1>Disparo de Notificações</h1>
                  <span class="badge-bo">BROADCAST</span>
                </div>
                <p>Envie notificações in-app ou e-mails para todos os tenants ou apenas selecionados.</p>
              </div>
            </div>

            <div class="card" style="padding:2rem;margin-bottom:1.5rem">
              <h3 style="font-size:1rem;font-weight:700;margin-bottom:1.25rem;color:var(--text-primary)">Nova Notificação / Broadcast</h3>
              <div class="broadcast-form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
                <div class="form-group">
                  <label>TIPO DE DISPARO</label>
                  <select v-model="broadcastForm.type" class="form-input">
                    <option value="notification">Notificação In-App (Sininho)</option>
                    <option value="email">E-mail</option>
                    <option value="both">Ambos (Notificação + E-mail)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>DESTINATÁRIOS</label>
                  <select v-model="broadcastForm.target" class="form-input">
                    <option value="all">Todos os Tenants</option>
                    <option v-for="t in tenantsData" :key="t.tenant_prefix" :value="t.tenant_prefix">{{ t.name || t.tenant_prefix }}</option>
                  </select>
                </div>
                <div class="form-group full">
                  <label>TÍTULO DA MENSAGEM *</label>
                  <input v-model="broadcastForm.title" type="text" class="form-input" placeholder="Ex: Manutenção programada para amanhã" />
                </div>
                <div class="form-group full">
                  <label>CORPO DA MENSAGEM *</label>
                  <textarea v-model="broadcastForm.body" class="form-input" rows="4" placeholder="Escreva a mensagem completa aqui..."></textarea>
                </div>
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:1rem">
                <button class="btn btn-master" @click="sendBroadcast" :disabled="sendingBroadcast || !broadcastForm.title || !broadcastForm.body">
                  <i v-if="sendingBroadcast" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-satellite-dish"></i>
                  {{ sendingBroadcast ? 'Enviando...' : 'Disparar Mensagem' }}
                </button>
              </div>
              <div v-if="broadcastSuccess" class="success-bar" style="margin-top:1rem">
                <i class="fas fa-circle-check"></i> Notificação enviada com sucesso para os tenants selecionados!
              </div>
            </div>
          </div>

        </transition>
      </div>
    </main>

    <!-- Modal Tenant -->
    <teleport to="body">
      <div v-if="showTenantModal" class="modal-overlay">
        <div class="modal-card-bo">
          <div class="modal-header">
            <h3>{{ editingTenant ? 'Editar Tenant' : 'Novo Tenant' }}</h3>
            <button class="close-btn" @click="showTenantModal = false" title="Fechar"><i class="fas fa-xmark"></i></button>
          </div>
          <div class="modal-body-bo">
            <div class="form-grid-bo">
              <div class="form-group full">
                <label>PREFIXO (slug) *</label>
                <input v-model="tenantForm.tenant_prefix" type="text" class="form-input" :disabled="!!editingTenant" placeholder="ex: empresa-abc" />
              </div>
              <div class="form-group full">
                <label>NOME DA EMPRESA</label>
                <input v-model="tenantForm.name" type="text" class="form-input" placeholder="Empresa ABC Ltda" />
              </div>
              <div class="form-group">
                <label>COR PRINCIPAL</label>
                <div style="display:flex;gap:8px;align-items:center">
                  <input v-model="tenantForm.primary_color" type="color" style="width:40px;height:38px;border:1px solid var(--border-bo, #334155);border-radius:6px;cursor:pointer;background:none;padding:2px" />
                  <input v-model="tenantForm.primary_color" type="text" class="form-input" placeholder="#D4AF37" />
                </div>
              </div>
              <div class="form-group">
                <label>PLANO</label>
                <select v-model="tenantForm.plan" class="form-input">
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div class="form-group full">
                <label>TELEFONE DE SUPORTE (WhatsApp)</label>
                <input type="text" class="form-input" placeholder="+55 (11) 99999-9999"  v-model="tenantForm.support_phone" maxlength="15" @input="tenantForm.support_phone = maskPhone(tenantForm.support_phone)" />
              </div>
            </div>
            <div v-if="tenantModalError" class="error-bar" style="margin-top:1rem">
              <i class="fas fa-circle-exclamation"></i> {{ tenantModalError }}
            </div>
          </div>
          <div class="modal-footer-bo">
            <button class="btn btn-outline" @click="showTenantModal = false">Cancelar</button>
            <button class="btn btn-master" @click="saveTenant" :disabled="savingTenant">
              <i v-if="savingTenant" class="fas fa-spinner fa-spin"></i>
              <span v-else>{{ editingTenant ? 'Salvar' : 'Criar Tenant' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Scope -->
      <div v-if="showScopeModal" class="modal-overlay">
        <div class="modal-card-bo" style="max-width:440px">
          <div class="modal-header">
            <h3>{{ editingScope ? 'Editar Escopo' : 'Novo Escopo' }}</h3>
            <button class="close-btn" @click="showScopeModal = false" title="Fechar"><i class="fas fa-xmark"></i></button>
          </div>
          <div class="modal-body-bo">
            <div style="display:flex;flex-direction:column;gap:1rem">
              <div class="form-group">
                <label>CÓDIGO *</label>
                <input v-model="scopeForm.code" type="text" class="form-input" :disabled="!!editingScope" placeholder="ex: contracts.create" />
              </div>
              <div class="form-group">
                <label>DESCRIÇÃO</label>
                <input v-model="scopeForm.description" type="text" class="form-input" placeholder="Descreva o escopo..." />
              </div>
            </div>
            <div v-if="scopeModalError" class="error-bar" style="margin-top:1rem">
              <i class="fas fa-circle-exclamation"></i> {{ scopeModalError }}
            </div>
          </div>
          <div class="modal-footer-bo">
            <button class="btn btn-outline" @click="showScopeModal = false">Cancelar</button>
            <button class="btn btn-master" @click="saveScope" :disabled="savingScope">
              <i v-if="savingScope" class="fas fa-spinner fa-spin"></i>
              <span v-else>{{ editingScope ? 'Salvar' : 'Criar' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal FAQ Article -->
      <div v-if="showFaqModal" class="modal-overlay">
        <div class="modal-card-bo" style="max-width:580px">
          <div class="modal-header">
            <h3>{{ editingFaqArticle ? 'Editar Artigo' : 'Novo Artigo de FAQ' }}</h3>
            <button class="close-btn" @click="showFaqModal = false" title="Fechar"><i class="fas fa-xmark"></i></button>
          </div>
          <div class="modal-body-bo">
            <div style="display:flex;flex-direction:column;gap:1rem">
              <div class="form-group">
                <label>TÍTULO *</label>
                <input v-model="faqForm.title" type="text" class="form-input" placeholder="Título do artigo ou vídeo" />
              </div>
              <div class="form-group">
                <label>CATEGORIA</label>
                <select v-model="faqForm.category" class="form-input">
                  <option v-for="c in faqCategories" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>DESCRIÇÃO BREVE</label>
                <input v-model="faqForm.description" type="text" class="form-input" placeholder="Resumo em uma linha" />
              </div>
              <div class="form-group" style="display:flex;align-items:center;gap:10px">
                <input type="checkbox" v-model="faqForm.hasVideo" id="faqHasVideo" />
                <label for="faqHasVideo" style="font-size:0.85rem;cursor:pointer;color:var(--text-bo, #f8fafc)">Possui Vídeo</label>
              </div>
              <div v-if="faqForm.hasVideo" class="form-group">
                <label>URL DO VÍDEO (YouTube embed)</label>
                <input v-model="faqForm.videoUrl" type="text" class="form-input" placeholder="https://www.youtube.com/embed/..." />
              </div>
              <div class="form-group">
                <label>CONTEÚDO HTML (opcional)</label>
                <textarea v-model="faqForm.content" class="form-input" rows="4" placeholder="Conteúdo do artigo em HTML ou texto..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer-bo">
            <button class="btn btn-outline" @click="showFaqModal = false">Cancelar</button>
            <button class="btn btn-master" @click="saveFaqArticle" :disabled="savingFaq || !faqForm.title">
              <i v-if="savingFaq" class="fas fa-spinner fa-spin"></i>
              <span v-else>{{ editingFaqArticle ? 'Salvar' : 'Criar Artigo' }}</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Modal Detalhes e Resposta de Chamado (Admin Mode) -->
    <TicketDetailsModal
      v-model="showTicketDetailsModal"
      :ticket="selectedTicketForModal"
      mode="admin"
      :admin-name="masterUser.name || 'Suporte Korvyan'"
      @ticket-updated="onTicketUpdatedFromModal"
    />
  </div>
</template>

<script setup lang="ts">
import { maskCPF, maskPhone, maskCEP, maskEmail } from '@/utils/masks'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useTheme } from '@/composables/useTheme'
import { getAllTenants, createTenant, updateTenantConfig, updateTenantApiStatus, type Tenant } from '@/services/tenant.service'
import { getAllOperators, type User } from '@/services/user.service'
import { getAllScopes, formatScopeDescription, type Scope } from '@/services/scope.service'
import ApiKeysView from './ApiKeysView.vue'
import FaturamentoView from './FaturamentoView.vue'
import KanbanView from './KanbanView.vue'
import EmailsView from './EmailsView.vue'
import { getAccessLogs } from '@/services/audit.service'
import { getRecentLogs, getStats, type ApiLogEntry, type ApiStats } from '@/services/analytics.service'
import { apiPost, apiPatch } from '@/services/api'
import { useToast } from '@/composables/useToast'
import TicketDetailsModal, { type TicketItem } from '@/components/modals/TicketDetailsModal.vue'

import { getFirestore, collection, getDocs, updateDoc, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { firebaseApp, auth } from '@/services/firebase.config'
import { authLogoutApi } from '@/services/auth.service'
import { signOut } from 'firebase/auth'

const router = useRouter()
const db = getFirestore(firebaseApp)
const { theme, toggleTheme } = useTheme()
const activeTab = ref('dashboard')

const mobileSidebarOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

function handleClickOutside(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    userMenuOpen.value = false
  }
}

function navigateTo(path: string) {
  userMenuOpen.value = false
  mobileSidebarOpen.value = false
  router.push(path)
}

async function doLogout() {
  userMenuOpen.value = false
  mobileSidebarOpen.value = false
  try {
    await authLogoutApi()
  } catch {}
  try {
    await signOut(auth)
  } catch {}
  const keys = ['access_token', 'refresh_token', 'user_info']
  keys.forEach(k => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  })
  localStorage.removeItem('remember_me')
  router.push('/login')
}

const { success: toastSuccess, error: toastError } = useToast()

// ─── Add-on Catalog (fonte estática, independente da API) ────────────────────
type AddonKey = 'chat' | 'ocr' | 'ai' | 'reports' | 'ai_insights' | 'ai_ocr' | 'ai_financial' | 'ai_templates' | 'ai_fraud' | 'whatsapp_bot' | 'digital_signature' | 'custom_domain'

const ADDON_CATALOG = [
  { key: 'chat'              as AddonKey, label: 'Chat Global',              subtitle: 'Comunicação em Tempo Real',       icon: 'fas fa-comments',       color: '#D4AF37', defaultActive: true,  desc: 'Habilita canais e salas de chat em tempo real para membros e colaboradores da empresa.', hasConfig: false },
  { key: 'ai_insights'       as AddonKey, label: 'Insights com IA',          subtitle: 'Análise Preditiva de Contratos',  icon: 'fas fa-brain',          color: '#a78bfa', defaultActive: false, desc: 'Insights preditivos, assistente inteligente e configuração de credenciais de IA (Gemini / OpenAI).', hasConfig: true },
  { key: 'ai_ocr'            as AddonKey, label: 'OCR com IA',               subtitle: 'Leitura Inteligente de Docs',     icon: 'fas fa-robot',          color: '#fbbf24', defaultActive: false, desc: 'Extração inteligente de dados textuais e cadastrais a partir de fotos e PDFs de documentos.', hasConfig: false },
  { key: 'ai_financial'      as AddonKey, label: 'Assistente Financeiro IA', subtitle: 'Chatbot e Projeções de Caixa',    icon: 'fas fa-coins',          color: '#34d399', defaultActive: false, desc: 'Projeta o faturamento mensal acumulado (MRR) e analisa o histórico de adimplência do tenant.', hasConfig: false },
  { key: 'ai_templates'      as AddonKey, label: 'Gerador de Modelos IA',    subtitle: 'Criação Automática de Cláusulas', icon: 'fas fa-file-signature', color: '#60a5fa', defaultActive: false, desc: 'Auxilia proativamente na redação de cláusulas contratuais especiais e termos sob medida.', hasConfig: false },
  { key: 'ai_fraud'          as AddonKey, label: 'Detector de Fraudes IA',   subtitle: 'Auditoria e Risco de Sinistros',  icon: 'fas fa-shield-virus',   color: '#f87171', defaultActive: false, desc: 'Pontua contratos e solicitações com índice preditivo de fraude e inconsistência cadastral.', hasConfig: false },
  { key: 'reports'           as AddonKey, label: 'Relatórios / Slides',       subtitle: 'Exportações e Dashboards',        icon: 'fas fa-chart-pie',      color: '#4ade80', defaultActive: true,  desc: 'Gera slides de faturamento consolidados e gráficos estatísticos de vendas e contratos.', hasConfig: false },
  { key: 'whatsapp_bot'      as AddonKey, label: 'Bot WhatsApp',              subtitle: 'Lembretes e Cobranças',           icon: 'fab fa-whatsapp',       color: '#25D366', defaultActive: false, desc: 'Lembretes automatizados de boletos e vencimentos via WhatsApp.', hasConfig: false },
  { key: 'digital_signature' as AddonKey, label: 'Assinatura Digital',       subtitle: 'Validade Jurídica',               icon: 'fas fa-pen-nib',        color: '#0ea5e9', defaultActive: false, desc: 'Assinatura digital com validade jurídica integrada aos contratos.', hasConfig: false },
  { key: 'custom_domain'     as AddonKey, label: 'Domínio Customizado',      subtitle: 'URL White-label',                 icon: 'fas fa-globe',          color: '#8b5cf6', defaultActive: false, desc: 'URL personalizada com a marca da empresa.', hasConfig: false },
] as const

// ─── Add-on Módulos: refs de controle ────────────────────────────────────────
const addonTenantSearch = ref('')     // filtro de texto nos chips de tenant
const addonFilter = ref<'all' | 'active' | 'inactive'>('all')   // filtro de status
const expandedAiConfig = ref('')      // qual addon tem config de IA expandida

// ─── Credenciais de IA por tenant ────────────────────────────────────────────
const selectedTenantForAddons = ref<string>('')
const aiProvider = ref('gemini')
const aiApiKey = ref('')
const aiModel = ref('gemini-1.5-flash')
const savingAiConfig = ref(false)
const showApiKey = ref(false)

const selectedTenantAddonsObj = computed(() =>
  tenantsData.value.find(t => t.tenant_prefix === selectedTenantForAddons.value) || null
)

watch(selectedTenantForAddons, (newVal) => {
  if (newVal) {
    const t = tenantsData.value.find(x => x.tenant_prefix === newVal)
    if (t) {
      aiProvider.value = (t as any).ai_config?.provider || 'gemini'
      aiApiKey.value   = (t as any).ai_config?.api_key  || ''
      aiModel.value    = (t as any).ai_config?.model     || 'gemini-1.5-flash'
    }
  }
})

// ─── Helpers dos Add-ons ──────────────────────────────────────────────────────
function isAddonActive(t: Tenant, key: AddonKey, defaultActive: boolean): boolean {
  if (defaultActive) return (t as any).addons?.[key] !== false
  return !!(t as any).addons?.[key]
}

function activeCountForAddon(key: AddonKey, defaultActive: boolean): number {
  return tenantsData.value.filter(t => isAddonActive(t, key, defaultActive)).length
}

function filteredTenantsForAddon(key: AddonKey, defaultActive: boolean): Tenant[] {
  const q = addonTenantSearch.value.toLowerCase().trim()
  return tenantsData.value.filter(t => {
    const name = (t.name || t.tenant_prefix || '').toLowerCase()
    const matchSearch = !q || name.includes(q)
    const active = isAddonActive(t, key, defaultActive)
    if (addonFilter.value === 'active')   return matchSearch && active
    if (addonFilter.value === 'inactive') return matchSearch && !active
    return matchSearch
  })
}

async function saveTenantAiConfig() {
  const prefix = selectedTenantForAddons.value
  if (!prefix) return
  savingAiConfig.value = true
  try {
    const t = tenantsData.value.find(x => x.tenant_prefix === prefix)
    if (t) {
      const config = { provider: aiProvider.value, api_key: aiApiKey.value, model: aiModel.value }
      ;(t as any).ai_config = config
      await updateTenantConfig(prefix, { ai_config: config })
      toastSuccess('Configurações de IA salvas com sucesso!')
    }
  } catch {
    toastError('Falha ao salvar configurações de IA.')
  } finally {
    savingAiConfig.value = false
  }
}

// ─── Master user info ────────────────────────────────────────────────────────
const masterUser = computed(() => {
  try {
    const s = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
    if (s) {
      const u = JSON.parse(s)
      return {
        name: u.person?.name || u.name || u.username || 'Master Admin',
        email: u.person?.email || u.email || ''
      }
    }
  } catch {}
  return { name: 'Master Admin', email: '' }
})

const masterInitials = computed(() => {
  try {
    const s = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
    if (s) {
      const u = JSON.parse(s)
      const name = u.person?.name || u.username || u.name || 'M'
      return name.substring(0, 2).toUpperCase()
    }
  } catch {}
  return 'M'
})

// ─── Dashboard ───────────────────────────────────────────────────────────────
const loadingDash = ref(false)
const dashStats = ref<ApiStats | null>(null)
const totalUsers = ref(0)
const errorRateColor = computed(() => {
  const r = dashStats.value?.error_rate ?? 0
  if (r> 10) return 'color:#ef4444;background:rgba(239,68,68,0.1)'
  if (r> 3) return 'color:#f59e0b;background:rgba(245,158,11,0.1)'
  return 'color:#27c93f;background:rgba(39,201,63,0.1)'
})

async function loadDashboard() {
  loadingDash.value = true
  try {
    const [stats, usersRes] = await Promise.allSettled([
      getStats(1),
      getAllOperators({ columns: { id: true }, filters: {}, offset: 0 }),
    ])
    if (stats.status === 'fulfilled') dashStats.value = stats.value
    if (usersRes.status === 'fulfilled') totalUsers.value = (usersRes.value as any).total ?? 0
  } catch {}
  finally { loadingDash.value = false }
}

// ─── Tenants (declarado ANTES dos tickets para evitar ReferenceError) ─────────
const tenantsData = ref<Tenant[]>([])
const loadingTenants = ref(false)
const tenantError = ref('')
const apiTenantError = ref(false) // true quando /v1/tenant/list/ está indisponível (fallback ativo)
const tenantSearch = ref('')
const showTenantModal = ref(false)
const editingTenant = ref<Tenant | null>(null)
const savingTenant = ref(false)
const tenantModalError = ref('')
const tenantForm = ref({
  tenant_prefix: '',
  name: '',
  primary_color: '#D4AF37',
  plan: 'basic',
  support_phone: '',
  addons: {
    chat: true,
    ocr: false,
    ai: false,
    reports: true,
    ai_insights: false,
    ai_ocr: false,
    ai_financial: false,
    ai_templates: false,
    ai_fraud: false,
    whatsapp_bot: false,
    custom_domain: false,
    digital_signature: false
  }
})

const filteredTenants = computed(() => {
  const q = tenantSearch.value.toLowerCase()
  return q
    ? tenantsData.value.filter(t => (t.name || t.tenant_prefix || '').toLowerCase().includes(q) || t.tenant_prefix.toLowerCase().includes(q))
    : tenantsData.value
})

async function addAddonToTenantId(tenantPrefix: string, addonKey: string) {
  const t = tenantsData.value.find(x => x.tenant_prefix === tenantPrefix)
  if (t) {
    await toggleTenantAddon(t, addonKey)
  }
}

async function toggleTenantAddon(t: Tenant, addonKey: string) {
  const currentAddons = t.addons || { chat: true, ocr: false, ai: false, reports: true, ai_insights: false, ai_ocr: false, ai_financial: false, ai_templates: false, ai_fraud: false, whatsapp_bot: false, custom_domain: false, digital_signature: false }
  const updatedAddons = { ...currentAddons, [addonKey]: !currentAddons[addonKey] }
  t.addons = updatedAddons
  try {
    await updateTenantConfig(t.tenant_prefix, { addons: updatedAddons })
  } catch (e: any) {
    t.addons[addonKey] = !updatedAddons[addonKey]
  }
}

async function loadTenants() {
  loadingTenants.value = true
  tenantError.value = ''
  apiTenantError.value = false

  // Verifica silenciosamente se a API REST está respondendo
  apiPost('/v1/tenant/list/', { columns: { id: true, tenant_prefix: true }, filters: {} })
    .catch(() => { apiTenantError.value = true })

  try {
    const result = await getAllTenants((enriched) => {
      if (Array.isArray(enriched)) tenantsData.value = enriched
    })
    // Garante que nunca atribuimos undefined ou null ao array
    tenantsData.value = Array.isArray(result) ? result : []
  }
  catch (e: any) {
    tenantError.value = e?.message || 'Erro ao carregar tenants'
    tenantsData.value = tenantsData.value.length ? tenantsData.value : []
  }
  finally { loadingTenants.value = false }
}

// ─── Chamados / Tickets Realtime (após tenantsData) ────────────────────────────
const ticketsData = ref<any[]>([])
const loadingTickets = ref(false)
const ticketSearch = ref('')
const showTicketDetailsModal = ref(false)
const selectedTicketForModal = ref<any>(null)

const filteredTickets = computed(() => {
  const q = ticketSearch.value.toLowerCase().trim()
  return q
    ? ticketsData.value.filter(t => 
        (t.title || '').toLowerCase().includes(q) || 
        (t.protocol || '').toLowerCase().includes(q) ||
        (t.user_name || '').toLowerCase().includes(q) || 
        (t.user_email || '').toLowerCase().includes(q) || 
        (t.tenant_prefix || '').toLowerCase().includes(q) ||
        (t.tenant_name || '').toLowerCase().includes(q)
      )
    : ticketsData.value
})

function openTicketDetails(t: any) {
  selectedTicketForModal.value = t
  showTicketDetailsModal.value = true
}

function onTicketUpdatedFromModal(updated: any) {
  const idx = ticketsData.value.findIndex(item => item.id === updated.id)
  if (idx !== -1) {
    ticketsData.value[idx] = { ...updated }
  }
}

async function loadTickets() {
  loadingTickets.value = true
  try {
    const list: any[] = []
    // Busca tickets em todos os tenants já carregados + tenants conhecidos
    const knownPrefixes = new Set<string>(['korvy', 'mundialgolden'])
    tenantsData.value.forEach(t => { if (t.tenant_prefix) knownPrefixes.add(t.tenant_prefix) })
    for (const prefix of knownPrefixes) {
      try {
        const snap = await getDocs(collection(db, 'tenants', prefix, 'tickets'))
        snap.docs.forEach(docSnap => {
          const d = docSnap.data()
          const parseDate = (val: any) => {
            if (!val) return new Date().toISOString()
            if (val?.toDate && typeof val.toDate === 'function') return val.toDate().toISOString()
            if (typeof val === 'object' && ('seconds' in val || '_seconds' in val)) {
              return new Date((val.seconds ?? val._seconds) * 1000).toISOString()
            }
            if (typeof val === 'number') return new Date(val > 1e11 ? val : val * 1000).toISOString()
            const parsed = new Date(val)
            return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
          }
          const createdDate = parseDate(d.created_at)
          const updatedDate = parseDate(d.updated_at || d.created_at)
          const tenantObj = tenantsData.value.find(t => t.tenant_prefix === prefix)

          let msgs = Array.isArray(d.messages) ? d.messages : []
          if (msgs.length === 0 && (d.description || d.title)) {
            msgs = [{
              id: 'init_' + docSnap.id,
              sender: 'user',
              sender_name: d.user_name || 'Solicitante',
              message: d.description || d.title,
              created_at: createdDate
            }]
          }

          list.push({
            ...d,
            id: docSnap.id,
            docRef: docSnap.ref,
            tenant_prefix: prefix,
            tenant_name: d.tenant_name || tenantObj?.name || prefix,
            protocol: d.protocol || ('#TK-' + docSnap.id.substring(0, 4).toUpperCase()),
            title: d.title || 'Chamado sem título',
            category: d.category || 'Geral',
            priority: d.priority || 'media',
            status: d.status || 'ABERTO',
            user_name: d.user_name || 'Usuário',
            user_email: d.user_email || '',
            description: d.description || '',
            messages: msgs,
            created_at: createdDate,
            updated_at: updatedDate
          })
        })
      } catch {}
    }
    ticketsData.value = list.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
  } catch (e) {
    console.error('[Backoffice Tickets] Erro ao carregar tickets:', e)
  } finally {
    loadingTickets.value = false
  }
}

async function toggleTicketStatus(t: any) {
  const newStatus = t.status === 'RESOLVIDO' ? 'ABERTO' : 'RESOLVIDO'
  const nowIso = new Date().toISOString()
  t.status = newStatus
  t.updated_at = nowIso

  if (!t.messages) t.messages = []
  t.messages.push({
    id: 'sys_' + Date.now(),
    sender: 'system',
    sender_name: 'Sistema Korvyan',
    message: newStatus === 'RESOLVIDO'
      ? `Chamado marcado como RESOLVIDO pelo administrador (${masterUser.value?.name || 'Suporte Korvyan'}).`
      : `Chamado reaberto pelo administrador (${masterUser.value?.name || 'Suporte Korvyan'}).`,
    created_at: nowIso
  })

  try {
    if (t.docRef) {
      await updateDoc(t.docRef, {
        status: newStatus,
        messages: t.messages,
        updated_at: serverTimestamp()
      })
    }
  } catch (e) {
    console.error('[Backoffice Tickets] Erro ao atualizar status:', e)
  }
}

// ─── FAQ Articles (Manuais e Vídeos) ────────────────────────────────────────
const faqArticlesData = ref<any[]>([])
const loadingFaq = ref(false)
const faqSearch = ref('')
const showFaqModal = ref(false)
const editingFaqArticle = ref<any>(null)
const savingFaq = ref(false)
const faqForm = ref({ title: '', category: '', description: '', videoUrl: '', content: '', hasVideo: false })

const faqCategories = ['Contratos & Clientes', 'Financeiro & Mensalidades', 'Relatórios & Slideshow', 'Usuários & Permissões', 'Configurações', 'Outros']

const filteredFaqArticles = computed(() => {
  const q = faqSearch.value.toLowerCase()
  return q ? faqArticlesData.value.filter(a => (a.title || '').toLowerCase().includes(q) || (a.category || '').toLowerCase().includes(q)) : faqArticlesData.value
})

async function loadFaqArticles() {
  loadingFaq.value = true
  try {
    const snap = await getDocs(collection(db, 'faq_articles'))
    faqArticlesData.value = snap.docs.map(d => ({ id: d.id, docRef: d.ref, ...d.data(), created_at: d.data().created_at?.toDate ? d.data().created_at.toDate().toISOString() : new Date().toISOString() })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (e) {
    console.error('[FAQ Articles] Erro ao carregar:', e)
  } finally {
    loadingFaq.value = false
  }
}

function openFaqModal(a?: any) {
  editingFaqArticle.value = a ?? null
  faqForm.value = {
    title: a?.title ?? '',
    category: a?.category ?? faqCategories[0],
    description: a?.description ?? '',
    videoUrl: a?.videoUrl ?? '',
    content: a?.content ?? '',
    hasVideo: a?.hasVideo ?? false
  }
  showFaqModal.value = true
}

async function saveFaqArticle() {
  if (!faqForm.value.title.trim()) return
  savingFaq.value = true
  try {
    const payload = { ...faqForm.value, updated_at: new Date().toISOString() }
    if (editingFaqArticle.value) {
      await updateDoc(editingFaqArticle.value.docRef, payload)
    } else {
      await addDoc(collection(db, 'faq_articles'), { ...payload, created_at: serverTimestamp() })
    }
    showFaqModal.value = false
    await loadFaqArticles()
  } catch (e: any) {
    console.error('[FAQ Articles] Erro ao salvar:', e)
  } finally {
    savingFaq.value = false
  }
}

async function deleteFaqArticle(id: string) {
  try {
    await deleteDoc(doc(db, 'faq_articles', id))
    faqArticlesData.value = faqArticlesData.value.filter(a => a.id !== id)
  } catch (e) {
    console.error('[FAQ Articles] Erro ao excluir:', e)
  }
}

// ─── Broadcast de Notificações ───────────────────────────────────────────────
const broadcastForm = ref({ type: 'notification', target: 'all', title: '', body: '' })
const sendingBroadcast = ref(false)
const broadcastSuccess = ref(false)

async function sendBroadcast() {
  if (!broadcastForm.value.title || !broadcastForm.value.body) return
  sendingBroadcast.value = true
  broadcastSuccess.value = false
  try {
    const targets = broadcastForm.value.target === 'all'
      ? tenantsData.value.map(t => t.tenant_prefix)
      : [broadcastForm.value.target]

    const notif = {
      title: broadcastForm.value.title,
      text: broadcastForm.value.body,
      type: broadcastForm.value.type,
      read: false,
      icon: 'fas fa-bullhorn',
      color: 'var(--master-brand)',
      created_at: serverTimestamp()
    }

    for (const prefix of targets) {
      if (!prefix) continue
      try {
        await addDoc(collection(db, 'tenants', prefix, 'notifications'), notif)
      } catch {}
    }
    broadcastSuccess.value = true
    broadcastForm.value = { type: 'notification', target: 'all', title: '', body: '' }
    setTimeout(() => { broadcastSuccess.value = false }, 4000)
  } catch (e) {
    console.error('[Broadcast] Erro ao enviar:', e)
  } finally {
    sendingBroadcast.value = false
  }
}

function openTenantModal(t?: Tenant) {
  editingTenant.value = t ?? null
  tenantForm.value = {
    tenant_prefix: t?.tenant_prefix ?? '',
    name: t?.name ?? '',
    primary_color: t?.primary_color ?? '#D4AF37',
    plan: t?.plan ?? 'basic',
    support_phone: t?.support_phone ?? '',
    addons: {
      chat: t?.addons?.chat ?? true,
      ocr: t?.addons?.ocr ?? false,
      ai: t?.addons?.ai ?? false,
      reports: t?.addons?.reports ?? true,
      ai_insights: t?.addons?.ai_insights ?? false,
      ai_ocr: t?.addons?.ai_ocr ?? false,
      ai_financial: t?.addons?.ai_financial ?? false,
      ai_templates: t?.addons?.ai_templates ?? false,
      ai_fraud: t?.addons?.ai_fraud ?? false,
      whatsapp_bot: t?.addons?.whatsapp_bot ?? false,
      custom_domain: t?.addons?.custom_domain ?? false,
      digital_signature: t?.addons?.digital_signature ?? false
    }
  }
  tenantModalError.value = ''
  showTenantModal.value = true
}

async function saveTenant() {
  if (!tenantForm.value.tenant_prefix.trim()) { tenantModalError.value = 'Prefixo é obrigatório.'; return }
  savingTenant.value = true; tenantModalError.value = ''
  try {
    if (editingTenant.value) {
      await updateTenantConfig(editingTenant.value.tenant_prefix, {
        name: tenantForm.value.name,
        primary_color: tenantForm.value.primary_color,
        plan: tenantForm.value.plan,
        support_phone: tenantForm.value.support_phone,
        addons: tenantForm.value.addons,
      })
    } else {
      await createTenant(tenantForm.value)
    }
    showTenantModal.value = false
    await loadTenants()
  } catch (e: any) { tenantModalError.value = e.message }
  finally { savingTenant.value = false }
}

async function toggleTenantStatus(t: Tenant) {
  if (!t.id) return
  const newStatus = t.tenant_enabled === false
  try {
    await updateTenantApiStatus(t.id, newStatus)
    await loadTenants()
  } catch (e: any) { tenantError.value = e.message }
}

// ─── Masters ─────────────────────────────────────────────────────────────────
const mastersData = ref<User[]>([])
const loadingMasters = ref(false)
const mastersSearch = ref('')

const filteredMasters = computed(() => {
  const q = mastersSearch.value.toLowerCase()
  return q
    ? mastersData.value.filter(u => (u.person?.name ?? u.username ?? '').toLowerCase().includes(q))
    : mastersData.value
})

async function loadMasters() {
  loadingMasters.value = true
  try {
    const res = await getAllOperators({
      columns: { id: true, username: true, person: { name: true, email: true }, profile: { name: true, is_manager_profile: true } },
      filters: {},
      offset: 0,
    })
    mastersData.value = Array.isArray(res) ? res : (res as any).data ?? []
  } catch {}
  finally { loadingMasters.value = false }
}

// ─── Logs Firebase ───────────────────────────────────────────────────────────
const logsData = ref<ApiLogEntry[]>([])
const loadingLogs = ref(false)
const logsError = ref('')
const logSearch = ref('')
const logTenantFilter = ref('')
const logStatusFilter = ref('')
const logDays = ref(1)

const filteredLogs = computed(() => {
  return logsData.value.filter(l => {
    const q = logSearch.value.toLowerCase()
    const matchQ = !q || l.route.toLowerCase().includes(q) || (l.tenant || '').toLowerCase().includes(q)
    const matchStatus = !logStatusFilter.value
      || (logStatusFilter.value === 'success' && l.success)
      || (logStatusFilter.value === 'error' && !l.success)
    const matchTenant = !logTenantFilter.value || l.tenant === logTenantFilter.value
    return matchQ && matchStatus && matchTenant
  })
})

async function loadLogs() {
  loadingLogs.value = true; logsError.value = ''
  try {
    let res: any[] = []
    const selectedTenant = logTenantFilter.value
    if (selectedTenant && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const domain = `${selectedTenant}.korvyan.com`
      const info = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
      let token = ''
      if (info) {
        try {
          const parsed = JSON.parse(info)
          token = parsed.access || parsed.access_token || ''
        } catch {}
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const response = await axios.post(`https://${domain}/v1/logs/access/list/`, {
        offset: 0,
        columns: {
          id: true,
          endpoint: true,
          success: true,
          request_duration: true,
          request_started_at: true,
          user_name: true,
          user_ip: true
        },
        filters: {}
      }, { headers, withCredentials: true })
      const raw = response.data
      res = raw?.data ?? raw
    } else {
      res = await getAccessLogs(0)
    }

    logsData.value = (Array.isArray(res) ? res : []).map((l: any) => {
      let route = l.endpoint || ''
      let method = 'API'
      if (route.includes(' ')) {
        const parts = route.split(' ')
        method = parts[0]
        route = parts[1]
      }
      return {
        timestamp: l.request_started_at || l.created_at || new Date().toISOString(),
        route: route,
        method: method,
        status: l.success ? 200 : 500,
        success: l.success,
        duration_ms: l.request_duration ? Math.round(l.request_duration) : 0,
        tenant: l.user_name || l.user_ip || '—'
      }
    })
  } catch (e: any) { 
    logsError.value = e.message || 'Erro ao carregar logs da API' 
  }
  finally { loadingLogs.value = false }
}

function formatLogTime(ts?: string) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }) }
  catch { return ts }
}

// ─── Scopes ──────────────────────────────────────────────────────────────────
const scopesData = ref<Scope[]>([])
const loadingScopes = ref(false)
const scopeSearch = ref('')
const showScopeModal = ref(false)
const editingScope = ref<Scope | null>(null)
const savingScope = ref(false)
const scopeModalError = ref('')
const scopeForm = ref({ code: '', description: '' })

const filteredScopes = computed(() => {
  const q = scopeSearch.value.toLowerCase()
  return q
    ? scopesData.value.filter(s => s.code.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q))
    : scopesData.value
})

async function loadScopes() {
  loadingScopes.value = true
  try {
    scopesData.value = await getAllScopes(undefined, (enriched) => { scopesData.value = enriched })
  } catch {}
  finally { loadingScopes.value = false }
}

function openScopeModal(s?: Scope) {
  editingScope.value = s ?? null
  scopeForm.value = { code: s?.code ?? '', description: s?.description ?? '' }
  scopeModalError.value = ''
  showScopeModal.value = true
}

async function saveScope() {
  if (!scopeForm.value.code.trim()) { scopeModalError.value = 'O código é obrigatório.'; return }
  savingScope.value = true; scopeModalError.value = ''
  try {
    if (editingScope.value) {
      await apiPatch(`/v1/scope/${editingScope.value.id}`, { description: scopeForm.value.description })
    } else {
      await apiPost('/v1/scope/', [{ code: scopeForm.value.code, description: scopeForm.value.description }])
    }
    showScopeModal.value = false
    await loadScopes()
  } catch (e: any) { scopeModalError.value = e.message }
  finally { savingScope.value = false }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}
function formatDate(d?: any) {
  if (!d) return '—'
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
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

function handleGlobalEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showTicketDetailsModal.value) {
      showTicketDetailsModal.value = false
    } else if (showTenantModal.value) {
      showTenantModal.value = false
    } else if (showScopeModal.value) {
      showScopeModal.value = false
    } else if (showFaqModal.value) {
      showFaqModal.value = false
    }
  }
}

function setTab(tab: string) {
  activeTab.value = tab
  mobileSidebarOpen.value = false
  if (tab === 'tenants' && !tenantsData.value.length) loadTenants()
  if (tab === 'masters' && !mastersData.value.length) loadMasters()
  if (tab === 'logs' && !logsData.value.length) loadLogs()
  if (tab === 'scopes' && !scopesData.value.length) loadScopes()
  if (tab === 'chamados') loadTickets()
  if (tab === 'faq' || tab === 'conhecimento') loadFaqArticles()
  if (tab === 'notificacoes' && !tenantsData.value.length) loadTenants()
  if (tab === 'modulos' && !tenantsData.value.length) loadTenants()
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('keydown', handleGlobalEsc)
  await Promise.all([loadDashboard(), loadTenants()])
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('keydown', handleGlobalEsc)
})
</script>

<style>
/* ══════════════════════════════════════════════════════════════
   GLOBAL BACKOFFICE THEME & TELEPORTED MODALS
   ══════════════════════════════════════════════════════════════ */
:root {
  --bg-bo: #0f172a;
  --bg-bo-card: #1e293b;
  --border-bo: #334155;
  --text-bo: #f8fafc;
  --text-bo-muted: #94a3b8;
  --master-brand: #8b5cf6;
  --master-hover: #7c3aed;
  --gold: #D4AF37;
}

[data-theme="light"] {
  --bg-bo: #f1f5f9;
  --bg-bo-card: #ffffff;
  --border-bo: #cbd5e1;
  --text-bo: #0f172a;
  --text-bo-muted: #64748b;
  --master-brand: #7c3aed;
  --master-hover: #6d28d9;
  --gold: #B8860B;
}

/* Teleported modal overlay */
body > .modal-overlay,
.modal-overlay {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(0, 0, 0, 0.75) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 10000 !important;
  backdrop-filter: blur(4px) !important;
  padding: 1rem !important;
  box-sizing: border-box !important;
}

/* Modal Card Backoffice */
.modal-card-bo,
.modal-overlay .modal-card-bo,
.modal-overlay .modal-card {
  background: var(--bg-bo-card, #1e293b) !important;
  border: 1px solid var(--border-bo, #334155) !important;
  border-radius: 14px !important;
  width: 100% !important;
  max-width: 560px;
  max-height: 90vh !important;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5) !important;
  overflow-y: auto !important;
  color: var(--text-bo, #f8fafc) !important;
  animation: modal-appear 0.2s ease-out !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
}

@keyframes modal-appear {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.modal-card-bo .modal-header,
.modal-overlay .modal-card .modal-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 1.25rem 1.5rem !important;
  border-bottom: 1px solid var(--border-bo, #334155) !important;
  background: transparent !important;
  margin-bottom: 0 !important;
}

.modal-card-bo .modal-header h3,
.modal-overlay .modal-card .modal-header h3 {
  font-size: 1.15rem !important;
  font-weight: 700 !important;
  color: var(--text-bo, #f8fafc) !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.modal-card-bo .modal-body-bo,
.modal-overlay .modal-card .modal-body-bo {
  padding: 1.5rem !important;
  flex: 1 !important;
  overflow-y: auto !important;
}

.modal-card-bo .modal-footer-bo,
.modal-overlay .modal-card .modal-footer,
.modal-overlay .modal-card .modal-footer-bo {
  padding: 1rem 1.5rem !important;
  border-top: 1px solid var(--border-bo, #334155) !important;
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 12px !important;
  background: rgba(15, 23, 42, 0.2) !important;
}

/* Modal Form elements */
.modal-card-bo .form-grid-bo {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 1rem !important;
}

.modal-card-bo .form-group {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
}

.modal-card-bo .form-group.full {
  grid-column: span 2 !important;
}

.modal-card-bo .form-group label {
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  color: var(--text-bo-muted, #94a3b8) !important;
  letter-spacing: 0.5px !important;
  text-transform: uppercase !important;
}

.modal-card-bo .form-input,
.modal-card-bo select.form-input,
.modal-card-bo textarea.form-input,
.modal-overlay .modal-card .form-input,
.modal-overlay .modal-card select,
.modal-overlay .modal-card textarea {
  background: rgba(15, 23, 42, 0.7) !important;
  border: 1px solid var(--border-bo, #334155) !important;
  color: var(--text-bo, #f8fafc) !important;
  border-radius: 8px !important;
  padding: 9px 12px !important;
  font-size: 0.88rem !important;
  outline: none !important;
  transition: all 0.2s ease !important;
  width: 100% !important;
  box-sizing: border-box !important;
  font-family: inherit !important;
}

.modal-card-bo .form-input:focus,
.modal-card-bo select.form-input:focus,
.modal-card-bo textarea.form-input:focus,
.modal-overlay .modal-card .form-input:focus {
  border-color: var(--master-brand, #8b5cf6) !important;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25) !important;
}

.modal-card-bo .form-input:disabled {
  opacity: 0.55 !important;
  cursor: not-allowed !important;
  background: rgba(15, 23, 42, 0.4) !important;
}

.modal-card-bo select.form-input option,
.modal-overlay .modal-card select option {
  background: #1e293b !important;
  color: #f8fafc !important;
}

/* Modal Buttons */
.modal-overlay .btn {
  font-family: inherit !important;
  font-weight: 600 !important;
  font-size: 0.88rem !important;
  border-radius: 8px !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  transition: all 0.2s ease !important;
  padding: 9px 18px !important;
  height: 38px !important;
  white-space: nowrap !important;
}

.modal-overlay .btn-outline {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid var(--border-bo, #334155) !important;
  color: var(--text-bo, #f8fafc) !important;
}

.modal-overlay .btn-outline:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.09) !important;
  border-color: var(--text-bo-muted, #94a3b8) !important;
  color: #ffffff !important;
}

.modal-overlay .btn-master {
  background: var(--master-brand, #8b5cf6) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3) !important;
}

.modal-overlay .btn-master:hover:not(:disabled) {
  background: var(--master-hover, #7c3aed) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.45) !important;
}

.modal-overlay .btn-master:disabled {
  opacity: 0.55 !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

.modal-overlay .btn-gold {
  background: var(--gold, #D4AF37) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  color: #0f172a !important;
  font-weight: 700 !important;
}

.modal-overlay .btn-gold:hover:not(:disabled) {
  filter: brightness(1.1) !important;
  transform: translateY(-1px) !important;
}

.modal-overlay .close-btn,
.modal-overlay .icon-btn,
.modal-overlay .btn-ghost {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid var(--border-bo, #334155) !important;
  border-radius: 8px !important;
  width: 34px !important;
  height: 34px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: var(--text-bo-muted, #94a3b8) !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.modal-overlay .close-btn:hover,
.modal-overlay .icon-btn:hover,
.modal-overlay .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: var(--text-bo, #f8fafc) !important;
  color: var(--text-bo, #f8fafc) !important;
}

.modal-overlay .error-bar {
  background: rgba(239, 68, 68, 0.12) !important;
  border: 1px solid rgba(239, 68, 68, 0.35) !important;
  color: #fca5a5 !important;
  padding: 10px 14px !important;
  border-radius: 8px !important;
  font-size: 0.85rem !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

@media (max-width: 640px) {
  .modal-card-bo,
  .modal-overlay .modal-card-bo,
  .modal-overlay .modal-card {
    width: calc(100vw - 2rem) !important;
    max-width: calc(100vw - 2rem) !important;
    margin: 1rem !important;
  }
  .modal-card-bo .form-grid-bo {
    grid-template-columns: 1fr !important;
  }
  .modal-card-bo .form-group.full {
    grid-column: span 1 !important;
  }
}
</style>

<style scoped>
.backoffice-layout {
  min-height: 100vh;
  background: var(--bg-bo, #0f172a);
  color: var(--text-bo, #f8fafc);
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

/* Header */
.bo-header {
  height: 60px;
  background: var(--bg-bo-card, #1e293b);
  border-bottom: 1px solid var(--border-bo, #334155);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.bo-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-toggle-btn {
  display: none;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 8px;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  color: var(--text-bo, #f8fafc);
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.mobile-toggle-btn:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: var(--master-brand, #8b5cf6);
  color: var(--master-brand, #8b5cf6);
}

.bo-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  font-size: 1.1rem;
}

.brand-logo {
  width: 32px;
  height: 32px;
  background: var(--master-brand, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
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

.bo-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* User avatar & dropdown */
.user-menu-container {
  position: relative;
}

.user-avatar-bo {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.user-avatar-bo:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.5);
}

.bo-user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 260px;
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  z-index: 1050;
  padding: 8px;
  transform-origin: top right;
}

.bo-dropdown-header {
  padding: 8px 10px;
}

.user-dropdown-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar-bo.mini-avatar {
  width: 34px;
  height: 34px;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.user-text-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.user-name-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-bo, #f8fafc);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-root {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

.bo-dropdown-divider {
  height: 1px;
  background: var(--border-bo, #334155);
  margin: 6px 0;
  opacity: 0.8;
}

.bo-dropdown-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bo-dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-bo, #f8fafc);
  font-size: 0.84rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;
  box-sizing: border-box;
}

.bo-dropdown-item i {
  font-size: 0.95rem;
  width: 18px;
  text-align: center;
  color: var(--master-brand, #8b5cf6);
}

.bo-dropdown-item:hover {
  background: rgba(139, 92, 246, 0.12);
  color: var(--text-bo, #fff);
}

.bo-dropdown-item.logout-item {
  color: #ef4444;
}

.bo-dropdown-item.logout-item i {
  color: #ef4444;
}

.bo-dropdown-item.logout-item:hover {
  background: rgba(239, 68, 68, 0.12);
}

.dropdown-scale-enter-active,
.dropdown-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-scale-enter-from,
.dropdown-scale-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(-6px);
}

/* Sidebar & Navigation */
.bo-main {
  flex: 1;
  display: flex;
}

.bo-sidebar {
  width: 250px;
  background: var(--bg-bo-card, #1e293b);
  border-right: 1px solid var(--border-bo, #334155);
  padding: 1.5rem 1rem;
}

.bo-sidebar-mobile-header {
  display: none !important;
}

.bo-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bo-nav-item {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-bo-muted, #94a3b8);
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  transition: all 0.2s;
}

.bo-nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-bo, #f8fafc);
}

.bo-nav-item.active {
  background: rgba(139, 92, 246, 0.15);
  color: var(--master-brand, #8b5cf6);
}

.bo-nav-item i {
  width: 20px;
  text-align: center;
}

.nav-section-title {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-bo-muted, #94a3b8);
  padding-left: 1rem;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.mt-4 { margin-top: 1.5rem; }
.mb-4 { margin-bottom: 2rem; }

.bo-content {
  flex: 1;
  padding: 2.5rem;
  overflow-y: auto;
  background: var(--bg-bo, #0f172a);
}

/* Page Header */
.bo-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.bo-page-header-left {
  display: flex;
  flex-direction: column;
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

/* ── KPI Cards Grid (Design System Faturamento) ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
  min-width: 0;
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

.amber-bg {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.kpi-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.kpi-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-bo-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text-bo, #f8fafc);
  line-height: 1.25;
  word-break: break-word;
}

.valor-gold {
  color: var(--gold, #D4AF37) !important;
}

.kpi-sub {
  font-size: 0.72rem;
  color: var(--text-bo-muted, #94a3b8);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Big MRR Banner fallback */
.mrr-banner-card {
  background: linear-gradient(135deg, var(--master-brand, #8b5cf6), var(--master-hover, #7c3aed));
  border-radius: 12px;
  padding: 1.75rem 2rem;
  color: white;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
  min-width: 0;
  overflow: hidden;
}

.mrr-banner-card h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  opacity: 0.95;
}

.mrr-amount {
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1.15;
  word-break: break-word;
}

.mrr-icon {
  font-size: 3.5rem;
  opacity: 0.25;
  flex-shrink: 0;
}

.dash-tables-row {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.dash-table-col {
  flex: 1;
  min-width: 320px;
}

/* ── Generic Buttons ── */
.btn {
  font-family: inherit;
  transition: all 0.2s ease;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  font-size: 0.88rem;
  padding: 8px 16px;
  box-sizing: border-box;
}

.btn-master {
  background: var(--master-brand, #8b5cf6);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  padding: 9px 18px;
}

.btn-master:hover:not(:disabled) {
  background: var(--master-hover, #7c3aed);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
}

.btn-master:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-bo, #334155);
  color: var(--text-bo, #f8fafc);
  padding: 8px 14px;
}

.btn-outline:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--text-bo-muted, #94a3b8);
  color: #fff;
}

.btn-outline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-gold {
  background: var(--gold, #D4AF37);
  color: #0f172a;
  font-weight: 700;
  border: none;
  padding: 8px 16px;
}

.btn-gold:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.78rem;
}

.btn-xs {
  padding: 3px 8px;
  font-size: 0.75rem;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-bo-muted, #94a3b8);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.icon-btn:hover {
  background: rgba(139, 92, 246, 0.15);
  color: var(--text-bo, #f8fafc);
  border-color: var(--master-brand, #8b5cf6);
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

/* ── Tables & Containers ── */
.table-container {
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.table-header-bar {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-bo, #334155);
}

.table-header-bar h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-bo, #f8fafc);
  margin: 0;
}

.table-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--border-bo, #334155);
  background: rgba(15, 23, 42, 0.4);
}

.table-search-bar i {
  color: var(--text-bo-muted, #94a3b8);
}

.table-search-bar input {
  background: none;
  border: none;
  outline: none;
  color: var(--text-bo, #f8fafc);
  font-size: 0.88rem;
  width: 100%;
}

.table-search-bar input::placeholder {
  color: var(--text-bo-muted, #94a3b8);
}

.table-footer-bar {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--border-bo, #334155);
  font-size: 0.78rem;
  color: var(--text-bo-muted, #94a3b8);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.5);
  color: var(--text-bo-muted, #94a3b8);
  font-size: 0.72rem;
  font-weight: 700;
  border-bottom: 1px solid var(--border-bo, #334155);
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 14px 16px;
  color: var(--text-bo, #f8fafc);
  font-size: 0.88rem;
  border-bottom: 1px solid var(--border-bo, #334155);
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.data-table tr.row-error td {
  background: rgba(239, 68, 68, 0.06);
}

.tenant-logo-mini {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  flex-shrink: 0;
}

.empty-cell {
  text-align: center !important;
  vertical-align: middle !important;
  padding: 3rem !important;
  color: var(--text-bo-muted, #94a3b8);
  display: table-cell !important;
}

.empty-cell i {
  font-size: 2rem;
  margin: 0 auto 0.75rem auto;
  display: block;
  opacity: 0.4;
  text-align: center;
}

.empty-cell p {
  font-size: 0.88rem;
  margin: 0;
  text-align: center;
}

/* ── Badges ── */
.prefix-code {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid var(--border-bo, #334155);
  padding: 2px 7px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-bo-muted, #94a3b8);
}

.tenant-badge {
  font-family: monospace;
  font-size: 0.82rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--master-brand, #8b5cf6);
  display: inline-block;
}

.plan-badge {
  background: rgba(212, 175, 55, 0.12);
  color: var(--gold, #D4AF37);
  border: 1px solid rgba(212, 175, 55, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: capitalize;
}

.badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}

.badge.success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge.danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.master-badge {
  background: rgba(139, 92, 246, 0.15);
  color: var(--master-brand, #8b5cf6);
  border: 1px solid rgba(139, 92, 246, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.method-badge {
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: monospace;
}

.method-badge.get { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.method-badge.post { background: rgba(59, 130, 246, 0.12); color: #60a5fa; }
.method-badge.patch { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.method-badge.put { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.method-badge.delete { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

/* ── Inputs & Selects ── */
.form-input {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid var(--border-bo, #334155);
  color: var(--text-bo, #f8fafc);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 0.88rem;
  outline: none;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--master-brand, #8b5cf6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-select {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid var(--border-bo, #334155);
  color: var(--text-bo, #f8fafc);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--master-brand, #8b5cf6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.log-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1rem;
}

/* ── Feedback & Alerts ── */
.error-bar {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-bar {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #86efac;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.api-fallback-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.85rem;
  color: var(--text-bo, #f8fafc);
  margin-bottom: 1.5rem;
}

.api-fallback-banner i {
  color: #f59e0b;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.btn-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--gold, #D4AF37);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  transition: opacity 0.2s;
}

.btn-link:hover { opacity: 0.8; }

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 3rem;
  color: var(--text-bo-muted, #94a3b8);
  font-size: 0.9rem;
}

/* ── Cards & Sections ── */
.card {
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-section {
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 12px;
  padding: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-bo, #f8fafc);
  margin: 0;
}

textarea.form-input {
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
}

/* ── Addons & Módulos ── */
.addons-controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.addons-filter-tabs {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border-bo, #334155);
}

.filter-tab {
  background: transparent;
  border: none;
  color: var(--text-bo-muted, #94a3b8);
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-bo, #f8fafc);
}

.filter-tab.active {
  background: rgba(139, 92, 246, 0.15);
  color: var(--master-brand, #8b5cf6);
}

.btn-config-ia {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-bo, #334155);
  color: var(--text-bo, #f8fafc);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-config-ia:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--text-bo-muted, #94a3b8);
}

.ai-config-panel {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.chip-empty {
  font-size: 0.75rem;
  color: var(--text-bo-muted, #94a3b8);
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed var(--border-bo, #334155);
  padding: 4px 10px;
  border-radius: 20px;
}

.addons-full-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.addon-full-card {
  background: var(--bg-bo-card, #1e293b);
  border: 1px solid var(--border-bo, #334155);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.addon-full-card:hover {
  border-color: var(--master-brand, #8b5cf6);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
}

.addon-full-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.addon-full-header i {
  font-size: 1.8rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 8px;
}

.addon-full-info h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-bo, #f8fafc);
}

.addon-full-info span {
  font-size: 0.85rem;
  color: var(--text-bo-muted, #94a3b8);
}

.addon-active-count {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-bo-muted, #94a3b8);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px 8px;
  border-radius: 20px;
  border: 1px solid var(--border-bo, #334155);
}

.tenant-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 0.5rem;
}

.tenant-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-bo-muted, #94a3b8);
  border: 1px solid var(--border-bo, #334155);
  cursor: pointer;
  transition: all 0.2s;
}

.tenant-chip:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tenant-chip.active {
  background: rgba(139, 92, 246, 0.15);
  color: var(--master-brand, #8b5cf6);
  border-color: rgba(139, 92, 246, 0.35);
}

.chip-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  color: white;
  font-weight: bold;
}

.add-tenant-select {
  background: transparent;
  border: 1px dashed var(--border-bo, #334155);
  color: var(--text-bo-muted, #94a3b8);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
  appearance: none;
}

.add-tenant-select:hover,
.add-tenant-select:focus {
  border-color: var(--master-brand, #8b5cf6);
  color: var(--master-brand, #8b5cf6);
}

.tenant-chip.active i.fa-times {
  opacity: 0.5;
}

.tenant-chip.active:hover i.fa-times {
  opacity: 1;
  color: #ef4444;
}

/* ── Transitions ── */
.fade-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Responsive Media Queries ── */
@media (max-width: 1024px) {
  .bo-header {
    padding: 0 1.25rem;
  }
  .mobile-toggle-btn {
    display: flex;
  }
  .bo-sidebar-mobile-header {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  .bo-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-width: 85vw;
    background: var(--bg-bo-card, #1e293b);
    border-right: 1px solid var(--border-bo, #334155);
    padding: 1.25rem 1rem;
    z-index: 1040;
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.28s ease;
    box-shadow: none;
  }
  .bo-sidebar.open {
    transform: translateX(0);
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.6);
  }
  .bo-main {
    flex-direction: column;
    width: 100%;
  }
  .bo-content {
    padding: 1.5rem;
    width: 100%;
    box-sizing: border-box;
  }
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dash-tables-row {
    gap: 1.25rem;
  }
  .dash-table-col {
    min-width: 100%;
  }
}

@media (max-width: 768px) {
  .bo-header {
    padding: 0 1rem;
    height: 56px;
  }
  .bo-brand span {
    font-size: 1rem;
  }
  .bo-content {
    padding: 1rem;
  }
  .bo-page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .bo-page-header h1 {
    font-size: 1.35rem;
  }
  .mrr-banner-card {
    padding: 1.25rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .mrr-amount {
    font-size: 2rem;
  }
  .mrr-icon {
    display: none;
  }

  .table-container {
    border-radius: 10px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }
  .data-table {
    min-width: 580px;
  }
  .data-table th,
  .data-table td {
    padding: 10px 12px;
    font-size: 0.82rem;
  }
  .prefix-code {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .broadcast-form-grid {
    grid-template-columns: 1fr !important;
    gap: 0.85rem !important;
  }
  .ai-provider-grid {
    grid-template-columns: 1fr !important;
  }

  .addons-controls-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .addons-controls-bar .table-search-bar {
    max-width: 100% !important;
  }
  .addons-filter-tabs {
    width: 100%;
    justify-content: center;
  }
  .filter-tab {
    flex: 1;
    text-align: center;
  }
  .addons-full-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .addon-full-card {
    padding: 1.15rem;
  }

  .log-filters {
    flex-direction: column;
    align-items: stretch;
  }
  .log-filters .table-search-bar {
    width: 100%;
  }
  .log-filters .filter-select {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .header-actions {
    width: 100%;
  }
  .header-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
