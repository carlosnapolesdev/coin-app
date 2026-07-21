import { describe, expect, it } from 'vitest'
import { buildTransactionsQuery, parseTransactionsQuery } from './transactionsQuery'

describe('parseTransactionsQuery', () => {
  it('returns defaults for an empty query', () => {
    expect(parseTransactionsQuery({})).toEqual({
      accountId: null,
      q: '',
      type: '',
      status: '',
      from: '',
      to: '',
      page: 1,
    })
  })

  it('parses valid params', () => {
    expect(
      parseTransactionsQuery({
        account: '5',
        q: 'coffee',
        type: 'EXPENSE',
        status: 'CLEARED',
        from: '2026-07-01',
        to: '2026-07-31',
        page: '3',
      }),
    ).toEqual({
      accountId: 5,
      q: 'coffee',
      type: 'EXPENSE',
      status: 'CLEARED',
      from: '2026-07-01',
      to: '2026-07-31',
      page: 3,
    })
  })

  it('rejects invalid values instead of trusting the URL', () => {
    const state = parseTransactionsQuery({
      account: '-2',
      type: 'HACK',
      status: 'NOPE',
      from: 'yesterday',
      to: '2026-7-1',
      page: '0',
    })
    expect(state).toEqual({ accountId: null, q: '', type: '', status: '', from: '', to: '', page: 1 })
  })

  it('takes the first value of repeated params', () => {
    expect(parseTransactionsQuery({ q: ['a', 'b'] }).q).toBe('a')
  })
})

describe('buildTransactionsQuery', () => {
  it('omits defaults so clean state means a clean URL', () => {
    expect(
      buildTransactionsQuery({ accountId: null, q: '', type: '', status: '', from: '', to: '', page: 1 }),
    ).toEqual({})
  })

  it('serializes active filters and non-first pages', () => {
    expect(
      buildTransactionsQuery({
        accountId: 5,
        q: 'coffee',
        type: 'EXPENSE',
        status: 'CLEARED',
        from: '2026-07-01',
        to: '2026-07-31',
        page: 3,
      }),
    ).toEqual({
      account: '5',
      q: 'coffee',
      type: 'EXPENSE',
      status: 'CLEARED',
      from: '2026-07-01',
      to: '2026-07-31',
      page: '3',
    })
  })

  it('round-trips through parse', () => {
    const state = {
      accountId: 9,
      q: 'rent',
      type: 'INCOME' as const,
      status: 'PENDING' as const,
      from: '2026-01-01',
      to: '2026-12-31',
      page: 2,
    }
    expect(parseTransactionsQuery(buildTransactionsQuery(state))).toEqual(state)
  })
})
