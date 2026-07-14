import { describe, expect, it } from 'vitest'
import { i18n } from './index'
import type { SupportedLocale } from './index'

describe('i18n messages', () => {
  it('has common.loading defined for every supported locale', () => {
    const messages = i18n.global.messages.value as Record<string, { common: { loading: string } }>
    expect(messages.en!.common.loading).toBe('Loading')
    expect(messages.es!.common.loading).toBe('Cargando')
    expect(messages.pt!.common.loading).toBe('Carregando')
  })

  // Regression guard for the vue-i18n "Invalid linked format" console errors:
  // a literal '@' is the linked-message sigil and must be escaped as {'@'}.
  it('escapes every literal "@" so the message compiler never chokes', () => {
    const messages = i18n.global.messages.value as Record<string, unknown>
    const offenders: string[] = []

    const walk = (node: unknown, path: string) => {
      if (typeof node === 'string') {
        if (node.includes('@') && !node.includes("{'@'}")) offenders.push(`${path}: ${node}`)
        return
      }
      if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) walk(value, path ? `${path}.${key}` : key)
      }
    }

    for (const locale of Object.keys(messages)) walk(messages[locale], locale)
    expect(offenders).toEqual([])
  })

  it('renders the escaped email placeholder with a real "@" and no fallback', () => {
    const cases: Array<[SupportedLocale, string]> = [
      ['en', 'name@company.com or username'],
      ['es', 'nombre@empresa.com o usuario'],
      ['pt', 'nome@empresa.com ou usuário'],
    ]
    for (const [locale, expected] of cases) {
      const rendered = i18n.global.t('auth.login.identifierPlaceholder', {}, { locale })
      expect(rendered).toBe(expected)
    }
  })
})
