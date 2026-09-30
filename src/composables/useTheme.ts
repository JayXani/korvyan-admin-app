import { ref, watchEffect } from 'vue'

type Theme = 'dark' | 'light'

const theme = ref<Theme>((localStorage.getItem('mg-theme') as Theme) || 'dark')

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('mg-theme', theme.value)
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  return { theme, toggleTheme }
}
