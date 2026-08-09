import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, type EffectScope } from 'vue'
import { useQuickTransaction } from './useQuickTransaction'

describe('useQuickTransaction', () => {
  const { isOpen, open, close, onCreated, emitCreated } = useQuickTransaction()
  const scopes: EffectScope[] = []

  // El estado vive a nivel de módulo: sin esto, los oyentes de un test siguen
  // registrados en el siguiente.
  afterEach(() => {
    for (const scope of scopes.splice(0)) scope.stop()
    close()
  })

  const subscribe = (listener: () => void) => {
    const scope = effectScope()
    scopes.push(scope)
    scope.run(() => onCreated(listener))
    return scope
  }

  it('shares the open flag between the trigger and the modal host', () => {
    expect(isOpen.value).toBe(false)
    open()
    expect(isOpen.value).toBe(true)
    close()
    expect(isOpen.value).toBe(false)
  })

  it('notifies every subscribed view when a transaction is created', () => {
    const dashboard = vi.fn()
    const accounts = vi.fn()
    subscribe(dashboard)
    subscribe(accounts)

    emitCreated()

    expect(dashboard).toHaveBeenCalledTimes(1)
    expect(accounts).toHaveBeenCalledTimes(1)
  })

  it('drops a listener when its scope stops, so an unmounted view stops refetching', () => {
    const listener = vi.fn()
    const scope = subscribe(listener)

    scope.stop()
    emitCreated()

    expect(listener).not.toHaveBeenCalled()
  })

  it('survives a listener that unsubscribes itself while being notified', () => {
    const survivor = vi.fn()
    let selfStopping: EffectScope
    // eslint-disable-next-line prefer-const
    selfStopping = subscribe(() => selfStopping.stop())
    subscribe(survivor)

    expect(() => emitCreated()).not.toThrow()
    expect(survivor).toHaveBeenCalledTimes(1)
  })
})
