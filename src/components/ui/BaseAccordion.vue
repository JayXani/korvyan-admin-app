<template>
  <div class="accordion" :class="{ 'accordion--open': modelValue }">
    <button 
      type="button" 
      class="accordion-header" 
      @click="$emit('update:modelValue', !modelValue)"
      :aria-expanded="modelValue"
    >
      <div class="header-content">
        <i v-if="icon" :class="[icon, 'header-icon']"></i>
        <div class="header-text">
          <h3 class="header-title">{{ title }}</h3>
          <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <i class="fas fa-chevron-down caret"></i>
    </button>
    
    <transition name="expand">
      <div v-if="modelValue" class="accordion-body">
        <div class="body-content">
          <slot></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  icon?: string;
  modelValue: boolean;
}>();

defineEmits(['update:modelValue']);
</script>

<style scoped>
.accordion {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 1rem;
  box-shadow: var(--shadow);
}

.accordion:hover {
  border-color: var(--gold-light);
}

.accordion--open {
  border-color: var(--gold);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  font-family: inherit;
}

.accordion-header:hover {
  background: var(--gold-dim);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  font-size: 1.1rem;
  color: var(--gold);
  width: 20px;
  text-align: center;
}

.header-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 2px 0 0;
}

.caret {
  font-size: 0.8rem;
  color: var(--text-muted);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.accordion--open .caret {
  transform: rotate(180deg);
  color: var(--gold);
}

.accordion-body {
  border-top: 1px solid var(--border-light);
  overflow: hidden;
}

.body-content {
  padding: 1.5rem;
}

/* Animation */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 2000px; /* High enough to contain content */
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
