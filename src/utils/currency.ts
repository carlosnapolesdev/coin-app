import type { TransactionDetail } from '../services/transactions'
import type { AccountDetail } from '../services/accounts'

export type CurrencyBucket = {
  code: string
  symbol: string
  amount: number
}

export function groupByCurrency(
  transactions: TransactionDetail[],
  accounts: AccountDetail[],
  type: 'INCOME' | 'EXPENSE',
): CurrencyBucket[] {
  const accountCurrency = new Map<number, { code: string; symbol: string }>()
  for (const a of accounts) {
    accountCurrency.set(a.id, {
      code: a.currencyCode ?? 'N/A',
      symbol: a.currencySymbol ?? '',
    })
  }

  const buckets = new Map<string, CurrencyBucket>()
  for (const tx of transactions) {
    if (tx.type !== type) continue
    const cur = accountCurrency.get(tx.accountId)
    const code = cur?.code ?? 'N/A'
    const symbol = cur?.symbol ?? ''
    const existing = buckets.get(code) ?? { code, symbol, amount: 0 }
    existing.amount += tx.amount
    buckets.set(code, existing)
  }

  return [...buckets.values()].sort(
    (a, b) => b.amount - a.amount || a.code.localeCompare(b.code),
  )
}
