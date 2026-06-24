<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import { accountsApi, type AccountDetail, type AccountType } from '../../services/accounts'
import { transactionsApi, type TransactionDetail } from '../../services/transactions'

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
  const abs = Math.abs(account.startBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return account.startBalance >= 0 ? `+${symbol}${abs}` : `-${symbol}${abs}`
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
    entry.net += account.startBalance
    map.set(code, entry)
  }
  return Array.from(map.values())
})

const CHART_COLORS = ['#3b82f6', '#f59e0b', '#a855f7', '#2ecc70', '#ef4444', '#14b8a6', '#f97316', '#64748b']

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

const transactions = [
  { id: 1, name: 'Apple Store', date: 'May 28, 2024', category: 'Electronics', account: 'Credit Card', amount: '-$999.00', positive: false, icon: 'shopping_bag', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { id: 2, name: 'Green Bistro', date: 'May 27, 2024', category: 'Food & Dining', account: 'Credit Card', amount: '-$45.50', positive: false, icon: 'restaurant', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { id: 3, name: 'Uber Trip', date: 'May 26, 2024', category: 'Transport', account: 'Main Checking', amount: '-$18.20', positive: false, icon: 'directions_car', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  { id: 4, name: 'Monthly Salary', date: 'May 25, 2024', category: 'Income', account: 'Savings Account', amount: '+$4,200.00', positive: true, icon: 'payments', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { id: 5, name: 'Netflix Subscription', date: 'May 24, 2024', category: 'Entertainment', account: 'Credit Card', amount: '-$15.99', positive: false, icon: 'movie', iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  { id: 6, name: 'Amazon Purchase', date: 'May 23, 2024', category: 'Shopping', account: 'Credit Card', amount: '-$89.99', positive: false, icon: 'shopping_cart', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { id: 7, name: 'Gym Membership', date: 'May 22, 2024', category: 'Health', account: 'Main Checking', amount: '-$39.99', positive: false, icon: 'fitness_center', iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
  { id: 8, name: 'Freelance Payment', date: 'May 20, 2024', category: 'Income', account: 'Savings Account', amount: '+$750.00', positive: true, icon: 'work', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { id: 9, name: 'Electric Bill', date: 'May 19, 2024', category: 'Housing', account: 'Main Checking', amount: '-$95.00', positive: false, icon: 'bolt', iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600' },
  { id: 10, name: 'Coffee Shop', date: 'May 18, 2024', category: 'Food & Dining', account: 'Main Checking', amount: '-$8.50', positive: false, icon: 'local_cafe', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
]
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <Sidebar />

    <main class="flex-1 flex flex-col overflow-hidden">

      <!-- ─── Top Row: 1/3 height ──────────────────────────────────────── -->
      <div class="flex h-1/3 min-h-0">

        <!-- Left Column: 1/4 width — Tabs -->
        <div class="w-1/4 flex flex-col min-w-0 bg-white dark:bg-zinc-900">

          <!-- Tab headers -->
          <div class="flex border-b border-slate-100 dark:border-zinc-800 px-4 pt-4 shrink-0">
            <button
              class="px-4 py-3 border-b-2 transition-all text-xs font-black tracking-widest uppercase"
              :class="activeTopTab === 'accounts'
                ? 'border-primary text-slate-900 dark:text-white'
                : 'border-transparent text-slate-400 hover:text-primary'"
              @click="activeTopTab = 'accounts'"
            >Accounts</button>
            <button
              class="px-4 py-3 border-b-2 transition-all text-xs font-black tracking-widest uppercase"
              :class="activeTopTab === 'balances'
                ? 'border-primary text-slate-900 dark:text-white'
                : 'border-transparent text-slate-400 hover:text-primary'"
              @click="activeTopTab = 'balances'"
            >Balances</button>
          </div>

          <!-- Tab content -->
          <div class="flex-1 overflow-y-auto">

            <!-- Accounts grid -->
            <div v-if="activeTopTab === 'accounts'" class="p-3 flex flex-col gap-0.5">
              <div v-if="isLoadingAccounts" class="flex items-center justify-center py-6">
                <span class="material-symbols-outlined text-slate-300 dark:text-zinc-600 animate-spin text-[20px]">progress_activity</span>
              </div>
              <p v-else-if="accounts.length === 0" class="text-[10px] text-slate-400 text-center py-6">No accounts found</p>
              <div
                v-else
                v-for="account in accounts"
                :key="account.id"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-all group"
              >
                <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-slate-500 dark:text-zinc-400 text-[18px]">{{ accountIcon(account) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{{ account.name }}</p>
                  <p class="text-[10px] text-slate-400 uppercase tracking-wider truncate">{{ account.institution ?? '—' }}</p>
                </div>
                <span class="text-xs font-bold shrink-0" :class="account.startBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ formatBalance(account) }}
                </span>
              </div>
            </div>

            <!-- Balances by currency -->
            <div v-if="activeTopTab === 'balances'" class="p-3 flex flex-col gap-0.5">
              <div v-if="isLoadingAccounts" class="flex items-center justify-center py-6">
                <span class="material-symbols-outlined text-slate-300 dark:text-zinc-600 animate-spin text-[20px]">progress_activity</span>
              </div>
              <p v-else-if="balancesByCurrency.length === 0" class="text-[10px] text-slate-400 text-center py-6">No data</p>
              <div
                v-else
                v-for="row in balancesByCurrency"
                :key="row.code"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
              >
                <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <span class="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-tight">{{ row.code }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-900 dark:text-white">{{ row.code }}</p>
                </div>
                <span class="text-xs font-bold shrink-0" :class="row.net >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ row.net >= 0 ? '+' : '-' }}{{ row.symbol }}{{ Math.abs(row.net).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </span>
              </div>
            </div>

          </div>
        </div>

        <!-- Right Column: 3/4 width — Monthly Spending Chart -->
        <div class="flex-1 min-w-0 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden p-5 border-l border-slate-100 dark:border-zinc-800">
          <div class="flex justify-between items-center mb-3 shrink-0">
            <h4 class="font-bold text-sm text-slate-900 dark:text-white">Monthly Spending by Category</h4>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ currentMonthLabel }}</span>
          </div>

          <div class="flex-1 flex items-center gap-10 min-h-0 overflow-hidden">

            <!-- Loading -->
            <div v-if="isLoadingChart" class="flex-1 flex items-center justify-center">
              <span class="material-symbols-outlined text-slate-300 dark:text-zinc-600 animate-spin text-[20px]">progress_activity</span>
            </div>

            <!-- Empty state -->
            <p v-else-if="monthlyCategories.length === 0" class="flex-1 text-[10px] text-slate-400 text-center">
              No expenses recorded this month
            </p>

            <!-- Chart + breakdown -->
            <template v-else>
              <!-- Donut chart -->
              <div class="relative shrink-0" style="width: 100px; height: 100px">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    class="text-slate-100 dark:text-zinc-800"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" stroke-width="3.5"
                  ></path>
                  <path
                    v-for="seg in chartSegments"
                    :key="seg.label"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    :stroke="seg.color"
                    :stroke-dasharray="`${seg.pct} ${100 - seg.pct}`"
                    :stroke-dashoffset="`-${seg.offset}`"
                    stroke-width="3.5"
                  ></path>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-[8px] font-semibold text-slate-400">Total</span>
                  <span class="text-xs font-bold text-slate-900 dark:text-white">{{ totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                </div>
              </div>

              <!-- Category breakdown list -->
              <div class="flex-1 grid grid-cols-2 gap-x-8 gap-y-2.5 min-w-0">
                <div v-for="seg in chartSegments" :key="seg.label" class="flex items-center gap-2 min-w-0">
                  <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: seg.color }"></div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline">
                      <span class="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate">{{ seg.label }}</span>
                      <span class="text-[10px] text-slate-400 ml-1 shrink-0">{{ seg.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1 mt-0.5">
                      <div class="h-1 rounded-full" :style="{ width: seg.pct + '%', backgroundColor: seg.color }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

          </div>
        </div>
      </div>

      <!-- ─── Bottom Row: 2/3 height — Transactions Table ──────────────── -->
      <div class="flex-1 min-h-0 flex flex-col bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">

        <!-- Toolbar -->
        <div class="shrink-0 px-6 py-3 flex justify-between items-center border-b border-slate-100 dark:border-zinc-800">
          <h4 class="font-bold text-sm text-slate-900 dark:text-white">Transactions</h4>
          <button class="text-xs text-primary font-bold hover:underline">View All</button>
        </div>

        <!-- Scrollable table -->
        <div class="flex-1 overflow-auto">
          <table class="w-full text-left">
            <thead class="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
              <tr>
                <th class="px-6 py-2.5 w-12"></th>
                <th class="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                <th class="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th class="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Account</th>
                <th class="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                <th class="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-zinc-800">
              <tr
                v-for="t in transactions"
                :key="t.id"
                class="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
              >
                <td class="px-6 py-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="[t.iconBg, t.iconColor]">
                    <span class="material-symbols-outlined text-[16px]">{{ t.icon }}</span>
                  </div>
                </td>
                <td class="px-6 py-3">
                  <span class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{{ t.name }}</span>
                </td>
                <td class="px-6 py-3">
                  <span class="text-xs font-medium text-slate-500 dark:text-zinc-400">{{ t.category }}</span>
                </td>
                <td class="px-6 py-3">
                  <span class="text-xs font-medium text-slate-500 dark:text-zinc-400">{{ t.account }}</span>
                </td>
                <td class="px-6 py-3">
                  <span class="text-xs text-slate-400">{{ t.date }}</span>
                </td>
                <td class="px-6 py-3 text-right">
                  <span class="text-sm font-bold" :class="t.positive ? 'text-emerald-600' : 'text-rose-600'">{{ t.amount }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </main>
  </div>
</template>
