import axios from 'axios'
import { reactive, readonly } from 'vue'
import type { Router } from 'vue-router'
import api from './api'
import {
  clearAuthSession,
  clearSavedIdentifier,
  getAccessToken,
  getStoredSession,
  getStoredUser,
  saveAuthSession,
  saveIdentifier,
  updateStoredUser,
  type AuthResponse,
  type AuthUser,
} from './auth-session'
import { setLocale, type LocaleCode } from '../composables/useLocale'
import { usersApi } from './users'
import { logError } from '../utils/logError'

type LoginPayload = {
  identifier: string
  password: string
}

const authState = reactive({
  token: getAccessToken(),
  user: getStoredUser() as AuthUser | null,
  initialized: false,
})

let initializationPromise: Promise<void> | null = null

const syncStateFromStorage = () => {
  const session = getStoredSession()
  authState.token = session?.token ?? null
  authState.user = session?.user ?? null
}

const setAuthenticatedState = (session: AuthResponse) => {
  authState.token = session.token
  authState.user = session.user
  syncLocaleFromLanguage(session.user.language)
}

const syncLocaleFromLanguage = (language: string | null | undefined) => {
  if (language === 'en' || language === 'es' || language === 'pt') {
    setLocale(language)
  }
}

export const initializeAuth = async () => {
  syncStateFromStorage()

  if (authState.initialized) {
    return
  }

  if (!authState.token) {
    authState.initialized = true
    return
  }

  if (!initializationPromise) {
    initializationPromise = fetchCurrentUser()
      .then(() => undefined)
      .catch((err: unknown) => {
        // Clearing the session on a failed /auth/me is correct, but without
        // a report there is no way to tell an expired token apart from a
        // transient network outage.
        logError('auth.initializeAuth', err)
        clearSession()
      })
      .finally(() => {
        authState.initialized = true
        initializationPromise = null
      })
  }

  await initializationPromise
}

export const login = async (payload: LoginPayload, remember: boolean) => {
  const { data } = await api.post<AuthResponse>('/auth/login', { ...payload, rememberMe: remember })
  saveAuthSession(data, remember)
  setAuthenticatedState(data)
  authState.initialized = true
  if (remember) {
    saveIdentifier(payload.identifier)
  } else {
    clearSavedIdentifier()
  }
  return data
}

export const fetchCurrentUser = async () => {
  const { data } = await api.get<AuthUser>('/auth/me')
  authState.user = data
  updateStoredUser(data)
  syncLocaleFromLanguage(data.language)
  return data
}

export const setCurrentUser = (user: AuthUser) => {
  authState.user = user
  updateStoredUser(user)
  syncLocaleFromLanguage(user.language)
}

export const clearSession = () => {
  clearAuthSession()
  authState.token = null
  authState.user = null
  authState.initialized = true
}

export const handleUnauthorizedSession = (router: Router) => {
  const currentRoute = router.currentRoute.value
  clearSession()

  if (!currentRoute.meta.requiresAuth) return

  void router.replace({
    name: 'login',
    query: { redirect: currentRoute.fullPath },
  })
}

export const logout = () => {
  clearSession()
}

export const forgotPassword = async (email: string) => {
  await api.post('/auth/forgot-password', { email })
}

export const resetPassword = async (token: string, newPassword: string) => {
  await api.post('/auth/reset-password', { token, newPassword })
}

export const isAuthenticated = () => {
  syncStateFromStorage()
  return Boolean(authState.token)
}

export const useAuthState = () => readonly(authState)

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    return message ?? fallback
  }

  return fallback
}

export const changeLanguage = async (language: LocaleCode) => {
  setLocale(language)
  if (!authState.token) return

  try {
    const { data } = await usersApi.updateProfile({ language })
    setCurrentUser(data)
  } catch (err: unknown) {
    logError('auth.changeLanguage', err)
  }
}
