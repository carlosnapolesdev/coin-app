import { describe, expect, it } from 'vitest'
import { BRAND, documentTitleFor } from './documentTitle'

describe('documentTitleFor', () => {
  const t = (key: string): string =>
    ({ 'sidebar.nav.transactions': 'Transactions' } as Record<string, string>)[key] ?? key

  it('formats "View — Crecik" when the route declares a title key', () => {
    expect(documentTitleFor({ title: 'sidebar.nav.transactions' }, t)).toBe('Transactions — Crecik')
  })

  it('falls back to the bare brand when no title key is present', () => {
    expect(documentTitleFor({}, t)).toBe(BRAND)
  })

  it('ignores a non-string title meta', () => {
    expect(documentTitleFor({ title: 123 as unknown as string }, t)).toBe(BRAND)
  })
})
