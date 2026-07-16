import { readonly, ref } from 'vue'

export type ToastType = 'success' | 'error'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

export const SUCCESS_DURATION_MS = 3500
export const ERROR_DURATION_MS = 6000
export const MAX_TOASTS = 5

// Singleton a nivel de módulo: todos los consumidores comparten la misma lista.
const toasts = ref<Toast[]>([])
const timeouts = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 1

const dismiss = (id: number) => {
  const timeout = timeouts.get(id)
  if (timeout !== undefined) {
    clearTimeout(timeout)
    timeouts.delete(id)
  }
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

const push = (type: ToastType, message: string): number => {
  const id = nextId++
  if (toasts.value.length >= MAX_TOASTS) {
    dismiss(toasts.value[0]!.id)
  }
  toasts.value = [...toasts.value, { id, type, message }]
  const duration = type === 'success' ? SUCCESS_DURATION_MS : ERROR_DURATION_MS
  timeouts.set(id, setTimeout(() => dismiss(id), duration))
  return id
}

const clear = () => {
  for (const toast of [...toasts.value]) dismiss(toast.id)
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    dismiss,
    clear,
  }
}
