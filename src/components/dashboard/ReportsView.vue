<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Sidebar from './Sidebar.vue'
import { AppButton, AppCard, AppInput, AppSpinner, AppTabs, PageContainer, PageHeader } from '../ui'
import {
  reportsApi,
  type MonthlyPoint,
  type CategoryTotal,
  type NetWorthPoint,
} from '../../services/reports'
import { chartSeriesColor } from '../../utils/chartColors'

type RangePreset = 'thisMonth' | '3m' | '6m' | '12m' | 'custom'

const rangePreset = ref<RangePreset>('6m')
const customFrom = ref('')
const customTo = ref('')

const isLoading = ref(false)
const error = ref('')

const monthlyPoints = ref<MonthlyPoint[]>([])
const categoryTotals = ref<CategoryTotal[]>([])
const netWorthPoints = ref<NetWorthPoint[]>([])

const toISODate = (d: Date): string => d.toISOString().slice(0, 10)

const resolvedRange = computed<{ from: string; to: string }>(() => {
  const now = new Date()
  const to = toISODate(now)
  const firstOfMonth = (monthsAgo: number) => toISODate(new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1))
  switch (rangePreset.value) {
    case 'thisMonth':
      return { from: firstOfMonth(0), to }
    case '3m':
      return { from: firstOfMonth(2), to }
    case '12m':
      return { from: firstOfMonth(11), to }
    case 'custom':
      return { from: customFrom.value || firstOfMonth(11), to: customTo.value || to }
    case '6m':
    default:
      return { from: firstOfMonth(5), to }
  }
})

const loadReports = async () => {
  isLoading.value = true
  error.value = ''
  const { from, to } = resolvedRange.value
  const [ieRes, catRes, nwRes] = await Promise.allSettled([
    reportsApi.incomeExpense({ from, to }),
    reportsApi.categories({ from, to }),
    reportsApi.netWorth({ from, to }),
  ])

  if (ieRes.status === 'fulfilled') {
    monthlyPoints.value = ieRes.value.data
  } else {
    error.value = 'Failed to load reports.'
  }
  categoryTotals.value = catRes.status === 'fulfilled' ? catRes.value.data : []
  netWorthPoints.value = nwRes.status === 'fulfilled' ? nwRes.value.data : []

  isLoading.value = false
}

onMounted(loadReports)
watch(rangePreset, () => {
  if (rangePreset.value !== 'custom') loadReports()
})

const formatMoney = (amount: number): string =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const monthLabel = (month: string): string => {
  const [year, m] = month.split('-')
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

// ---- Income vs Expense + Net (shared axis, bars + line) ----
const IE_W = 640
const IE_H = 220
const IE_PAD_TOP = 16
const IE_PAD_BOTTOM = 24
const IE_PAD_X = 12

const ieDomain = computed(() => {
  const values = monthlyPoints.value.flatMap((p) => [p.income, p.expense, p.net])
  const max = Math.max(1, ...values, 0)
  const min = Math.min(0, ...values)
  return { max, min: min === max ? min - 1 : min }
})

const ieBandWidth = computed(() =>
  monthlyPoints.value.length > 0 ? (IE_W - IE_PAD_X * 2) / monthlyPoints.value.length : 0,
)

const ieY = (value: number): number => {
  const { max, min } = ieDomain.value
  const usable = IE_H - IE_PAD_TOP - IE_PAD_BOTTOM
  const ratio = (value - min) / (max - min)
  return IE_PAD_TOP + (1 - ratio) * usable
}

const ieZeroY = computed(() => ieY(0))

interface IeBar {
  x: number
  y: number
  height: number
  color: string
}

interface IeMonth {
  month: string
  label: string
  income: IeBar
  expense: IeBar
  netX: number
  netY: number
}

const ieMonths = computed<IeMonth[]>(() =>
  monthlyPoints.value.map((p, i) => {
    const groupX = IE_PAD_X + i * ieBandWidth.value
    const incomeY = ieY(p.income)
    const expenseY = ieY(p.expense)
    return {
      month: p.month,
      label: monthLabel(p.month),
      income: {
        x: groupX + ieBandWidth.value * 0.14,
        y: Math.min(incomeY, ieZeroY.value),
        height: Math.abs(incomeY - ieZeroY.value),
        color: 'rgb(var(--color-success))',
      },
      expense: {
        x: groupX + ieBandWidth.value * 0.58,
        y: Math.min(expenseY, ieZeroY.value),
        height: Math.abs(expenseY - ieZeroY.value),
        color: 'rgb(var(--color-danger))',
      },
      netX: groupX + ieBandWidth.value / 2,
      netY: ieY(p.net),
    }
  }),
)

const ieBarWidth = computed(() => ieBandWidth.value * 0.28)

const ieNetPath = computed(() =>
  ieMonths.value.map((m, i) => `${i === 0 ? 'M' : 'L'} ${m.netX} ${m.netY}`).join(' '),
)

const hoveredMonth = ref<string | null>(null)
const hoveredMonthData = computed(() => monthlyPoints.value.find((p) => p.month === hoveredMonth.value) ?? null)

// ---- Net worth trend (single line) ----
const NW_W = 640
const NW_H = 160
const NW_PAD_TOP = 16
const NW_PAD_BOTTOM = 24
const NW_PAD_X = 12

const nwDomain = computed(() => {
  const values = netWorthPoints.value.map((p) => p.balance)
  const max = Math.max(1, ...values)
  const min = Math.min(0, ...values)
  return { max, min: min === max ? min - 1 : min }
})

const nwY = (value: number): number => {
  const { max, min } = nwDomain.value
  const usable = NW_H - NW_PAD_TOP - NW_PAD_BOTTOM
  const ratio = (value - min) / (max - min)
  return NW_PAD_TOP + (1 - ratio) * usable
}

const nwPoints = computed(() => {
  const xs = netWorthPoints.value.map((_p, i) =>
    netWorthPoints.value.length > 1 ? NW_PAD_X + (i * (NW_W - NW_PAD_X * 2)) / (netWorthPoints.value.length - 1) : NW_W / 2,
  )
  return netWorthPoints.value.map((p, i) => {
    const x = xs[i] ?? NW_W / 2
    const prevX = xs[i - 1]
    const nextX = xs[i + 1]
    const hitStart = i === 0 ? 0 : (prevX! + x) / 2
    const hitEnd = i === xs.length - 1 ? NW_W : (nextX! + x) / 2
    return {
      month: p.month,
      label: monthLabel(p.month),
      x,
      y: nwY(p.balance),
      balance: p.balance,
      hitX: hitStart,
      hitWidth: hitEnd - hitStart,
    }
  })
})

const nwPath = computed(() => nwPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '))

const hoveredNetWorthMonth = ref<string | null>(null)
const hoveredNetWorthData = computed(() => nwPoints.value.find((p) => p.month === hoveredNetWorthMonth.value) ?? null)

// ---- Top categories ----
const totalCategoryExpense = computed(() => categoryTotals.value.reduce((s, c) => s + c.total, 0))
const topCategories = computed(() =>
  categoryTotals.value.slice(0, 8).map((c, i) => ({
    ...c,
    color: chartSeriesColor(i),
    pct: totalCategoryExpense.value > 0 ? (c.total / totalCategoryExpense.value) * 100 : 0,
  })),
)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-bg">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <PageHeader title="Reports" subtitle="Income vs. expense, net worth trend and top spending categories." />

      <PageContainer>
        <!-- Range selector -->
        <AppCard>
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <AppTabs
              v-model="rangePreset"
              :tabs="[
                { value: 'thisMonth', label: 'This month' },
                { value: '3m', label: '3M' },
                { value: '6m', label: '6M' },
                { value: '12m', label: '12M' },
                { value: 'custom', label: 'Custom' },
              ]"
            />

            <div v-if="rangePreset === 'custom'" class="flex flex-wrap items-end gap-3">
              <AppInput label="From" type="date" :model-value="customFrom" @update:model-value="(v) => (customFrom = v)" />
              <AppInput label="To" type="date" :model-value="customTo" @update:model-value="(v) => (customTo = v)" />
              <AppButton size="sm" @click="loadReports">Apply</AppButton>
            </div>
          </div>
        </AppCard>

        <div v-if="isLoading" class="flex justify-center py-16 text-primary">
          <AppSpinner size="lg" />
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-2 py-16 text-center">
          <span class="material-symbols-outlined text-3xl text-danger">error</span>
          <p class="text-sm text-danger">{{ error }}</p>
          <AppButton variant="secondary" size="sm" @click="loadReports">Retry</AppButton>
        </div>

        <template v-else>
          <!-- Income vs Expense -->
          <AppCard>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="font-display text-sm font-bold text-content">Income vs. Expense</h2>
              <div class="flex items-center gap-4 text-xs font-semibold text-muted">
                <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-success" />Income</span>
                <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-danger" />Expense</span>
                <span class="flex items-center gap-1.5"><span class="h-0.5 w-3 rounded-full bg-primary" />Net</span>
              </div>
            </div>

            <p v-if="monthlyPoints.length === 0" class="py-10 text-center text-sm text-muted">
              No transactions recorded in this range
            </p>

            <template v-else>
              <div class="relative" @mouseleave="hoveredMonth = null">
                <svg :viewBox="`0 0 ${IE_W} ${IE_H}`" class="w-full" preserveAspectRatio="none" style="height: 220px">
                  <line :x1="0" :x2="IE_W" :y1="ieZeroY" :y2="ieZeroY" class="text-line" stroke="currentColor" stroke-width="1" />

                  <g v-for="m in ieMonths" :key="m.month">
                    <rect :x="m.income.x" :y="m.income.y" :width="ieBarWidth" :height="Math.max(m.income.height, 0.5)" :fill="m.income.color" rx="2" />
                    <rect :x="m.expense.x" :y="m.expense.y" :width="ieBarWidth" :height="Math.max(m.expense.height, 0.5)" :fill="m.expense.color" rx="2" />
                  </g>

                  <path :d="ieNetPath" fill="none" stroke="rgb(var(--color-primary))" stroke-width="2" />
                  <circle v-for="m in ieMonths" :key="`net-${m.month}`" :cx="m.netX" :cy="m.netY" r="2.5" fill="rgb(var(--color-primary))" />

                  <rect
                    v-for="(m, i) in ieMonths"
                    :key="`hit-${m.month}`"
                    :x="IE_PAD_X + i * ieBandWidth"
                    y="0"
                    :width="ieBandWidth"
                    :height="IE_H"
                    fill="transparent"
                    @mouseenter="hoveredMonth = m.month"
                  />
                </svg>

                <div class="mt-1 flex text-center text-[11px] font-medium text-faint">
                  <span v-for="m in ieMonths" :key="`label-${m.month}`" :style="{ width: `${100 / ieMonths.length}%` }">{{ m.label }}</span>
                </div>

                <div
                  v-if="hoveredMonthData"
                  class="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-elevated"
                >
                  <p class="font-display font-bold text-content">{{ monthLabel(hoveredMonthData.month) }}</p>
                  <p class="text-success">Income: {{ formatMoney(hoveredMonthData.income) }}</p>
                  <p class="text-danger">Expense: {{ formatMoney(hoveredMonthData.expense) }}</p>
                  <p class="text-primary">Net: {{ formatMoney(hoveredMonthData.net) }}</p>
                </div>
              </div>

              <details class="mt-4 text-sm">
                <summary class="cursor-pointer font-semibold text-primary">View data table</summary>
                <div class="mt-3 overflow-x-auto">
                  <table class="w-full min-w-[480px] text-left text-sm">
                    <thead class="border-b border-line">
                      <tr>
                        <th class="data-th">Month</th>
                        <th class="data-th text-right">Income</th>
                        <th class="data-th text-right">Expense</th>
                        <th class="data-th text-right">Net</th>
                        <th class="data-th text-right">Net worth</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-line">
                      <tr v-for="p in monthlyPoints" :key="p.month">
                        <td class="px-4 py-2 text-content">{{ p.month }}</td>
                        <td class="px-4 py-2 text-right tabular-nums text-success">{{ formatMoney(p.income) }}</td>
                        <td class="px-4 py-2 text-right tabular-nums text-danger">{{ formatMoney(p.expense) }}</td>
                        <td class="px-4 py-2 text-right tabular-nums text-content">{{ formatMoney(p.net) }}</td>
                        <td class="px-4 py-2 text-right tabular-nums text-content">
                          {{ netWorthPoints.find((n) => n.month === p.month) ? formatMoney(netWorthPoints.find((n) => n.month === p.month)!.balance) : '—' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>
            </template>
          </AppCard>

          <div class="grid gap-6 lg:grid-cols-2">
            <!-- Net worth trend -->
            <AppCard>
              <h2 class="mb-4 font-display text-sm font-bold text-content">Net Worth Trend</h2>

              <p v-if="nwPoints.length === 0" class="py-10 text-center text-sm text-muted">No data for this range</p>

              <div v-else class="relative" @mouseleave="hoveredNetWorthMonth = null">
                <svg :viewBox="`0 0 ${NW_W} ${NW_H}`" class="w-full" preserveAspectRatio="none" style="height: 160px">
                  <path :d="nwPath" fill="none" stroke="rgb(var(--color-primary))" stroke-width="2" />
                  <circle v-for="p in nwPoints" :key="p.month" :cx="p.x" :cy="p.y" r="2.5" fill="rgb(var(--color-primary))" />
                  <rect
                    v-for="p in nwPoints"
                    :key="`hit-${p.month}`"
                    :x="p.hitX"
                    y="0"
                    :width="p.hitWidth"
                    :height="NW_H"
                    fill="transparent"
                    @mouseenter="hoveredNetWorthMonth = p.month"
                  />
                </svg>

                <div class="mt-1 flex justify-between text-[11px] font-medium text-faint">
                  <span v-for="p in nwPoints" :key="`label-${p.month}`">{{ p.label }}</span>
                </div>

                <div
                  v-if="hoveredNetWorthData"
                  class="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-elevated"
                >
                  <p class="font-display font-bold text-content">{{ monthLabel(hoveredNetWorthData.month) }}</p>
                  <p class="text-content">Balance: {{ formatMoney(hoveredNetWorthData.balance) }}</p>
                </div>
              </div>
            </AppCard>

            <!-- Top categories -->
            <AppCard>
              <h2 class="mb-4 font-display text-sm font-bold text-content">Top Categories</h2>

              <p v-if="topCategories.length === 0" class="py-10 text-center text-sm text-muted">
                No expenses recorded in this range
              </p>

              <div v-else class="space-y-3">
                <div v-for="cat in topCategories" :key="cat.categoryId ?? 'none'" class="min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span class="flex min-w-0 items-center gap-2">
                      <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: cat.color }" />
                      <span class="truncate text-sm font-semibold text-content">{{ cat.categoryName }}</span>
                    </span>
                    <span class="shrink-0 text-sm text-muted">{{ formatMoney(cat.total) }}</span>
                  </div>
                  <div class="mt-1.5 h-1.5 w-full rounded-full bg-surface-2">
                    <div class="h-1.5 rounded-full" :style="{ width: `${cat.pct}%`, backgroundColor: cat.color }" />
                  </div>
                </div>
              </div>
            </AppCard>
          </div>
        </template>
      </PageContainer>
    </main>
  </div>
</template>
