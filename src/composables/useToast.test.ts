import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isReadonly } from 'vue'
import { ERROR_DURATION_MS, MAX_TOASTS, SUCCESS_DURATION_MS, useToast } from './useToast'

describe('useToast', () => {
  const toast = useToast()

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Singleton a nivel de módulo: limpiar antes de restaurar los timers.
    toast.clear()
    vi.useRealTimers()
  })

  it('adds a success toast to the list', () => {
    toast.success('Guardado')
    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0]).toMatchObject({ type: 'success', message: 'Guardado' })
  })

  it('adds an error toast to the list', () => {
    toast.error('Falló')
    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0]).toMatchObject({ type: 'error', message: 'Falló' })
  })

  it('auto-dismisses success toasts after SUCCESS_DURATION_MS', () => {
    toast.success('Guardado')
    vi.advanceTimersByTime(SUCCESS_DURATION_MS - 1)
    expect(toast.toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('auto-dismisses error toasts after ERROR_DURATION_MS', () => {
    toast.error('Falló')
    vi.advanceTimersByTime(SUCCESS_DURATION_MS)
    expect(toast.toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(ERROR_DURATION_MS - SUCCESS_DURATION_MS)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('dismisses a toast manually by id and cancels its timeout', () => {
    const id = toast.success('Guardado')
    expect(vi.getTimerCount()).toBe(1)
    toast.dismiss(id)
    expect(toast.toasts.value).toHaveLength(0)
    // El timeout debe quedar cancelado: el contador de timers cae a 0.
    expect(vi.getTimerCount()).toBe(0)
    // No debe reaparecer ni fallar cuando venza el timeout original.
    vi.advanceTimersByTime(SUCCESS_DURATION_MS)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('drops the oldest toast when exceeding MAX_TOASTS', () => {
    for (let i = 0; i < MAX_TOASTS + 1; i++) {
      toast.success(`mensaje ${i}`)
    }
    expect(toast.toasts.value).toHaveLength(MAX_TOASTS)
    expect(toast.toasts.value[0]!.message).toBe('mensaje 1')
    expect(toast.toasts.value[MAX_TOASTS - 1]!.message).toBe(`mensaje ${MAX_TOASTS}`)
  })

  it('clear() removes every toast and cancels all timers', () => {
    toast.success('uno')
    toast.error('dos')
    expect(vi.getTimerCount()).toBe(2)
    toast.clear()
    expect(toast.toasts.value).toHaveLength(0)
    // Cada timeout programado debe quedar cancelado al limpiar.
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shares state across callers and exposes a readonly list', () => {
    const first = useToast()
    const second = useToast()
    // Singleton a nivel de módulo: ambos consumidores ven la misma lista.
    expect(first.toasts).toBe(second.toasts)
    expect(isReadonly(first.toasts)).toBe(true)
    first.success('compartido')
    expect(second.toasts.value).toHaveLength(1)
    expect(second.toasts.value[0]).toMatchObject({ type: 'success', message: 'compartido' })
  })
})
