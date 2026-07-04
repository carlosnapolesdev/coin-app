import api from './api'

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'
export type TransactionStatus = 'PENDING' | 'CLEARED' | 'VOID'

export interface TransactionDetail {
  id: number
  accountId: number
  accountName: string
  categoryId: number | null
  categoryName: string | null
  type: TransactionType
  amount: number
  effectiveDate: string
  payee: string | null
  paymentMethod: string | null
  memo: string | null
  status: TransactionStatus
  tags: string | null
  transferAccountId: number | null
  transferIn: boolean | null
  balance: number | null
  createdAt: string
  updatedAt: string | null
}

export interface CreateTransactionPayload {
  accountId: number
  categoryId?: number
  destinationAccountId?: number
  type: TransactionType
  amount: number
  effectiveDate: string
  payee?: string
  paymentMethod?: string
  memo?: string
  status?: TransactionStatus
  tags?: string
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>

export const transactionsApi = {
  list: (params?: { accountId?: number; from?: string; to?: string }) =>
    api.get<TransactionDetail[]>('/users/me/transactions', { params }),

  get: (id: number) =>
    api.get<TransactionDetail>(`/users/me/transactions/${id}`),

  create: (data: CreateTransactionPayload) =>
    api.post<TransactionDetail>('/users/me/transactions', data),

  update: (id: number, data: UpdateTransactionPayload) =>
    api.patch<TransactionDetail>(`/users/me/transactions/${id}`, data),

  remove: (id: number) =>
    api.delete(`/users/me/transactions/${id}`),
}
