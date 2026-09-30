<template>
  <div class="ocr-addon">
    <div class="ocr-upload-zone" @click="triggerFile" :class="{ loading: isLoading }">
      <input type="file" ref="fileInput" style="display:none" @change="handleUpload" accept="image/*,.pdf" />
      <template v-if="!isLoading && !result">
        <i class="fas fa-cloud-arrow-up"></i>
        <p>Clique ou arraste um <strong>RG / CNH / CPF</strong></p>
        <span class="ocr-hint">A IA extrai os dados automaticamente</span>
      </template>
      <template v-else-if="isLoading">
        <i class="fas fa-spinner fa-spin" style="color:var(--gold);font-size:1.6rem"></i>
        <p>Lendo documento com IA...</p>
      </template>
      <template v-else>
        <i class="fas fa-circle-check" style="color:var(--success);font-size:1.6rem"></i>
        <p>Documento processado!</p>
        <button class="btn-redo" @click.stop="reset">Ler outro</button>
      </template>
    </div>

    <transition name="fade-slide">
      <div v-if="result" class="ocr-result">
        <div class="ocr-result-header">
          <span>DADOS EXTRAÍDOS PELA IA</span>
          <button class="icon-btn-sm" title="Copiar todos os dados" @click="copyAll">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="result-fields">
          <div class="result-field">
            <label>NOME COMPLETO</label>
            <input type="text" v-model="result.name" />
          </div>
          <div class="result-grid">
            <div class="result-field">
              <label>CPF</label>
              <input type="text" v-model="result.cpf" />
            </div>
            <div class="result-field">
              <label>DATA DE NASCIMENTO</label>
              <input type="text" v-model="result.birthdate" />
            </div>
          </div>
          <div class="result-field" v-if="result.rg">
            <label>RG</label>
            <input type="text" v-model="result.rg" />
          </div>
        </div>
        <div class="ocr-actions">
          <button class="btn btn-gold w-full" @click="emit('data-extracted', result)">
            <i class="fas fa-link"></i> Usar estes dados
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

export interface OcrResult {
  name: string
  cpf: string
  birthdate: string
  rg?: string
  relationship?: string
}

const emit = defineEmits<{
  'data-extracted': [data: OcrResult]
}>()

const { success: toastSuccess, error: toastError } = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const isLoading = ref(false)
const result = ref<OcrResult | null>(null)

function triggerFile() {
  if (!isLoading.value) fileInput.value?.click()
}

function reset() {
  result.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function handleUpload(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files?.length) return
  // TODO: Integrar com endpoint real de OCR quando disponível no backend
  isLoading.value = true
  result.value = null
  setTimeout(() => {
    isLoading.value = false
    result.value = {
      name: 'MARIA APARECIDA DE OLIVEIRA',
      cpf: '321.456.987-12',
      birthdate: '15/03/1985',
      rg: '12.345.678-9',
    }
    toastSuccess('Documento processado com sucesso pela IA!')
  }, 2500)
}

function copyAll() {
  if (!result.value) return
  const text = `Nome: ${result.value.name}\nCPF: ${result.value.cpf}\nNascimento: ${result.value.birthdate}${result.value.rg ? '\nRG: ' + result.value.rg : ''}`
  navigator.clipboard.writeText(text)
  toastSuccess('Dados copiados!')
}
</script>

<style scoped>
.ocr-addon { display: flex; flex-direction: column; gap: 12px; }

.ocr-upload-zone {
  border: 2px dashed var(--border);
  background: var(--bg-input);
  border-radius: 10px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.25s;
}
.ocr-upload-zone:hover:not(.loading) { border-color: var(--gold); background: var(--gold-dim); }
.ocr-upload-zone.loading { cursor: default; opacity: 0.8; }
.ocr-upload-zone i { font-size: 1.8rem; color: var(--text-muted); }
.ocr-upload-zone p { font-size: 0.82rem; color: var(--text-secondary); margin: 0; }
.ocr-hint { font-size: 0.72rem; color: var(--text-muted); }
.btn-redo { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 4px 12px; font-size: 0.75rem; color: var(--text-muted); cursor: pointer; }
.btn-redo:hover { border-color: var(--gold); color: var(--gold); }

.ocr-result { background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: 10px; overflow: hidden; }
.ocr-result-header { background: var(--bg-input); border-bottom: 1px solid var(--border-light); padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; }
.result-fields { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.result-field { display: flex; flex-direction: column; gap: 4px; }
.result-field label { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.4px; }
.result-field input { padding: 6px 10px; font-size: 0.82rem; }
.result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ocr-actions { padding: 0 12px 12px; }

.icon-btn-sm { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; font-size: 0.85rem; border-radius: 4px; }
.icon-btn-sm:hover { color: var(--gold); }
.w-full { width: 100%; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.25s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
