import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  message: string
  type: ToastType
  errCode?: string
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  function show(message: string, type: ToastType = 'info', duration = 3500, errCode?: string) {
    const id = ++nextId
    toasts.value.push({ id, message, type, errCode })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return {
    toasts,
    success: (msg: string) => show(msg, 'success'),
    error: (msg: string, errCode?: string) => show(msg, 'error', 5000, errCode),
    info: (msg: string) => show(msg, 'info'),
    warning: (msg: string) => show(msg, 'warning'),
  }
}
