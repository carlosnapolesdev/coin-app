import api from './api'

export interface Reconciliation {
  id: number
  accountId: number
  statementDate: string
  statementBalance: number
  clearedBalance: number
  difference: number
  isCompleted: boolean
  completedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface ReconciliationSummary extends Reconciliation {
  clearedCount: number
  pendingCount: number
}

export interface OpenReconciliationPayload {
  statementDate: string
  statementBalance: number
}

export const reconciliationsApi = {
  open: (accountId: number, payload: OpenReconciliationPayload) =>
    api.post<Reconciliation>(
      `/users/me/accounts/${accountId}/reconciliations`,
      payload,
    ),

  getSummary: (accountId: number, reconciliationId: number) =>
    api.get<ReconciliationSummary>(
      `/users/me/accounts/${accountId}/reconciliations/${reconciliationId}`,
    ),

  complete: (accountId: number, reconciliationId: number) =>
    api.post<Reconciliation>(
      `/users/me/accounts/${accountId}/reconciliations/${reconciliationId}/complete`,
    ),
}
