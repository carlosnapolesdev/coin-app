import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveInitialLocale } from './useLocale'
import * as authSession from '../services/auth-session'

describe('resolveInitialLocale', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(authSession, 'getStoredUser').mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns en when nothing is stored and browser language is unsupported', () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('de-DE')
    expect(resolveInitialLocale()).toBe('en')
  })

  it('returns the stored locale from localStorage when present', () => {
    window.localStorage.setItem('coinflow-locale', 'pt')
    expect(resolveInitialLocale()).toBe('pt')
  })

  it('prefers the cached session user language over localStorage', () => {
    window.localStorage.setItem('coinflow-locale', 'pt')
    vi.spyOn(authSession, 'getStoredUser').mockReturnValue({
      id: 1, fullName: 'Test', email: 't@test.com', username: null, language: 'es',
    })
    expect(resolveInitialLocale()).toBe('es')
  })

  it('falls back to a matching browser language when nothing is stored', () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('es-MX')
    expect(resolveInitialLocale()).toBe('es')
  })
})
