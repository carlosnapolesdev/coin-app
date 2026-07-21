import { describe, expect, it } from 'vitest'
import { guessBaseCurrency } from './guessBaseCurrency'

const codes = ['USD', 'EUR', 'ARS', 'BRL', 'GBP']

describe('guessBaseCurrency', () => {
  it('maps a region subtag to its currency when available', () => {
    expect(guessBaseCurrency(codes, 'es-AR')).toBe('ARS')
    expect(guessBaseCurrency(codes, 'pt-BR')).toBe('BRL')
    expect(guessBaseCurrency(codes, 'en-GB')).toBe('GBP')
  })
  it('falls back to USD when the region is unknown or unavailable', () => {
    expect(guessBaseCurrency(codes, 'es')).toBe('USD')
    expect(guessBaseCurrency(codes, 'ja-JP')).toBe('USD')
  })
  it('falls back to the first code when USD is absent', () => {
    expect(guessBaseCurrency(['EUR', 'GBP'], 'ja-JP')).toBe('EUR')
  })
})
