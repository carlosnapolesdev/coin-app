import type { LocationQuery, LocationQueryValue } from 'vue-router'
import type { TransactionStatus, TransactionType } from '../services/transactions'

export interface TransactionsQueryState {
  accountId: number | null
  q: string
  type: TransactionType | ''
  status: TransactionStatus | ''
  from: string
  to: string
  page: number
}

const TYPES: readonly TransactionType[] = ['INCOME', 'EXPENSE', 'TRANSFER']
const STATUSES: readonly TransactionStatus[] = ['PENDING', 'CLEARED', 'VOID']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const first = (value: LocationQueryValue | LocationQueryValue[] | undefined): string => {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw : ''
}

export function parseTransactionsQuery(query: LocationQuery): TransactionsQueryState {
  const type = first(query.type)
  const status = first(query.status)
  const from = first(query.from)
  const to = first(query.to)
  const account = Number(first(query.account))
  const page = Number(first(query.page))
  return {
    accountId: Number.isInteger(account) && account > 0 ? account : null,
    q: first(query.q),
    type: (TYPES as readonly string[]).includes(type) ? (type as TransactionType) : '',
    status: (STATUSES as readonly string[]).includes(status) ? (status as TransactionStatus) : '',
    from: DATE_RE.test(from) ? from : '',
    to: DATE_RE.test(to) ? to : '',
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

export function buildTransactionsQuery(state: TransactionsQueryState): Record<string, string> {
  const query: Record<string, string> = {}
  if (state.accountId) query.account = String(state.accountId)
  if (state.q) query.q = state.q
  if (state.type) query.type = state.type
  if (state.status) query.status = state.status
  if (state.from) query.from = state.from
  if (state.to) query.to = state.to
  if (state.page > 1) query.page = String(state.page)
  return query
}
