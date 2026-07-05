import api from './api'

export interface GoalDetail {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  remaining: number
  percentComplete: number
  targetDate: string | null
  accountId: number | null
  accountName: string | null
  isAchieved: boolean
}

export interface CreateGoalPayload {
  name: string
  targetAmount: number
  targetDate?: string
  accountId?: number
}

export type UpdateGoalPayload = Partial<CreateGoalPayload> & { currentAmount?: number }

export const goalsApi = {
  list: () => api.get<GoalDetail[]>('/users/me/goals'),
  create: (data: CreateGoalPayload) => api.post<GoalDetail>('/users/me/goals', data),
  update: (id: number, data: UpdateGoalPayload) => api.patch<GoalDetail>(`/users/me/goals/${id}`, data),
  remove: (id: number) => api.delete(`/users/me/goals/${id}`),
}
