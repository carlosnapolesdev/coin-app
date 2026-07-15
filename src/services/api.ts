import axios from 'axios'

import { clearAuthSession, getAccessToken } from './auth-session'

type UnauthorizedHandler = () => void

const defaultUnauthorizedHandler: UnauthorizedHandler = () => {
  clearAuthSession()
}

let unauthorizedHandler = defaultUnauthorizedHandler

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  unauthorizedHandler = handler ?? defaultUnauthorizedHandler
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isRejectedLogin =
      error.config?.url === '/auth/login' &&
      error.config?.method?.toLowerCase() === 'post'

    if (error.response?.status === 401 && !isRejectedLogin) {
      unauthorizedHandler()
    }

    return Promise.reject(error)
  },
)

export default api
