import { afterEach, describe, expect, it } from 'vitest'
import { setErrorReporter } from '../utils/logError'
import { getStoredSession, updateStoredToken } from './auth-session'

describe('auth-session error reporting', () => {
  afterEach(() => {
    setErrorReporter(null)
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('reports corrupt stored session instead of discarding the error', () => {
    const reported: string[] = []
    setErrorReporter((context, _err) => reported.push(context))
    window.localStorage.setItem('crecik.auth', '{esto no es json')

    const session = getStoredSession()

    expect(session).toBeNull()
    expect(reported).toEqual(['authSession.readStoredSession'])
    expect(window.localStorage.getItem('crecik.auth')).toBeNull()
  })
})

describe('updateStoredToken', () => {
  afterEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('updates the token in whichever storage holds the session', () => {
    const session = {
      token: 'old',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: { id: 1, fullName: 'U', email: 'u@t.com', username: null, language: 'es' },
    }
    window.sessionStorage.setItem('crecik.auth', JSON.stringify(session))

    updateStoredToken('fresh', '2099-02-02T00:00:00.000Z')

    const stored = JSON.parse(window.sessionStorage.getItem('crecik.auth')!)
    expect(stored.token).toBe('fresh')
    expect(stored.expiresAt).toBe('2099-02-02T00:00:00.000Z')
    expect(stored.user.email).toBe('u@t.com')
    expect(window.localStorage.getItem('crecik.auth')).toBeNull()
  })
})
