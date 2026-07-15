import { afterEach, describe, expect, it, vi } from 'vitest'
import * as useLocaleModule from '../composables/useLocale'
import type { AxiosResponse } from 'axios'
import type { Router } from 'vue-router'
import type { AuthResponse } from './auth-session'

vi.mock('./api', () => ({
  default: { post: vi.fn(), get: vi.fn(), patch: vi.fn() },
}))

describe('changeLanguage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('applies the locale locally without calling the backend when logged out', async () => {
    const setLocaleSpy = vi.spyOn(useLocaleModule, 'setLocale')
    const api = (await import('./api')).default
    const { changeLanguage } = await import('./auth')

    await changeLanguage('es')

    expect(setLocaleSpy).toHaveBeenCalledWith('es')
    expect(api.patch).not.toHaveBeenCalled()
  })
})

const authenticatedSession: AuthResponse = {
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

const createRouterStub = (
  fullPath: string,
  requiresAuth: boolean,
) =>
  ({
    currentRoute: {
      value: {
        name: requiresAuth ? 'settings' : 'login',
        fullPath,
        meta: requiresAuth ? { requiresAuth: true } : {},
      },
    },
    replace: vi.fn().mockResolvedValue(undefined),
  }) as unknown as Router

describe('handleUnauthorizedSession', () => {
  afterEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('clears reactive auth state and redirects a protected route with its return path', async () => {
    const api = (await import('./api')).default
    vi.mocked(api.post).mockResolvedValueOnce({
      data: authenticatedSession,
    } as AxiosResponse<AuthResponse>)
    const {
      handleUnauthorizedSession,
      login,
      useAuthState,
    } = await import('./auth')
    const router = createRouterStub('/settings?tab=password', true)

    await login(
      { identifier: 'user@test.com', password: 'Test1234' },
      false,
    )
    expect(useAuthState().token).toBe('jwt-token')

    handleUnauthorizedSession(router)

    expect(useAuthState().token).toBeNull()
    expect(useAuthState().user).toBeNull()
    expect(window.sessionStorage.getItem('coinflow.auth')).toBeNull()
    expect(router.replace).toHaveBeenCalledWith({
      name: 'login',
      query: { redirect: '/settings?tab=password' },
    })
  })

  it('clears the session without forcing navigation from a public route', async () => {
    const api = (await import('./api')).default
    vi.mocked(api.post).mockResolvedValueOnce({
      data: authenticatedSession,
    } as AxiosResponse<AuthResponse>)
    const { handleUnauthorizedSession, login } = await import('./auth')
    const router = createRouterStub('/login', false)

    await login(
      { identifier: 'user@test.com', password: 'Test1234' },
      false,
    )
    handleUnauthorizedSession(router)

    expect(window.sessionStorage.getItem('coinflow.auth')).toBeNull()
    expect(router.replace).not.toHaveBeenCalled()
  })
})
