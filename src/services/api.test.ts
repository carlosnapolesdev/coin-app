import type { AxiosAdapter } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import api, { setUnauthorizedHandler } from './api'
import {
  getStoredSession,
  saveAuthSession,
  type AuthResponse,
} from './auth-session'

const session: AuthResponse = {
  token: 'jwt-token',
  tokenType: 'Bearer',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  user: {
    id: 1,
    fullName: 'Test User',
    email: 'user@test.com',
    username: null,
    language: 'es',
    onboardingState: null,
  },
}

const rejectWithStatus = (status: number): AxiosAdapter => (config) =>
  Promise.reject({
    config,
    response: { status },
  })

describe('api unauthorized handling', () => {
  afterEach(() => {
    setUnauthorizedHandler(null)
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('preserves the session for a 400 password verification error', async () => {
    saveAuthSession(session, false)
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    await expect(
      api.patch(
        '/users/me/password',
        { currentPassword: 'wrong', newPassword: 'NewPass1' },
        { adapter: rejectWithStatus(400) },
      ),
    ).rejects.toMatchObject({ response: { status: 400 } })

    expect(handler).not.toHaveBeenCalled()
    expect(getStoredSession()?.token).toBe('jwt-token')
  })

  it('does not invalidate a session for rejected login credentials', async () => {
    saveAuthSession(session, false)
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    await expect(
      api.post(
        '/auth/login',
        { identifier: 'user@test.com', password: 'wrong' },
        { adapter: rejectWithStatus(401) },
      ),
    ).rejects.toMatchObject({ response: { status: 401 } })

    expect(handler).not.toHaveBeenCalled()
    expect(getStoredSession()?.token).toBe('jwt-token')
  })

  it('invokes the registered handler for a protected endpoint 401', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    await expect(
      api.get('/auth/me', { adapter: rejectWithStatus(401) }),
    ).rejects.toMatchObject({ response: { status: 401 } })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('restores storage cleanup when the registered handler is reset', async () => {
    saveAuthSession(session, false)
    setUnauthorizedHandler(null)

    await expect(
      api.get('/auth/me', { adapter: rejectWithStatus(401) }),
    ).rejects.toMatchObject({ response: { status: 401 } })

    expect(getStoredSession()).toBeNull()
  })
})
