<template>
  <div class="insights-content">
    <div v-if="loading" class="insights-loading-state">
      <i class="fas fa-brain fa-spin" style="color:#a78bfa;font-size:1.4rem"></i>
      <p>Analisando dados com IA...</p>
    </div>

    <template v-else-if="summary">
      <!-- Health Score -->
      <div class="health-row">
        <div class="health-score-circle" :class="summary.healthClass">
          <span class="score-num">{{ summary.healthScore }}</span>
          <span class="score-unit">%</span>
        </div>
        <div class="health-info">
          <p class="health-title">Saúde: <strong>{{ summary.healthLabel }}</strong></p>
          <div class="health-bar-wrap">
            <div class="health-bar-fill" :class="summary.healthClass" :style="{ width: summary.healthScore + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Metrics -->
      <div class="metrics-grid" v-if="summary.metrics.length">
        <div v-for="m in summary.metrics" :key="m.label" class="metric-chip">
          <span class="metric-label">{{ m.label }}</span>
          <div class="metric-value-row">
            <span class="metric-value">{{ m.value }}</span>
            <i v-if="m.trend === 'up'" class="fas fa-arrow-trend-up" style="color:var(--success);font-size:0.7rem"></i>
            <i v-else-if="m.trend === 'down'" class="fas fa-arrow-trend-down" style="color:var(--danger);font-size:0.7rem"></i>
          </div>
        </div>
      </div>

      <!-- Highlights -->
      <div class="highlights-section" v-if="summary.highlights.length">
        <p class="section-mini-title"><i class="fas fa-lightbulb" style="color:var(--gold)"></i> DESTAQUES</p>
        <ul class="highlights-list">
          <li v-for="h in summary.highlights" :key="h">{{ h }}</li>
        </ul>
      </div>

      <!-- Actions -->
      <div class="actions-section" v-if="summary.actions.length">
        <p class="section-mini-title"><i class="fas fa-bolt" style="color:#a78bfa"></i> AÇÕES SUGERIDAS</p>
        <div class="action-tags">
          <span v-for="a in summary.actions" :key="a" class="action-tag">{{ a }}</span>
        </div>
      </div>

      <button class="refresh-btn" @click="$emit('refresh')">
        <i class="fas fa-rotate-right"></i> Atualizar análise
      </button>
    </template>

    <div v-else class="insights-empty">
      <i class="fas fa-brain"></i>
      <p>Nenhuma análise disponível ainda.</p>
      <button class="btn btn-gold" style="margin-top:8px;font-size:0.8rem" @click="$emit('refresh')">
        <i class="fas fa-play"></i> Analisar agora
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InsightsSummary } from './AIInsightsAddon.vue'

defineProps<{
  summary: InsightsSummary | null
  context: string
  loading: boolean
}>()
defineEmits(['refresh'])
</script>

<style scoped>
.insights-content { display: flex; flex-direction: column; gap: 12px; }
.insights-loading-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px; color: var(--text-muted); font-size: 0.82rem; }

.health-row { display: flex; align-items: center; gap: 12px; }
.health-score-circle {
  width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; flex-direction: column;
  border: 3px solid;
}
.health-score-circle.health-great { border-color: var(--success); color: var(--success); }
.health-score-circle.health-good { border-color: #60a5fa; color: #60a5fa; }
.health-score-circle.health-warn { border-color: #f59e0b; color: #f59e0b; }
.health-score-circle.health-danger { border-color: var(--danger); color: var(--danger); }
.score-num { font-size: 1rem; font-weight: 700; line-height: 1; }
.score-unit { font-size: 0.6rem; }
.health-info { flex: 1; }
.health-title { font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 6px; }
.health-bar-wrap { height: 6px; background: var(--border-light); border-radius: 3px; overflow: hidden; }
.health-bar-fill { height: 100%; border-radius: 3px; transition: width 0.8s ease; }
.health-bar-fill.health-great { background: var(--success); }
.health-bar-fill.health-good { background: #60a5fa; }
.health-bar-fill.health-warn { background: #f59e0b; }
.health-bar-fill.health-danger { background: var(--danger); }

.metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
.metric-chip { background: var(--bg-input); border: 1px solid var(--border-light); border-radius: 8px; padding: 8px 10px; }
.metric-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; display: block; margin-bottom: 4px; }
.metric-value-row { display: flex; align-items: center; gap: 4px; }
.metric-value { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }

.section-mini-title { font-size: 0.68rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; margin: 0 0 6px; display: flex; align-items: center; gap: 5px; }
.highlights-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.highlights-list li { font-size: 0.78rem; color: var(--text-secondary); padding-left: 12px; position: relative; }
.highlights-list li::before { content: '›'; position: absolute; left: 0; color: #a78bfa; font-weight: 700; }

.action-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.action-tag { background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.2); color: #a78bfa; font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; font-weight: 500; }

.refresh-btn { background: none; border: 1px solid var(--border); border-radius: 6px; color: var(--text-muted); font-size: 0.75rem; padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s; align-self: flex-start; }
.refresh-btn:hover { border-color: #a78bfa; color: #a78bfa; }

.insights-empty { text-align: center; padding: 20px; color: var(--text-muted); }
.insights-empty i { font-size: 1.8rem; display: block; margin-bottom: 8px; color: var(--border); }
.insights-empty p { font-size: 0.82rem; margin: 0; }
</style>
