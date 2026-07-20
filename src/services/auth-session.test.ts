import { afterEach, describe, expect, it } from 'vitest'
import { setErrorReporter } from '../utils/logError'
import { getStoredSession } from './auth-session'

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
