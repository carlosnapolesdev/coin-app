import api from './api'

export type NotificationType = 'BUDGET_EXCEEDED' | 'LOW_BALANCE' | 'UPCOMING_PAYMENT'

export interface NotificationItem {
  id: number
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string | null
}

export const notificationsApi = {
  list: (unread = false) =>
    api.get<NotificationItem[]>(
      unread ? '/users/me/notifications?unread=true' : '/users/me/notifications',
    ),
  markRead: (id: number) =>
    api.patch<NotificationItem>(`/users/me/notifications/${id}/read`),
  markAllRead: () =>
    api.post<{ updated: number }>('/users/me/notifications/read-all'),
}
