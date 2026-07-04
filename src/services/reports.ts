import api from './api'

export interface MonthlyPoint {
  month: string
  income: number
  expense: number
  net: number
}

export interface CategoryTotal {
  categoryId: number | null
  categoryName: string
  total: number
}

export interface NetWorthPoint {
  month: string
  balance: number
}

export interface ReportRangeParams {
  from?: string
  to?: string
}

export const reportsApi = {
  incomeExpense: (params?: ReportRangeParams) =>
    api.get<MonthlyPoint[]>('/users/me/reports/income-expense', { params }),
  categories: (params?: ReportRangeParams) =>
    api.get<CategoryTotal[]>('/users/me/reports/categories', { params }),
  netWorth: (params?: ReportRangeParams) =>
    api.get<NetWorthPoint[]>('/users/me/reports/net-worth', { params }),
}
