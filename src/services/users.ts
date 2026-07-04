import api from './api'
import type { AuthUser } from './auth-session'

export interface UpdateProfilePayload {
  fullName?: string
  language?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const usersApi = {
  updateProfile: (payload: UpdateProfilePayload) => api.patch<AuthUser>('/users/me', payload),
  changePassword: (payload: ChangePasswordPayload) => api.patch<void>('/users/me/password', payload),
}
