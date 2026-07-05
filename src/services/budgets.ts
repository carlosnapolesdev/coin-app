import api from './api'

export interface BudgetDetail {
  id: number
  categoryId: number
  categoryName: string | null
  amount: number
  period: string
  startDate: string
  spent: number
  remaining: number
  percentUsed: number
  active: boolean
}

export interface CreateBudgetPayload {
  categoryId: number
  amount: number
  period?: string
  startDate?: string
}

export type UpdateBudgetPayload = Partial<CreateBudgetPayload> & { active?: boolean }

export const budgetsApi = {
  list: () => api.get<BudgetDetail[]>('/users/me/budgets'),
  create: (data: CreateBudgetPayload) => api.post<BudgetDetail>('/users/me/budgets', data),
  update: (id: number, data: UpdateBudgetPayload) => api.patch<BudgetDetail>(`/users/me/budgets/${id}`, data),
  remove: (id: number) => api.delete(`/users/me/budgets/${id}`),
}
