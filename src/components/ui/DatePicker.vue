<template>
  <div class="datepicker-wrapper" v-click-outside="closeCalendar">
    <!-- Input container com campo de digitação e botão de calendário -->
    <div 
      ref="inputRef"
      class="datepicker-input" 
      :class="{ 'is-active': isOpen, 'is-disabled': disabled }"
    >
      <input
        ref="textInputRef"
        type="text"
        :value="inputValue"
        :placeholder="placeholder || 'DD/MM/AAAA'"
        :disabled="disabled"
        maxlength="10"
        autocomplete="off"
        @input="onTextInput"
        @blur="onTextBlur"
        @keydown.enter.prevent="handleEnter"
      />
      <button 
        type="button" 
        class="calendar-trigger-btn" 
        :disabled="disabled"
        title="Abrir calendário"
        tabindex="-1"
        @click.stop="toggleCalendar"
      >
        <i class="fas fa-calendar-days"></i>
      </button>
    </div>

    <!-- O calendário popover -->
    <transition name="fade-scale">
      <div v-if="isOpen" class="datepicker-dropdown" :style="dropdownStyle">
        <div class="datepicker-header">
          <button type="button" class="btn-icon" @click="prevMonth"><i class="fas fa-chevron-left"></i></button>
          <div class="header-selectors">
            <select v-model="selectedMonth" @change="updateViewDate">
              <option v-for="(m, i) in monthNames" :key="i" :value="i">{{ m }}</option>
            </select>
            <select v-model="selectedYear" @change="updateViewDate">
              <option v-for="y in yearsList" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <button type="button" class="btn-icon" @click="nextMonth"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="datepicker-weekdays">
          <span v-for="d in weekdays" :key="d">{{ d }}</span>
        </div>
        <div class="datepicker-days">
          <!-- Espaços vazios antes do dia 1 -->
          <div v-for="blank in blankDays" :key="'blank-' + blank" class="day-cell empty"></div>
          
          <!-- Dias do mês -->
          <div 
            v-for="day in daysInMonth" 
            :key="day" 
            class="day-cell"
            :class="{ 
              'is-today': isToday(day), 
              'is-selected': isSelected(day) 
            }"
            @click="selectDate(day)"
          >
            {{ day }}
          </div>
        </div>
        <div v-if="modelValue || inputValue" class="datepicker-footer">
          <button type="button" class="btn-clear" @click="clearDate">Limpar</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { maskDate, isValidDate } from '@/utils/masks'

const props = defineProps({
  modelValue: { type: String, default: '' }, // YYYY-MM-DD
  placeholder: { type: String, default: 'DD/MM/AAAA' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const dropdownStyle = ref<Record<string, string>>({})
const inputRef = ref<HTMLElement | null>(null)
const textInputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')

// Data atual visualizada no calendário (não necessariamente a selecionada)
const viewDate = ref(new Date())

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const selectedMonth = ref(new Date().getMonth())
const selectedYear = ref(new Date().getFullYear())

const currentYear = new Date().getFullYear()
const yearsList = Array.from({ length: 120 }, (_, i) => currentYear + 10 - i)

// Inicializar e sincronizar viewDate e inputValue com base no modelValue
function syncFromModelValue(val: string) {
  if (val) {
    const parts = val.split('T')[0].split('-').map(Number)
    if (parts.length === 3) {
      const [y, m, d] = parts
      if (y && m && d) {
        inputValue.value = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
        viewDate.value = new Date(y, m - 1, d)
        selectedYear.value = y
        selectedMonth.value = m - 1
        return
      }
    }
  }
  inputValue.value = ''
}

onMounted(() => {
  syncFromModelValue(props.modelValue)
})

watch(() => props.modelValue, (val) => {
  syncFromModelValue(val)
})

const year = computed(() => viewDate.value.getFullYear())
const month = computed(() => viewDate.value.getMonth())

watch(viewDate, (newDate) => {
  selectedMonth.value = newDate.getMonth()
  selectedYear.value = newDate.getFullYear()
})

function updateViewDate() {
  viewDate.value = new Date(selectedYear.value, selectedMonth.value, 1)
}

const blankDays = computed(() => {
  const firstDayOfMonth = new Date(year.value, month.value, 1).getDay()
  return firstDayOfMonth
})

const daysInMonth = computed(() => {
  return new Date(year.value, month.value + 1, 0).getDate()
})

function prevMonth() {
  viewDate.value = new Date(year.value, month.value - 1, 1)
}

function nextMonth() {
  viewDate.value = new Date(year.value, month.value + 1, 1)
}

function isToday(day: number) {
  const today = new Date()
  return today.getDate() === day && today.getMonth() === month.value && today.getFullYear() === year.value
}

function isSelected(day: number) {
  if (!props.modelValue) return false
  const [y, m, d] = props.modelValue.split('T')[0].split('-').map(Number)
  return d === day && m - 1 === month.value && y === year.value
}

function selectDate(day: number) {
  const m = String(month.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  const isoVal = `${year.value}-${m}-${d}`
  inputValue.value = `${d}/${m}/${year.value}`
  emit('update:modelValue', isoVal)
  closeCalendar()
}

function clearDate() {
  inputValue.value = ''
  emit('update:modelValue', '')
  closeCalendar()
}

function onTextInput(e: Event) {
  const target = e.target as HTMLInputElement
  const masked = maskDate(target.value)
  inputValue.value = masked
  target.value = masked

  if (!masked) {
    emit('update:modelValue', '')
    return
  }

  // Só emite se for uma data completa e válida (DD/MM/AAAA com 4 dígitos no ano)
  if (isValidDate(masked)) {
    const [d, m, y] = masked.split('/').map(Number)
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    viewDate.value = new Date(y, m - 1, d)
    selectedYear.value = y
    selectedMonth.value = m - 1
    emit('update:modelValue', iso)
  }
}

function onTextBlur() {
  const current = inputValue.value.trim()
  if (!current) {
    emit('update:modelValue', '')
    return
  }

  // Se ao sair do campo a data não for 100% válida ou incompleta (ex: ano com menos de 4 digitos),
  // restaura a data válida anterior se houver, ou limpa o campo
  if (!isValidDate(current)) {
    if (props.modelValue) {
      syncFromModelValue(props.modelValue)
    } else {
      inputValue.value = ''
      emit('update:modelValue', '')
    }
  }
}

function handleEnter() {
  if (isOpen.value) {
    closeCalendar()
  }
}

function updatePosition() {
  if (!isOpen.value || !inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  if (rect.bottom < 0 || rect.top > window.innerHeight) {
    closeCalendar()
    return
  }
  let left = rect.left
  if (left + 290 > window.innerWidth) {
    left = Math.max(10, window.innerWidth - 300)
  }
  dropdownStyle.value = {
    top: `${rect.bottom + 6}px`,
    left: `${left}px`,
  }
}

function toggleCalendar() {
  if (props.disabled) return
  if (!isOpen.value) {
    isOpen.value = true
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
  } else {
    closeCalendar()
  }
}

function closeCalendar() {
  if (isOpen.value) {
    isOpen.value = false
    window.removeEventListener('scroll', updatePosition, true)
    window.removeEventListener('resize', updatePosition)
  }
}

onUnmounted(() => {
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})

// Diretiva v-click-outside para fechar quando clica fora
const vClickOutside = {
  mounted(el: any, binding: any) {
    el._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el._clickOutside)
  }
}
</script>

<style scoped>
.datepicker-wrapper {
  position: relative;
  width: 100%;
  overflow: visible;
}

.datepicker-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0 6px 0 14px;
  height: 40px;
  color: var(--text-primary);
  font-size: 0.85rem;
  transition: all 0.2s;
}
.datepicker-input:hover:not(.is-disabled) { border-color: var(--gold-light); }
.datepicker-input.is-active { border-color: var(--gold); box-shadow: 0 0 0 2px rgba(212,175,55,0.2); }
.datepicker-input.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-card);
}

.datepicker-input input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 0.85rem;
  padding: 0;
  width: 100%;
  font-family: inherit;
}
.datepicker-input input:disabled {
  cursor: not-allowed;
  color: var(--text-muted);
}
.datepicker-input input::placeholder {
  color: var(--text-muted);
}

.calendar-trigger-btn {
  background: transparent;
  border: none;
  color: var(--gold);
  font-size: 0.95rem;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
}
.calendar-trigger-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.15);
}
.calendar-trigger-btn:disabled {
  cursor: not-allowed;
  color: var(--text-muted);
}

.datepicker-dropdown {
  position: fixed;
  z-index: 99999;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px;
  width: 290px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}

.datepicker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.header-selectors {
  display: flex;
  gap: 6px;
  align-items: center;
}
.header-selectors select {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 0.78rem;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  max-width: 115px;
}
.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}
.btn-icon:hover { background: var(--bg-input); color: var(--gold); }

.datepicker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.datepicker-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 6px;
  transition: 0.2s;
}
.day-cell:not(.empty):hover {
  background: var(--bg-input);
  color: var(--gold);
}
.day-cell.is-today {
  color: var(--gold);
  font-weight: 700;
  border: 1px solid var(--gold);
}
.day-cell.is-selected {
  background: var(--gold);
  color: #fff !important;
  font-weight: 700;
  border-color: var(--gold);
}
[data-theme="dark"] .day-cell.is-selected { color: #1a1a1a !important; }

.datepicker-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: center;
}
.btn-clear {
  background: transparent;
  border: none;
  color: var(--danger);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-clear:hover { text-decoration: underline; }

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-5px);
}
</style>
