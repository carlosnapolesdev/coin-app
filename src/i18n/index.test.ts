import { describe, expect, it } from 'vitest'
import { i18n } from './index'

describe('i18n messages', () => {
  it('has common.loading defined for every supported locale', () => {
    const messages = i18n.global.messages.value as Record<string, { common: { loading: string } }>
    expect(messages.en!.common.loading).toBe('Loading')
    expect(messages.es!.common.loading).toBe('Cargando')
    expect(messages.pt!.common.loading).toBe('Carregando')
  })
})