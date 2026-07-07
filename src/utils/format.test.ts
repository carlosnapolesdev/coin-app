import { afterEach, describe, expect, it } from 'vitest'
import { setLocale } from '../composables/useLocale'
import { formatCurrency, formatDate, formatMonthYear, parseDateOnly } from './format'

describe('format helpers', () => {
  afterEach(() => {
    setLocale('en')
  })

  it('formats currency using en-US by default', () => {
    expect(formatCurrency(1234.5)).toBe('1,234.50')
  })

  it('formats currency using es-ES separators when locale is es', () => {
    setLocale('es')
    expect(formatCurrency(1234.5)).toBe('1234,50')
  })

  it('parses a YYYY-MM-DD string as a local date (no timezone shift)', () => {
    const d = parseDateOnly('2026-01-15')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(15)
  })

  it('formats a date-only string per the active locale', () => {
    setLocale('en')
    expect(formatDate('2026-01-15', { month: 'short', day: 'numeric' })).toBe('Jan 15')
  })

  it('formats month/year per the active locale', () => {
    setLocale('en')
    expect(formatMonthYear(new Date(2026, 0, 15))).toBe('January 2026')
  })
})