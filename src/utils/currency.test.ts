import { describe, expect, it } from 'vitest'
import { groupByCurrency } from './currency'
import type { TransactionDetail } from '../services/transactions'
import type { AccountDetail } from '../services/accounts'

const tx = (overrides: Partial<TransactionDetail>): TransactionDetail => ({
  id: 1,
  accountId: 1,
  accountName: 'A',
  categoryId: null,
  categoryName: null,
  type: 'INCOME',
  amount: 0,
  effectiveDate: '2026-07-01',
  payee: null,
  paymentMethod: null,
  memo: null,
  status: 'CLEARED',
  tags: null,
  transferAccountId: null,
  transferIn: null,
  exchangeRate: null,
  balance: null,
  createdAt: '2026-07-01',
  updatedAt: null,
  ...overrides,
})

const acc = (overrides: Partial<AccountDetail> = {}): AccountDetail => ({
  id: 1,
  name: 'A',
  institution: null,
  type: 'NO_TYPE',
  accountNumber: null,
  currencyId: 1,
  currencyCode: 'USD',
  currencySymbol: '$',
  groupName: null,
  startBalance: 0,
  currentBalance: 0,
  notes: null,
  icon: null,
  closed: false,
  active: true,
  defaultTemplate: 'NONE',
  excludeFromAccountSummary: false,
  outlineIntoSummary: false,
  excludeFromBudget: false,
  excludeFromAnyReports: false,
  overdraftAt: 0,
  maximumBalance: 0,
  checkbook1: 0,
  checkbook2: 0,
  createdAt: '2026-07-01',
  updatedAt: null,
  ...overrides,
})

describe('groupByCurrency', () => {
  it('returns one bucket when all transactions share a currency', () => {
    const result = groupByCurrency(
      [tx({ amount: 100 }), tx({ amount: 200, id: 2 })],
      [acc({ id: 1 })],
      'INCOME',
    )
    expect(result).toEqual([{ code: 'USD', symbol: '$', amount: 300 }])
  })

  it('groups by account currency, summing amounts, dominant first', () => {
    const result = groupByCurrency(
      [
        tx({ amount: 100, accountId: 1 }),
        tx({ amount: 45000, accountId: 2, id: 2 }),
        tx({ amount: 50, accountId: 1, id: 3 }),
      ],
      [acc({ id: 1 }), acc({ id: 2, currencyCode: 'UYU', currencySymbol: '$U' })],
      'INCOME',
    )
    expect(result).toEqual([
      { code: 'UYU', symbol: '$U', amount: 45000 },
      { code: 'USD', symbol: '$', amount: 150 },
    ])
  })

  it('breaks ties by code ascending', () => {
    const result = groupByCurrency(
      [
        tx({ amount: 100, accountId: 1 }),
        tx({ amount: 100, accountId: 2, id: 2 }),
      ],
      [
        acc({ id: 1, currencyCode: 'USD' }),
        acc({ id: 2, currencyCode: 'EUR', currencySymbol: '€' }),
      ],
      'INCOME',
    )
    expect(result.map((b) => b.code)).toEqual(['EUR', 'USD'])
  })

  it('falls back to N/A when the transaction references a missing account', () => {
    const result = groupByCurrency(
      [tx({ accountId: 999, amount: 50 })],
      [acc({ id: 1 })],
      'INCOME',
    )
    expect(result).toEqual([{ code: 'N/A', symbol: '', amount: 50 }])
  })

  it('falls back to N/A with empty symbol when account currency is null', () => {
    const result = groupByCurrency(
      [tx({ amount: 50 })],
      [acc({ currencyCode: null, currencySymbol: null })],
      'INCOME',
    )
    expect(result).toEqual([{ code: 'N/A', symbol: '', amount: 50 }])
  })

  it('falls back to currencyCode as symbol when currencySymbol is null', () => {
    const result = groupByCurrency(
      [tx({ amount: 50 })],
      [acc({ currencyCode: 'USD', currencySymbol: null })],
      'INCOME',
    )
    expect(result).toEqual([{ code: 'USD', symbol: 'USD', amount: 50 }])
  })

  it('excludes transactions of other types (EXPENSE / TRANSFER)', () => {
    const result = groupByCurrency(
      [
        tx({ type: 'EXPENSE', amount: 50 }),
        tx({ type: 'TRANSFER', amount: 999, id: 2 }),
        tx({ type: 'INCOME', amount: 200, id: 3 }),
      ],
      [acc()],
      'INCOME',
    )
    expect(result).toEqual([{ code: 'USD', symbol: '$', amount: 200 }])
  })

  it('returns an empty array when no transactions match the requested type', () => {
    const result = groupByCurrency([tx({ type: 'EXPENSE', amount: 50 })], [acc()], 'INCOME')
    expect(result).toEqual([])
  })
})
