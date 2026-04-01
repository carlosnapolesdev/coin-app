import axios from 'axios'
import { reactive, readonly } from 'vue'
import api from './api'
import {
  clearAuthSession,
  getAccessToken,
  getStoredSession,
  getStoredUser,
  saveAuthSession,
  updateStoredUser,
  type AuthResponse,
  type AuthUser,
} from './auth-session'

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
      .catch(() => {
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
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  saveAuthSession(data, remember)
  setAuthenticatedState(data)
  authState.initialized = true
  return data
}

export const fetchCurrentUser = async () => {
  const { data } = await api.get<AuthUser>('/auth/me')
  authState.user = data
  updateStoredUser(data)
  return data
}

export const clearSession = () => {
  clearAuthSession()
  authState.token = null
  authState.user = null
  authState.initialized = true
}

export const logout = () => {
  clearSession()
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