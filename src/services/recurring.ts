import api from './api'
import type { TransactionDetail, TransactionType } from './transactions'

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurringDetail {
  id: number
  accountId: number
  accountName: string | null
  categoryId: number | null
  categoryName: string | null
  destinationAccountId: number | null
  destinationAccountName: string | null
  type: TransactionType
  amount: number
  frequency: RecurrenceFrequency
  interval: number
  nextRunDate: string
  lastRunDate: string | null
  endDate: string | null
  payee: string | null
  memo: string | null
  tags: string | null
  isActive: boolean
}

export interface CreateRecurringPayload {
  accountId: number
  categoryId?: number
  destinationAccountId?: number
  type: TransactionType
  amount: number
  frequency: RecurrenceFrequency
  interval?: number
  startDate: string
  endDate?: string
  payee?: string
  memo?: string
  tags?: string
}

export type UpdateRecurringPayload = Partial<CreateRecurringPayload> & { isActive?: boolean }

export const recurringApi = {
  list: () => api.get<RecurringDetail[]>('/users/me/recurring'),
  create: (data: CreateRecurringPayload) => api.post<RecurringDetail>('/users/me/recurring', data),
  update: (id: number, data: UpdateRecurringPayload) => api.patch<RecurringDetail>(`/users/me/recurring/${id}`, data),
  remove: (id: number) => api.delete(`/users/me/recurring/${id}`),
  runNow: (id: number) => api.post<TransactionDetail>(`/users/me/recurring/${id}/run`),
}
