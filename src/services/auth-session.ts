import type { OnboardingState } from './onboarding'

export type AuthUser = {
  id: number
  fullName: string
  email: string
  username: string | null
  language: string
  onboardingState?: OnboardingState | null
}

export type AuthResponse = {
  token: string
  tokenType: string
  expiresAt: string
  user: AuthUser
}

const AUTH_STORAGE_KEY = 'coinflow.auth'
const REMEMBER_IDENTIFIER_KEY = 'coinflow.remember.identifier'

type StorageMode = 'local' | 'session'

const getStorage = (mode: StorageMode) => (mode === 'local' ? window.localStorage : window.sessionStorage)

const readStoredSession = (storage: Storage): AuthResponse | null => {
  const value = storage.getItem(AUTH_STORAGE_KEY)
  if (!value) {
    return null
  }

  try {
    const session = JSON.parse(value) as AuthResponse
    if (new Date(session.expiresAt) <= new Date()) {
      storage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return session
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export const getStoredSession = (): AuthResponse | null => {
  return readStoredSession(window.localStorage) ?? readStoredSession(window.sessionStorage)
}

export const getAccessToken = (): string | null => {
  return getStoredSession()?.token ?? null
}

export const getStoredUser = (): AuthUser | null => {
  return getStoredSession()?.user ?? null
}

export const saveAuthSession = (session: AuthResponse, remember: boolean) => {
  clearAuthSession()
  getStorage(remember ? 'local' : 'session').setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export const updateStoredUser = (user: AuthUser) => {
  const localSession = readStoredSession(window.localStorage)
  if (localSession) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...localSession, user }))
    return
  }

  const sessionStorageSession = readStoredSession(window.sessionStorage)
  if (sessionStorageSession) {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...sessionStorageSession, user }))
  }
}

export const clearAuthSession = () => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

export const getSavedIdentifier = (): string | null => {
  return window.localStorage.getItem(REMEMBER_IDENTIFIER_KEY)
}

export const saveIdentifier = (identifier: string) => {
  window.localStorage.setItem(REMEMBER_IDENTIFIER_KEY, identifier)
}

export const clearSavedIdentifier = () => {
  window.localStorage.removeItem(REMEMBER_IDENTIFIER_KEY)
}
