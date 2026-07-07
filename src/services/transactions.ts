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
  exchangeRate: number | null
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
  exchangeRate?: number
  effectiveDate: string
  payee?: string
  paymentMethod?: string
  memo?: string
  status?: TransactionStatus
  tags?: string
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface TransactionQuery {
  accountId?: number
  categoryId?: number
  type?: TransactionType
  status?: TransactionStatus
  from?: string
  to?: string
  minAmount?: number
  maxAmount?: number
  q?: string
  page?: number
  pageSize?: number
}

export interface ImportRow {
  line: number
  valid: boolean
  errors: string[]
  accountId?: number
  accountName?: string
  categoryId?: number
  categoryName?: string
  type?: TransactionType
  amount?: number
  effectiveDate?: string
  payee?: string
  paymentMethod?: string
  status?: TransactionStatus
  tags?: string
  memo?: string
}

export interface ImportError {
  line: number
  message: string
}

export interface ImportPreviewResult {
  rows: ImportRow[]
  errors: ImportError[]
}

export type ColumnMapping = Partial<Record<
  'date' | 'account' | 'category' | 'type' | 'amount' | 'payee' | 'paymentMethod' | 'status' | 'tags' | 'memo',
  string
>>

export const transactionsApi = {
  list: (params?: { accountId?: number; from?: string; to?: string }) =>
    api.get<TransactionDetail[]>('/users/me/transactions', { params }),

  search: (params: TransactionQuery) =>
    api.get<Paginated<TransactionDetail>>('/users/me/transactions/search', { params }),

  get: (id: number) =>
    api.get<TransactionDetail>(`/users/me/transactions/${id}`),

  create: (data: CreateTransactionPayload) =>
    api.post<TransactionDetail>('/users/me/transactions', data),

  update: (id: number, data: UpdateTransactionPayload) =>
    api.patch<TransactionDetail>(`/users/me/transactions/${id}`, data),

  remove: (id: number) =>
    api.delete(`/users/me/transactions/${id}`),

  exportCsv: (params: Omit<TransactionQuery, 'page' | 'pageSize'>) =>
    api.get<Blob>('/users/me/transactions/export', { params, responseType: 'blob' }),

  importPreview: (file: File, mapping?: ColumnMapping) => {
    const formData = new FormData()
    formData.append('file', file)
    if (mapping) formData.append('mapping', JSON.stringify(mapping))
    return api.post<ImportPreviewResult>('/users/me/transactions/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  importCommit: (rows: ImportRow[]) =>
    api.post<{ created: number }>('/users/me/transactions/import/commit', { rows }),
}
