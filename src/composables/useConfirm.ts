import { ref } from 'vue'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

const confirmState = ref<ConfirmState | null>(null)

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      confirmState.value = { ...options, resolve }
    })
  }

  function accept() {
    confirmState.value?.resolve(true)
    confirmState.value = null
  }

  function cancel() {
    confirmState.value?.resolve(false)
    confirmState.value = null
  }

  return { confirm, accept, cancel, confirmState }
}
