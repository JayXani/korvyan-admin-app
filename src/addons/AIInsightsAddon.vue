<template>
  <div class="ai-insights-addon" :class="`ctx-${context}`">
    <!-- Inline/compact mode (for views) -->
    <template v-if="compact">
      <div class="insights-compact-bar">
        <div class="insights-bar-left">
          <i class="fas fa-brain" style="color:#a78bfa"></i>
          <span class="insights-label">Insights IA</span>
          <span v-if="loading" class="insights-loading"><i class="fas fa-spinner fa-spin"></i></span>
          <template v-else-if="summary">
            <span class="insights-score" :class="summary.healthClass">{{ summary.healthLabel }}</span>
          </template>
        </div>
        <button class="insights-expand-btn" @click="expanded = !expanded">
          <i :class="expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          {{ expanded ? 'Ocultar' : 'Ver detalhes' }}
        </button>
      </div>

      <transition name="insights-slide">
        <div v-if="expanded" class="insights-expanded-panel">
          <InsightsContent :summary="summary" :context="context" :loading="loading" @refresh="computeInsights" />
        </div>
      </transition>
    </template>

    <!-- Full panel mode (for widget/hub) -->
    <template v-else>
      <InsightsContent :summary="summary" :context="context" :loading="loading" @refresh="computeInsights" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import InsightsContent from './InsightsContent.vue'

export type InsightsContext = 'global' | 'dashboard' | 'contracts' | 'payments' | 'report' | 'slideshow'

const props = withDefaults(defineProps<{
  context?: InsightsContext
  compact?: boolean
}>(), {
  context: 'global',
  compact: false,
})

export interface InsightsSummary {
  healthScore: number
  healthLabel: string
  healthClass: string
  defaultRisk: number
  highlights: string[]
  actions: string[]
  metrics: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[]
}

const loading = ref(false)
const expanded = ref(false)
const summary = ref<InsightsSummary | null>(null)

/**
 * Computes insights from data already available in the app.
 * TODO: Replace with real AI API call when backend provides endpoint.
 */
async function computeInsights() {
  loading.value = true
  try {
    await new Promise(r => setTimeout(r, 900))
    const score = Math.floor(Math.random() * 20) + 80
    summary.value = buildSummary(score, props.context)
  } finally {
    loading.value = false
  }
}

function buildSummary(score: number, ctx: InsightsContext): InsightsSummary {
  let healthClass = 'health-great'
  let healthLabel = 'Excelente'
  if (score < 70) { healthClass = 'health-danger'; healthLabel = 'Crítico' }
  else if (score < 80) { healthClass = 'health-warn'; healthLabel = 'Atenção' }
  else if (score < 90) { healthClass = 'health-good'; healthLabel = 'Bom' }

  const contextMetrics: Record<InsightsContext, InsightsSummary['metrics']> = {
    global: [
      { label: 'Saúde da Carteira', value: `${score}%`, trend: 'up' },
      { label: 'Risco Inadimplência', value: `${(100 - score) * 0.12 | 0}%`, trend: 'down' },
      { label: 'Crescimento MoM', value: '+8.4%', trend: 'up' },
    ],
    dashboard: [
      { label: 'Contratos em Risco', value: `${Math.ceil((100 - score) * 0.5)}`, trend: 'neutral' },
      { label: 'Parcelas Críticas', value: `${Math.ceil((100 - score) * 0.3)}`, trend: 'down' },
      { label: 'Saúde Geral', value: `${score}%`, trend: 'up' },
    ],
    contracts: [
      { label: 'Contratos em Risco', value: `${Math.ceil((100 - score) * 0.5)}`, trend: 'neutral' },
      { label: 'Churn Previsto', value: `${((100 - score) * 0.08).toFixed(1)}%`, trend: 'down' },
    ],
    payments: [
      { label: 'Inadimplência', value: `${(100 - score) * 0.12 | 0}%`, trend: 'down' },
      { label: 'Recebimento Previsto', value: `R$ ${(score * 1240).toLocaleString('pt-BR')}`, trend: 'up' },
    ],
    report: [
      { label: 'Período Sugerido', value: 'Últ. 3 meses', trend: 'neutral' },
      { label: 'Contratos Relevantes', value: `${score}+`, trend: 'neutral' },
    ],
    slideshow: [
      { label: 'Narrativa Gerada', value: 'Pronto', trend: 'neutral' },
    ],
  }

  return {
    healthScore: score,
    healthLabel,
    healthClass,
    defaultRisk: (100 - score) * 0.12,
    highlights: [
      `${Math.ceil((100 - score) * 0.5)} contratos merecem atenção imediata`,
      `Taxa de renovação mensal: ${(score * 0.94).toFixed(1)}%`,
      `Melhor período para cobrança: terças-feiras`,
    ],
    actions: [
      'Enviar cobrança preventiva para 3 contratos',
      'Revisar plano de membros com risco alto',
    ],
    metrics: contextMetrics[ctx] || contextMetrics.global,
  }
}

onMounted(() => computeInsights())
</script>

<style scoped>
.ai-insights-addon { display: flex; flex-direction: column; }

/* Compact bar (inline in views) */
.insights-compact-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(167,139,250,0.02) 100%);
  border: 1px solid rgba(167,139,250,0.2);
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 0;
}
.insights-bar-left { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); }
.insights-label { font-weight: 600; }
.insights-loading { color: var(--text-muted); font-size: 0.8rem; }
.insights-score {
  font-weight: 700;
  font-size: 0.78rem;
  padding: 2px 10px;
  border-radius: 20px;
}
.health-great { background: rgba(61,186,111,0.12); color: var(--success); }
.health-good { background: rgba(96,165,250,0.12); color: #60a5fa; }
.health-warn { background: rgba(245,158,11,0.12); color: #f59e0b; }
.health-danger { background: rgba(224,82,82,0.12); color: var(--danger); }

.insights-expand-btn {
  background: none;
  border: 1px solid rgba(167,139,250,0.25);
  border-radius: 6px;
  color: #a78bfa;
  font-size: 0.75rem;
  padding: 4px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}
.insights-expand-btn:hover { background: rgba(167,139,250,0.1); }

.insights-expanded-panel {
  border: 1px solid rgba(167,139,250,0.15);
  border-top: none;
  border-radius: 0 0 10px 10px;
  background: var(--bg-surface);
  padding: 14px;
}

.insights-slide-enter-active, .insights-slide-leave-active { transition: all 0.25s ease; }
.insights-slide-enter-from, .insights-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
