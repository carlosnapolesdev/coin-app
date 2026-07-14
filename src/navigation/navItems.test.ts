import { describe, expect, it } from 'vitest'
import { NAV_ITEMS } from './navItems'
import en from '../i18n/locales/en'
import es from '../i18n/locales/es'
import pt from '../i18n/locales/pt'

const resolveKey = (messages: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[key]
    return undefined
  }, messages)

describe('NAV_ITEMS', () => {
  it('lists the nine authenticated views with icon and route name', () => {
    expect(NAV_ITEMS).toHaveLength(9)
    for (const item of NAV_ITEMS) {
      expect(item.icon).toBeTruthy()
      expect(item.routeName).toBeTruthy()
    }
  })

  it.each([
    ['en', en],
    ['es', es],
    ['pt', pt],
  ])('resolves every labelKey in the %s locale', (_code, messages) => {
    for (const item of NAV_ITEMS) {
      expect(resolveKey(messages, item.labelKey), item.labelKey).toEqual(expect.any(String))
    }
  })
})
