<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from './Sidebar.vue'
import { AnimatedAmount, AppCard, AppSpinner, PageContainer, PageHeader } from '../ui'
import { accountsApi, type AccountDetail, type AccountType } from '../../services/accounts'
import { transactionsApi, type TransactionDetail } from '../../services/transactions'

const router = useRouter()

const activeTopTab = ref<'accounts' | 'balances'>('accounts')

const accounts = ref<AccountDetail[]>([])
const isLoadingAccounts = ref(false)

const typeIconMap: Record<AccountType, string> = {
  BANK: 'account_balance',
  CASH: 'payments',
  ASSET: 'home',
  CREDIT_CARD: 'credit_card',
  LIABILITY: 'money_off',
  CHECKING: 'account_balance',
  SAVINGS: 'savings',
  NO_TYPE: 'account_balance_wallet',
}

const accountIcon = (account: AccountDetail): string =>
  account.icon ?? typeIconMap[account.type] ?? 'account_balance_wallet'

const formatBalance = (account: AccountDetail): string => {
  const symbol = account.currencySymbol ?? '$'
  const abs = Math.abs(account.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return account.currentBalance >= 0 ? `+${symbol}${abs}` : `-${symbol}${abs}`
}

onMounted(async () => {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  isLoadingAccounts.value = true
  isLoadingChart.value = true

  const [accountsRes, txRes] = await Promise.allSettled([
    accountsApi.list(),
    transactionsApi.list({ from, to }),
  ])

  if (accountsRes.status === 'fulfilled') accounts.value = accountsRes.value.data
  if (txRes.status === 'fulfilled') currentMonthTransactions.value = txRes.value.data

  isLoadingAccounts.value = false
  isLoadingChart.value = false
})

const balancesByCurrency = computed(() => {
  const map = new Map<string, { code: string; symbol: string; net: number }>()
  for (const account of accounts.value) {
    const code = account.currencyCode ?? 'N/A'
    const symbol = account.currencySymbol ?? ''
    const entry = map.get(code) ?? { code, symbol, net: 0 }
    entry.net += account.currentBalance
    map.set(code, entry)
  }
  return Array.from(map.values())
})

const CHART_COLORS = ['#6366f1', '#0ea5e9', '#a855f7', '#10b981', '#f43f5e', '#14b8a6', '#f59e0b', '#64748b']

const currentMonthTransactions = ref<TransactionDetail[]>([])
const isLoadingChart = ref(false)

const currentMonthLabel = computed(() => {
  const now = new Date()
  return now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
})

const monthlyCategories = computed(() => {
  const map = new Map<string, number>()
  for (const t of currentMonthTransactions.value) {
    if (t.type !== 'EXPENSE') continue
    const label = t.categoryName ?? 'Uncategorized'
    map.set(label, (map.get(label) ?? 0) + t.amount)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount], i) => ({ label, amount, color: CHART_COLORS[i % CHART_COLORS.length] }))
})

const totalMonthly = computed(() => monthlyCategories.value.reduce((s, c) => s + c.amount, 0))

const chartSegments = computed(() => {
  let offset = 0
  return monthlyCategories.value.map(cat => {
    const pct = totalMonthly.value > 0 ? (cat.amount / totalMonthly.value) * 100 : 0
    const seg = { ...cat, pct, offset }
    offset += pct
    return seg
  })
})

const monthlyIncome = computed(() =>
  currentMonthTransactions.value.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
)

const formatMoney = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Recent activity is derived from real data — no mock rows.
const recentTransactions = computed(() =>
  [...currentMonthTransactions.value]
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : a.effectiveDate > b.effectiveDate ? -1 : b.id - a.id))
    .slice(0, 8),
)

const goToTransactions = () => router.push({ name: 'transactions' })
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-bg">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <PageHeader title="Dashboard" :subtitle="`Overview · ${currentMonthLabel}`" />

      <PageContainer>
        <!-- Summary stats -->
        <section class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AppCard>
            <p class="field-label">Accounts</p>
            <p class="mt-2 text-3xl font-bold text-content">{{ accounts.length }}</p>
            <p class="mt-1 text-sm text-muted">Tracked across your portfolio</p>
          </AppCard>
          <AppCard>
            <p class="field-label">Income · {{ currentMonthLabel }}</p>
            <AnimatedAmount class="mt-2 block" :value="monthlyIncome" />
            <p class="mt-1 text-sm text-muted">Received this month</p>
          </AppCard>
          <AppCard>
            <p class="field-label">Spending · {{ currentMonthLabel }}</p>
            <AnimatedAmount class="mt-2 block" :value="-totalMonthly" />
            <p class="mt-1 text-sm text-muted">Across {{ monthlyCategories.length }} categories</p>
          </AppCard>
        </section>

        <!-- Accounts / Spending -->
        <section class="grid gap-6 lg:grid-cols-3">
          <!-- Accounts & balances -->
          <AppCard padding="none" class="flex flex-col lg:col-span-1">
            <div class="flex gap-1 border-b border-line px-4 pt-4">
              <button
                v-for="tab in (['accounts', 'balances'] as const)"
                :key="tab"
                class="border-b-2 px-3 py-2.5 text-sm font-semibold capitalize transition-colors"
                :class="activeTopTab === tab
                  ? 'border-primary text-content'
                  : 'border-transparent text-muted hover:text-content'"
                @click="activeTopTab = tab"
              >
                {{ tab }}
              </button>
            </div>

            <div class="max-h-[320px] flex-1 overflow-y-auto p-3">
              <div v-if="isLoadingAccounts" class="flex items-center justify-center py-10 text-faint">
                <AppSpinner size="md" />
              </div>

              <!-- Accounts -->
              <template v-else-if="activeTopTab === 'accounts'">
                <p v-if="accounts.length === 0" class="py-10 text-center text-sm text-muted">No accounts found</p>
                <div
                  v-for="account in accounts"
                  :key="account.id"
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <div class="icon-tile size-9 bg-surface-2 text-muted">
                    <span class="material-symbols-outlined text-[18px]">{{ accountIcon(account) }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-content">{{ account.name }}</p>
                    <p class="truncate text-xs text-muted">{{ account.institution ?? '—' }}</p>
                  </div>
                  <span class="shrink-0 text-sm font-semibold" :class="account.currentBalance >= 0 ? 'text-success' : 'text-danger'">
                    {{ formatBalance(account) }}
                  </span>
                </div>
              </template>

              <!-- Balances -->
              <template v-else>
                <p v-if="balancesByCurrency.length === 0" class="py-10 text-center text-sm text-muted">No data</p>
                <div
                  v-for="row in balancesByCurrency"
                  :key="row.code"
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <div class="icon-tile size-9 bg-surface-2">
                    <span class="text-[11px] font-bold uppercase text-muted">{{ row.code }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-content">{{ row.code }}</p>
                  </div>
                  <span class="shrink-0 text-sm font-semibold" :class="row.net >= 0 ? 'text-success' : 'text-danger'">
                    {{ row.net >= 0 ? '+' : '-' }}{{ row.symbol }}{{ formatMoney(Math.abs(row.net)) }}
                  </span>
                </div>
              </template>
            </div>
          </AppCard>

          <!-- Monthly spending chart -->
          <AppCard class="flex flex-col lg:col-span-2">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="font-display text-sm font-bold text-content">Monthly Spending by Category</h2>
              <span class="text-xs font-semibold uppercase tracking-wide text-faint">{{ currentMonthLabel }}</span>
            </div>

            <div class="flex flex-1 items-center gap-8">
              <div v-if="isLoadingChart" class="flex flex-1 items-center justify-center py-10 text-faint">
                <AppSpinner size="md" />
              </div>

              <p v-else-if="monthlyCategories.length === 0" class="flex-1 py-10 text-center text-sm text-muted">
                No expenses recorded this month
              </p>

              <template v-else>
                <!-- Donut -->
                <div class="relative shrink-0" style="width: 120px; height: 120px">
                  <svg class="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      class="text-line"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" stroke-width="3.5"
                    />
                    <path
                      v-for="seg in chartSegments"
                      :key="seg.label"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      :stroke="seg.color"
                      :stroke-dasharray="`${seg.pct} ${100 - seg.pct}`"
                      :stroke-dashoffset="`-${seg.offset}`"
                      stroke-width="3.5"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-[10px] font-semibold uppercase tracking-wide text-faint">Total</span>
                    <span class="text-sm font-bold text-content">{{ formatMoney(totalMonthly) }}</span>
                  </div>
                </div>

                <!-- Breakdown -->
                <div class="grid flex-1 grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  <div v-for="seg in chartSegments" :key="seg.label" class="flex items-center gap-2">
                    <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: seg.color }" />
                    <div class="min-w-0 flex-1">
                      <div class="flex items-baseline justify-between gap-2">
                        <span class="truncate text-sm font-semibold text-content">{{ seg.label }}</span>
                        <span class="shrink-0 text-xs text-muted">{{ formatMoney(seg.amount) }}</span>
                      </div>
                      <div class="mt-1 h-1.5 w-full rounded-full bg-surface-2">
                        <div class="h-1.5 rounded-full" :style="{ width: seg.pct + '%', backgroundColor: seg.color }" />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </AppCard>
        </section>

        <!-- Recent transactions -->
        <AppCard padding="none">
          <div class="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 class="font-display text-sm font-bold text-content">Recent Transactions</h2>
            <button class="text-sm font-semibold text-primary hover:underline" @click="goToTransactions">View all</button>
          </div>

          <div v-if="isLoadingChart" class="flex items-center justify-center py-16 text-faint">
            <AppSpinner size="md" />
          </div>

          <div v-else-if="recentTransactions.length === 0" class="px-6 py-16 text-center">
            <span class="material-symbols-outlined mb-2 text-4xl text-faint">receipt_long</span>
            <p class="text-sm text-muted">No transactions this month yet</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[640px] text-left">
              <thead class="border-b border-line">
                <tr>
                  <th class="data-th w-12"></th>
                  <th class="data-th">Payee</th>
                  <th class="data-th">Category</th>
                  <th class="data-th">Account</th>
                  <th class="data-th">Date</th>
                  <th class="data-th text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                <tr v-for="t in recentTransactions" :key="t.id" class="transition-colors hover:bg-surface-2">
                  <td class="px-6 py-3">
                    <div
                      class="icon-tile size-9"
                      :class="t.type === 'INCOME' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'"
                    >
                      <span class="material-symbols-outlined text-[18px]">{{ t.type === 'INCOME' ? 'call_received' : 'call_made' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-3 text-sm font-semibold text-content">{{ t.payee || t.categoryName || 'Transaction' }}</td>
                  <td class="px-6 py-3 text-sm text-muted">{{ t.categoryName || '—' }}</td>
                  <td class="px-6 py-3 text-sm text-muted">{{ t.accountName }}</td>
                  <td class="px-6 py-3 text-sm text-faint">{{ formatDate(t.effectiveDate) }}</td>
                  <td class="px-6 py-3 text-right text-sm font-bold tabular-nums" :class="t.type === 'INCOME' ? 'text-success' : 'text-danger'">
                    {{ t.type === 'INCOME' ? '+' : '-' }}{{ formatMoney(t.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>
      </PageContainer>
    </main>
  </div>
</template>
