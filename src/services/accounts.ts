import api from './api'

export type AccountType = 'NO_TYPE' | 'BANK' | 'CASH' | 'ASSET' | 'CREDIT_CARD' | 'LIABILITY' | 'CHECKING' | 'SAVINGS'
export type AccountTemplate = 'NONE' | 'STANDARD_TRANSACTIONS' | 'INCOME_TRACKING' | 'EXPENSE_TRACKING'

export interface AccountDetail {
  id: number
  name: string
  institution: string | null
  type: AccountType
  accountNumber: string | null
  currencyId: number | null
  currencyCode: string | null
  currencySymbol: string | null
  groupName: string | null
  startBalance: number
  currentBalance: number
  notes: string | null
  icon: string | null
  closed: boolean
  active: boolean
  defaultTemplate: AccountTemplate
  excludeFromAccountSummary: boolean
  outlineIntoSummary: boolean
  excludeFromBudget: boolean
  excludeFromAnyReports: boolean
  overdraftAt: number
  maximumBalance: number
  checkbook1: number
  checkbook2: number
  createdAt: string
  updatedAt: string | null
}

export interface CreateAccountPayload {
  name: string
  institution?: string
  type?: AccountType
  accountNumber?: string
  currencyId?: number
  groupName?: string
  startBalance?: number
  notes?: string
  icon?: string
  closed?: boolean
  defaultTemplate?: AccountTemplate
  excludeFromAccountSummary?: boolean
  outlineIntoSummary?: boolean
  excludeFromBudget?: boolean
  excludeFromAnyReports?: boolean
  overdraftAt?: number
  maximumBalance?: number
  checkbook1?: number
  checkbook2?: number
}

export type UpdateAccountPayload = Partial<CreateAccountPayload & { active: boolean }>

export const accountsApi = {
  list: (includeInactive = false) =>
    api.get<AccountDetail[]>('/users/me/accounts', { params: { includeInactive } }),

  get: (id: number) =>
    api.get<AccountDetail>(`/users/me/accounts/${id}`),

  create: (data: CreateAccountPayload) =>
    api.post<AccountDetail>('/users/me/accounts', data),

  update: (id: number, data: UpdateAccountPayload) =>
    api.patch<AccountDetail>(`/users/me/accounts/${id}`, data),

  remove: (id: number) =>
    api.delete(`/users/me/accounts/${id}`),
}
