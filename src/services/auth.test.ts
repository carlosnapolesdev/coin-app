import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import * as useLocaleModule from '../composables/useLocale'
import type { AxiosResponse } from 'axios'
import type { Router } from 'vue-router'
import type { AuthResponse } from './auth-session'
import api from './api'

vi.mock('./api', () => ({
  default: { post: vi.fn(), get: vi.fn(), patch: vi.fn() },
}))

const mockedApi = {
  post: api.post as Mock,
  get: api.get as Mock,
  patch: api.patch as Mock,
}

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
    expect(window.sessionStorage.getItem('crecik.auth')).toBeNull()
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

    expect(window.sessionStorage.getItem('crecik.auth')).toBeNull()
    expect(router.replace).not.toHaveBeenCalled()
  })
})

describe('loginWithGoogle', () => {
  afterEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('posts the id token, stores the session and returns the user', async () => {
    const { loginWithGoogle } = await import('./auth')
    const response = {
      token: 't',
      tokenType: 'Bearer',
      expiresAt: 'x',
      user: {
        id: 1,
        fullName: 'Ada',
        email: 'a@b.com',
        username: null,
        language: 'en',
        requiresCurrencySetup: true,
      },
    }
    mockedApi.post.mockResolvedValue({ data: response } as AxiosResponse<unknown>)

    const data = await loginWithGoogle('idtok', true)

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/google', { idToken: 'idtok', rememberMe: true })
    expect(data.user.requiresCurrencySetup).toBe(true)
  })
})

describe('getGoogleClientId', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns the client id from the config endpoint', async () => {
    const { getGoogleClientId } = await import('./auth')
    mockedApi.get.mockResolvedValue({ data: { clientId: 'cid' } } as AxiosResponse<unknown>)

    await expect(getGoogleClientId()).resolves.toBe('cid')

    expect(mockedApi.get).toHaveBeenCalledWith('/auth/google/config')
  })
})
