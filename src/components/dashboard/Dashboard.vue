<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import { AnimatedAmount, AppCard, AppSpinner, AppTabs, PageContainer, PageHeader } from '../ui'
import { accountsApi, type AccountDetail, type AccountType, type NetWorthSummary } from '../../services/accounts'
import { transactionsApi, type TransactionDetail } from '../../services/transactions'
import { budgetsApi, type BudgetDetail } from '../../services/budgets'
import { formatCurrency, formatDate as formatDateLocale, formatMonthYear } from '../../utils/format'

const router = useRouter()
const { t } = useI18n()

const activeTopTab = ref<'accounts' | 'balances'>('accounts')

const accounts = ref<AccountDetail[]>([])
const isLoadingAccounts = ref(false)
const netWorth = ref<NetWorthSummary | null>(null)

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
  const abs = formatCurrency(Math.abs(account.currentBalance))
  return account.currentBalance >= 0 ? `+${symbol}${abs}` : `-${symbol}${abs}`
}

const budgets = ref<BudgetDetail[]>([])
const isLoadingBudgets = ref(false)

const topBudgets = computed(() =>
  [...budgets.value].sort((a, b) => b.percentUsed - a.percentUsed).slice(0, 4),
)

const budgetBarClass = (percentUsed: number): string => {
  if (percentUsed > 100) return 'bg-danger'
  if (percentUsed >= 80) return 'bg-warning'
  return 'bg-success'
}

const goToBudgets = () => router.push({ name: 'budgets' })

onMounted(async () => {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  isLoadingAccounts.value = true
  isLoadingChart.value = true
  isLoadingBudgets.value = true

  const [accountsRes, txRes, budgetsRes, netWorthRes] = await Promise.allSettled([
    accountsApi.list(),
    transactionsApi.list({ from, to }),
    budgetsApi.list(),
    accountsApi.summary(),
  ])

  if (accountsRes.status === 'fulfilled') accounts.value = accountsRes.value.data
  if (txRes.status === 'fulfilled') currentMonthTransactions.value = txRes.value.data
  if (budgetsRes.status === 'fulfilled') budgets.value = budgetsRes.value.data
  if (netWorthRes.status === 'fulfilled') netWorth.value = netWorthRes.value.data

  isLoadingAccounts.value = false
  isLoadingChart.value = false
  isLoadingBudgets.value = false
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

const currentMonthLabel = computed(() => formatMonthYear(new Date()))

const monthlyCategories = computed(() => {
  const map = new Map<string, number>()
  for (const tx of currentMonthTransactions.value) {
    if (tx.type !== 'EXPENSE') continue
    const label = tx.categoryName ?? t('common.uncategorized')
    map.set(label, (map.get(label) ?? 0) + tx.amount)
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

const formatMoney = formatCurrency

const formatDate = (dateStr: string) => formatDateLocale(dateStr, { month: 'short', day: 'numeric' })

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
      <PageHeader :title="t('dashboard.pageTitle')" :subtitle="t('dashboard.pageSubtitle', { month: currentMonthLabel })" />

      <PageContainer>
        <!-- Summary stats -->
        <section class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AppCard>
            <p class="field-label">{{ t('dashboard.stats.accountsLabel') }}</p>
            <p class="mt-2 text-3xl font-bold text-content">{{ accounts.length }}</p>
            <p class="mt-1 text-sm text-muted">{{ t('dashboard.stats.accountsDesc') }}</p>
          </AppCard>
          <AppCard>
            <p class="field-label">{{ t('dashboard.stats.incomeLabel', { month: currentMonthLabel }) }}</p>
            <AnimatedAmount class="mt-2 block" :value="monthlyIncome" />
            <p class="mt-1 text-sm text-muted">{{ t('dashboard.stats.incomeDesc') }}</p>
          </AppCard>
          <AppCard>
            <p class="field-label">{{ t('dashboard.stats.spendingLabel', { month: currentMonthLabel }) }}</p>
            <AnimatedAmount class="mt-2 block" :value="-totalMonthly" />
            <p class="mt-1 text-sm text-muted">{{ t('dashboard.stats.spendingDesc', { count: monthlyCategories.length }) }}</p>
          </AppCard>
        </section>

        <!-- Accounts / Spending -->
        <section class="grid gap-6 lg:grid-cols-3">
          <!-- Accounts & balances -->
          <AppCard padding="none" class="flex flex-col lg:col-span-1">
            <div class="border-b border-line p-3">
              <AppTabs
                v-model="activeTopTab"
                :tabs="[{ value: 'accounts', label: t('dashboard.tabs.accounts') }, { value: 'balances', label: t('dashboard.tabs.balances') }]"
              />
            </div>

            <div class="max-h-[320px] flex-1 overflow-y-auto p-3">
              <div v-if="isLoadingAccounts" class="flex items-center justify-center py-10 text-faint">
                <AppSpinner size="md" />
              </div>

              <!-- Accounts -->
              <template v-else-if="activeTopTab === 'accounts'">
                <p v-if="accounts.length === 0" class="py-10 text-center text-sm text-muted">{{ t('dashboard.accountsPanel.empty') }}</p>
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
                <div v-if="netWorth" class="mb-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                  <p class="text-xs font-semibold uppercase tracking-wide text-faint">{{ t('dashboard.balancesPanel.netWorth') }}</p>
                  <p class="mt-1 text-lg font-bold text-content">
                    {{ netWorth.baseCurrencyCode ?? '' }} {{ formatMoney(netWorth.totalInBase) }}
                  </p>
                  <p v-if="netWorth.unconvertibleCurrencies.length" class="mt-1 text-xs text-muted">
                    {{ t('dashboard.balancesPanel.missingRateHint', { currencies: netWorth.unconvertibleCurrencies.join(', ') }) }}
                  </p>
                </div>
                <p v-if="balancesByCurrency.length === 0" class="py-10 text-center text-sm text-muted">{{ t('dashboard.balancesPanel.empty') }}</p>
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
              <h2 class="font-display text-sm font-bold text-content">{{ t('dashboard.chart.title') }}</h2>
              <span class="text-xs font-semibold uppercase tracking-wide text-faint">{{ currentMonthLabel }}</span>
            </div>

            <div class="flex flex-1 items-center gap-8">
              <div v-if="isLoadingChart" class="flex flex-1 items-center justify-center py-10 text-faint">
                <AppSpinner size="md" />
              </div>

              <p v-else-if="monthlyCategories.length === 0" class="flex-1 py-10 text-center text-sm text-muted">
                {{ t('dashboard.chart.empty') }}
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
                    <span class="text-[10px] font-semibold uppercase tracking-wide text-faint">{{ t('dashboard.chart.total') }}</span>
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

        <!-- Budgets -->
        <AppCard padding="none">
          <div class="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 class="font-display text-sm font-bold text-content">{{ t('dashboard.budgetsSection.title') }}</h2>
            <button class="text-sm font-semibold text-primary hover:underline" @click="goToBudgets">{{ t('common.viewAll') }}</button>
          </div>

          <div v-if="isLoadingBudgets" class="flex items-center justify-center py-16 text-faint">
            <AppSpinner size="md" />
          </div>

          <div v-else-if="topBudgets.length === 0" class="px-6 py-16 text-center">
            <span class="material-symbols-outlined mb-2 text-4xl text-faint">pie_chart</span>
            <p class="text-sm text-muted">{{ t('dashboard.budgetsSection.empty') }}</p>
          </div>

          <div v-else class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="budget in topBudgets" :key="budget.id" class="min-w-0">
              <div class="flex items-baseline justify-between gap-2">
                <span class="truncate text-sm font-semibold text-content">{{ budget.categoryName ?? t('common.uncategorized') }}</span>
                <span class="shrink-0 text-xs text-muted">{{ budget.percentUsed }}%</span>
              </div>
              <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  class="h-1.5 rounded-full transition-all"
                  :class="budgetBarClass(budget.percentUsed)"
                  :style="{ width: Math.min(budget.percentUsed, 100) + '%' }"
                />
              </div>
              <p class="mt-1 text-xs text-muted">{{ t('dashboard.budgetsSection.spentOfAmount', { spent: formatMoney(budget.spent), amount: formatMoney(budget.amount) }) }}</p>
            </div>
          </div>
        </AppCard>

        <!-- Recent transactions -->
        <AppCard padding="none">
          <div class="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 class="font-display text-sm font-bold text-content">{{ t('dashboard.recentTransactions.title') }}</h2>
            <button class="text-sm font-semibold text-primary hover:underline" @click="goToTransactions">{{ t('common.viewAll') }}</button>
          </div>

          <div v-if="isLoadingChart" class="flex items-center justify-center py-16 text-faint">
            <AppSpinner size="md" />
          </div>

          <div v-else-if="recentTransactions.length === 0" class="px-6 py-16 text-center">
            <span class="material-symbols-outlined mb-2 text-4xl text-faint">receipt_long</span>
            <p class="text-sm text-muted">{{ t('dashboard.recentTransactions.empty') }}</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[640px] text-left">
              <thead class="border-b border-line">
                <tr>
                  <th class="data-th w-12"></th>
                  <th class="data-th">{{ t('dashboard.recentTransactions.columns.payee') }}</th>
                  <th class="data-th">{{ t('dashboard.recentTransactions.columns.category') }}</th>
                  <th class="data-th">{{ t('dashboard.recentTransactions.columns.account') }}</th>
                  <th class="data-th">{{ t('dashboard.recentTransactions.columns.date') }}</th>
                  <th class="data-th text-right">{{ t('dashboard.recentTransactions.columns.amount') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                <tr v-for="tx in recentTransactions" :key="tx.id" class="transition-colors hover:bg-surface-2">
                  <td class="px-6 py-3">
                    <div
                      class="icon-tile size-9"
                      :class="tx.type === 'INCOME' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'"
                    >
                      <span class="material-symbols-outlined text-[18px]">{{ tx.type === 'INCOME' ? 'call_received' : 'call_made' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-3 text-sm font-semibold text-content">{{ tx.payee || tx.categoryName || t('common.transactionFallback') }}</td>
                  <td class="px-6 py-3 text-sm text-muted">{{ tx.categoryName || '—' }}</td>
                  <td class="px-6 py-3 text-sm text-muted">{{ tx.accountName }}</td>
                  <td class="px-6 py-3 text-sm text-faint">{{ formatDate(tx.effectiveDate) }}</td>
                  <td class="px-6 py-3 text-right text-sm font-bold tabular-nums" :class="tx.type === 'INCOME' ? 'text-success' : 'text-danger'">
                    {{ tx.type === 'INCOME' ? '+' : '-' }}{{ formatMoney(tx.amount) }}
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
