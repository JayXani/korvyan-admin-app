<template>
  <div class="obs-container">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="section-title">
          <i class="fas fa-chart-line" style="color:var(--gold)"></i>
          Observabilidade
        </h2>
        <p class="section-sub">Monitoramento de API em tempo real — requests, latência, erros e uso por tenant.</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedDays" class="filter-select" @change="loadStats">
          <option :value="1">Últimas 24h</option>
          <option :value="3">Últimos 3 dias</option>
          <option :value="7">Últimos 7 dias</option>
        </select>
        <button class="btn btn-outline" @click="loadStats" :disabled="loading">
          <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-rotate-right'"></i>
          Atualizar
        </button>
      </div>
    </div>

    <!-- Error -->
    <!-- Loading skeleton -->
    <div v-if="loading && !stats" class="loading-grid">
      <div v-for="i in 4" :key="i" class="stat-skeleton"></div>
    </div>

    <template v-else-if="stats">
      <!-- ── Stat Cards ──────────────────────────────────────────── -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-arrow-right-arrow-left"></i></div>
          <div class="stat-info">
            <span class="stat-label">Total Requests</span>
            <span class="stat-value">{{ stats.total.toLocaleString('pt-BR') }}</span>
            <span class="stat-sub">{{ selectedDays === 1 ? 'últimas 24h' : `últimos ${selectedDays} dias` }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" :class="stats.error_rate > 10 ? 'red' : stats.error_rate > 5 ? 'yellow' : 'green'">
            <i class="fas fa-triangle-exclamation"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Taxa de Erro</span>
            <span class="stat-value" :style="{ color: stats.error_rate > 10 ? 'var(--danger)' : stats.error_rate > 5 ? '#f59e0b' : '#22c55e' }">
              {{ stats.error_rate }}%
            </span>
            <span class="stat-sub">{{ stats.errors }} erros / {{ stats.total }} requests</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i class="fas fa-clock"></i></div>
          <div class="stat-info">
            <span class="stat-label">Latência Média</span>
            <span class="stat-value">{{ stats.avg_duration_ms }}ms</span>
            <span class="stat-sub">p95: {{ stats.p95_duration_ms }}ms</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gold"><i class="fas fa-building"></i></div>
          <div class="stat-info">
            <span class="stat-label">Tenants Ativos</span>
            <span class="stat-value">{{ stats.active_tenants.length }}</span>
            <span class="stat-sub">{{ stats.active_tenants.slice(0, 3).join(', ') }}</span>
          </div>
        </div>
      </div>

      <!-- ── Gráfico: Requests por hora ─────────────────────────── -->
      <div class="charts-row">
        <div class="chart-card wide">
          <div class="chart-header">
            <h3>Requests por Hora</h3>
            <div class="legend">
              <span class="legend-item success">✦ Sucesso</span>
              <span class="legend-item error">✦ Erros</span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas ref="hourlyChart"></canvas>
          </div>
        </div>

        <!-- Doughnut: Por Tenant -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Por Tenant</h3>
          </div>
          <div class="chart-wrapper doughnut-wrapper">
            <canvas ref="tenantChart"></canvas>
          </div>
          <div class="chart-legend-list">
            <div v-for="t in stats.by_tenant.slice(0, 6)" :key="t.tenant" class="legend-row">
              <span class="legend-dot" :style="{ background: tenantColors[stats.by_tenant.indexOf(t) % tenantColors.length] }"></span>
              <span class="legend-name">{{ t.tenant }}</span>
              <span class="legend-count">{{ t.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Segunda linha de gráficos ─────────────────────────── -->
      <div class="charts-row">
        <!-- Bar: Top Rotas -->
        <div class="chart-card wide">
          <div class="chart-header">
            <h3>Top 10 Rotas</h3>
            <span class="chart-badge">{{ stats.top_routes.length }} rotas únicas</span>
          </div>
          <div class="chart-wrapper">
            <canvas ref="routesChart"></canvas>
          </div>
        </div>

        <!-- Bar: Status Codes -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Status Codes</h3>
          </div>
          <div class="chart-wrapper">
            <canvas ref="statusChart"></canvas>
          </div>
          <div class="status-legend">
            <div v-for="s in stats.by_status" :key="s.status" class="status-row">
              <span class="status-badge" :class="statusClass(s.status)">{{ s.status }}</span>
              <div class="status-bar-wrap">
                <div class="status-bar" :style="{ width: barPct(s.count, stats.total) + '%', background: statusColor(s.status) }"></div>
              </div>
              <span class="status-count">{{ s.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tabela Live de Requests ─────────────────────────────── -->
      <div class="card live-table-card">
        <div class="chart-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light);">
          <h3>Últimas Chamadas</h3>
          <div style="display:flex;gap:10px;align-items:center">
            <div class="search-bar" style="min-width:200px">
              <i class="fas fa-magnifying-glass"></i>
              <input v-model="logSearch" type="text" placeholder="Filtrar rota..." />
            </div>
            <select v-model="logFilter" class="filter-select">
              <option value="">Todos</option>
              <option value="success">Sucesso</option>
              <option value="error">Erro</option>
            </select>
          </div>
        </div>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>ROTA</th>
                <th>MÉTODO</th>
                <th>STATUS</th>
                <th>LATÊNCIA</th>
                <th>TENANT</th>
                <th>RESULTADO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredLogs.length === 0">
                <td colspan="7">
                  <div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum log registrado ainda. Use a aplicação para gerar dados.</p></div>
                </td>
              </tr>
              <tr v-for="log in filteredLogs" :key="String(log.timestamp)" :class="{ 'row-error': !log.success }">
                <td class="text-muted mono">{{ formatTs(log.timestamp) }}</td>
                <td class="mono route-cell" :title="log.route">{{ log.route }}</td>
                <td><span :class="['method-badge', log.method.toLowerCase()]">{{ log.method }}</span></td>
                <td><span :class="['status-pill', statusClass(log.status)]">{{ log.status }}</span></td>
                <td>
                  <span :class="['latency', latencyClass(log.duration_ms)]">{{ log.duration_ms }}ms</span>
                </td>
                <td class="text-muted">{{ log.tenant }}</td>
                <td>
                  <span :class="['result-badge', log.success ? 'ok' : 'fail']">
                    <i :class="log.success ? 'fas fa-check' : 'fas fa-xmark'"></i>
                    {{ log.success ? 'OK' : 'ERRO' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Empty state quando não há dados -->
    <div v-else-if="!loading" class="empty-obs">
      <div class="empty-obs-icon"><i class="fas fa-chart-line"></i></div>
      <h3>Nenhum dado de observabilidade ainda</h3>
      <p>Os logs aparecem automaticamente conforme a aplicação é usada.<br>
         Certifique-se de que as credenciais do Firebase estão configuradas no <code>.env</code>.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
const { success: toastSuccess, error: toastError } = useToast()
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { getStats, type ApiStats, type ApiLogEntry } from '@/services/analytics.service'

Chart.register(...registerables)

// ─── Estado ───────────────────────────────────────────────────────────────────
const stats = ref<ApiStats | null>(null)
const loading = ref(false)
const apiError = ref('')
const selectedDays = ref(1)
const logSearch = ref('')
const logFilter = ref('')

// Refs dos canvas
const hourlyChart = ref<HTMLCanvasElement | null>(null)
const tenantChart = ref<HTMLCanvasElement | null>(null)
const routesChart = ref<HTMLCanvasElement | null>(null)
const statusChart = ref<HTMLCanvasElement | null>(null)

// Instâncias de Chart para destruir ao recriar
let charts: Chart[] = []

// Auto-refresh a cada 30 segundos
let refreshInterval: ReturnType<typeof setInterval> | null = null

// Cores
const tenantColors = [
  '#D4AF37', '#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fb923c',
  '#22d3ee', '#f87171', '#4ade80', '#facc15',
]

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredLogs = computed<ApiLogEntry[]>(() => {
  if (!stats.value) return []
  return stats.value.recent.filter(l => {
    const matchSearch = !logSearch.value || l.route.includes(logSearch.value)
    const matchFilter = !logFilter.value
      || (logFilter.value === 'success' && l.success)
      || (logFilter.value === 'error' && !l.success)
    return matchSearch && matchFilter
  })
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTs(ts: any): string {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('pt-BR', { hour12: false })
  } catch { return String(ts) }
}
function statusClass(status: number): string {
  if (status >= 500) return 'status-5xx'
  if (status >= 400) return 'status-4xx'
  if (status >= 300) return 'status-3xx'
  return 'status-2xx'
}
function statusColor(status: number): string {
  if (status >= 500) return '#ef4444'
  if (status >= 400) return '#f59e0b'
  return '#22c55e'
}
function latencyClass(ms: number): string {
  if (ms > 1000) return 'lat-slow'
  if (ms > 500) return 'lat-medium'
  return 'lat-fast'
}
function barPct(count: number, total: number): number {
  if (!total) return 0
  return Math.round((count / total) * 100)
}

// ─── Carregar dados ───────────────────────────────────────────────────────────
async function loadStats() {
  loading.value = true
  apiError.value = ''
  try {
    stats.value = await getStats(selectedDays.value)
    await nextTick()
    renderCharts()
  } catch (err: any) {
    toastError(err.message || 'Erro ao carregar dados de observabilidade.')
  } finally {
    loading.value = false
  }
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function destroyCharts() {
  charts.forEach(c => c.destroy())
  charts = []
}

function renderCharts() {
  destroyCharts()
  if (!stats.value) return

  const s = stats.value
  const GOLD = '#D4AF37'
  const gridColor = 'rgba(255,255,255,0.06)'
  const fontColor = '#9ca3af'
  const tickFont = { family: 'Inter, sans-serif', size: 11 }

  const baseScales = {
    x: { grid: { color: gridColor }, ticks: { color: fontColor, font: tickFont } },
    y: { grid: { color: gridColor }, ticks: { color: fontColor, font: tickFont } },
  }

  // ── Hourly Line Chart ──
  if (hourlyChart.value) {
    const labels = s.by_hour.map(h => h.hour.split('T')[1] + 'h')
    const successData = s.by_hour.map(h => h.count - h.errors)
    const errorData = s.by_hour.map(h => h.errors)

    charts.push(new Chart(hourlyChart.value, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Sucesso',
            data: successData,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            borderWidth: 2,
          },
          {
            label: 'Erros',
            data: errorData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: baseScales,
      },
    }))
  }

  // ── Tenant Doughnut ──
  if (tenantChart.value && s.by_tenant.length > 0) {
    charts.push(new Chart(tenantChart.value, {
      type: 'doughnut',
      data: {
        labels: s.by_tenant.map(t => t.tenant),
        datasets: [{
          data: s.by_tenant.map(t => t.count),
          backgroundColor: tenantColors.slice(0, s.by_tenant.length),
          borderWidth: 2,
          borderColor: 'var(--bg-card)',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} requests` } },
        },
      },
    }))
  }

  // ── Top Routes Horizontal Bar ──
  if (routesChart.value && s.top_routes.length > 0) {
    charts.push(new Chart(routesChart.value, {
      type: 'bar',
      data: {
        labels: s.top_routes.map(r => r.route),
        datasets: [{
          label: 'Requests',
          data: s.top_routes.map(r => r.count),
          backgroundColor: `${GOLD}cc`,
          borderColor: GOLD,
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: fontColor, font: tickFont } },
          y: { grid: { display: false }, ticks: { color: fontColor, font: { ...tickFont, size: 10 } } },
        },
      },
    }))
  }

  // ── Status Codes Bar ──
  if (statusChart.value && s.by_status.length > 0) {
    charts.push(new Chart(statusChart.value, {
      type: 'bar',
      data: {
        labels: s.by_status.map(st => String(st.status)),
        datasets: [{
          label: 'Requests',
          data: s.by_status.map(st => st.count),
          backgroundColor: s.by_status.map(st => statusColor(st.status) + 'cc'),
          borderColor: s.by_status.map(st => statusColor(st.status)),
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: baseScales,
      },
    }))
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  loadStats()
  refreshInterval = setInterval(loadStats, 30_000)
})

onUnmounted(() => {
  destroyCharts()
  if (refreshInterval) clearInterval(refreshInterval)
})

watch(selectedDays, loadStats)
</script>

<style scoped>
.obs-container { padding: 0.5rem 0; }

.header-actions { display: flex; align-items: center; gap: 10px; }

/* ── Stat Cards ── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

.stat-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem; flex-shrink: 0;
}
.stat-icon.blue { background: rgba(96,165,250,0.15); color: #60a5fa; }
.stat-icon.red { background: rgba(239,68,68,0.15); color: #ef4444; }
.stat-icon.yellow { background: rgba(245,158,11,0.15); color: #f59e0b; }
.stat-icon.green { background: rgba(34,197,94,0.15); color: #22c55e; }
.stat-icon.purple { background: rgba(167,139,250,0.15); color: #a78bfa; }
.stat-icon.gold { background: rgba(212,175,55,0.15); color: var(--gold); }

.stat-info { display: flex; flex-direction: column; }
.stat-label { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value { font-size: 1.6rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; }
.stat-sub { font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px; }

/* ── Charts ── */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.chart-card.wide { /* default */ }

.chart-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-light);
}
.chart-header h3 { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin: 0; }

.legend { display: flex; gap: 12px; }
.legend-item { font-size: 0.72rem; font-weight: 600; }
.legend-item.success { color: #22c55e; }
.legend-item.error { color: #ef4444; }

.chart-badge { background: rgba(212,175,55,0.1); color: var(--gold); border-radius: 20px; padding: 2px 10px; font-size: 0.72rem; font-weight: 600; }

.chart-wrapper { padding: 1rem; height: 220px; position: relative; }
.doughnut-wrapper { height: 180px; }

.chart-legend-list { padding: 0 1.25rem 1rem; display: flex; flex-direction: column; gap: 6px; }
.legend-row { display: flex; align-items: center; gap: 8px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-name { flex: 1; font-size: 0.78rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.legend-count { font-size: 0.78rem; font-weight: 700; color: var(--text-primary); }

/* Status bars */
.status-legend { padding: 0.75rem 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 8px; }
.status-row { display: flex; align-items: center; gap: 8px; }
.status-bar-wrap { flex: 1; height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden; }
.status-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.status-count { font-size: 0.75rem; font-weight: 700; color: var(--text-primary); min-width: 30px; text-align: right; }

/* ── Live Table ── */
.live-table-card { margin-bottom: 1.5rem; }
.table-scroll { overflow-x: auto; max-height: 420px; overflow-y: auto; }

.mono { font-family: 'Courier New', monospace; font-size: 0.8rem; }
.route-cell { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.method-badge {
  display: inline-block; padding: 2px 7px; border-radius: 4px;
  font-size: 0.7rem; font-weight: 700; font-family: monospace;
}
.method-badge.get { background: rgba(34,197,94,0.15); color: #22c55e; }
.method-badge.post { background: rgba(96,165,250,0.15); color: #60a5fa; }
.method-badge.patch { background: rgba(245,158,11,0.15); color: #f59e0b; }
.method-badge.put { background: rgba(167,139,250,0.15); color: #a78bfa; }
.method-badge.delete { background: rgba(239,68,68,0.15); color: #ef4444; }

.status-pill {
  display: inline-block; padding: 2px 7px; border-radius: 4px;
  font-size: 0.72rem; font-weight: 700; font-family: monospace;
}
.status-2xx { background: rgba(34,197,94,0.15); color: #22c55e; }
.status-3xx { background: rgba(96,165,250,0.15); color: #60a5fa; }
.status-4xx { background: rgba(245,158,11,0.15); color: #f59e0b; }
.status-5xx { background: rgba(239,68,68,0.15); color: #ef4444; }

.latency { font-size: 0.78rem; font-weight: 600; font-family: monospace; }
.lat-fast { color: #22c55e; }
.lat-medium { color: #f59e0b; }
.lat-slow { color: #ef4444; }

.result-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;
}
.result-badge.ok { background: rgba(34,197,94,0.15); color: #22c55e; }
.result-badge.fail { background: rgba(239,68,68,0.15); color: #ef4444; }

.row-error { background: rgba(239,68,68,0.03); }

/* ── Empty ── */
.empty-obs {
  text-align: center; padding: 5rem 2rem;
  color: var(--text-muted);
}
.empty-obs-icon { font-size: 3rem; color: var(--gold); opacity: 0.3; margin-bottom: 1rem; }
.empty-obs h3 { color: var(--text-secondary); font-size: 1.1rem; margin: 0 0 0.5rem; }
.empty-obs p { font-size: 0.85rem; line-height: 1.7; margin: 0; }
.empty-obs code { background: var(--bg-input); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; }

/* ── Loading Skeleton ── */
.loading-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.25rem; }
.stat-skeleton {
  height: 90px; border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-input) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

/* ── Responsivo ── */
@media (max-width: 1024px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .stat-grid { grid-template-columns: 1fr; }
}
</style>
