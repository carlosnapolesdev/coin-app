<script setup lang="ts">
import { computed, ref } from 'vue'
import Sidebar from './Sidebar.vue'

const activeTopTab = ref<'accounts' | 'budgets'>('accounts')

const accounts = [
  { id: 1, name: 'Main Checking', institution: 'Chase Bank', balance: '+$4,250.00', positive: true, icon: 'account_balance' },
  { id: 2, name: 'Savings Account', institution: 'Wells Fargo', balance: '+$8,200.00', positive: true, icon: 'savings' },
  { id: 3, name: 'Credit Card', institution: 'Amex', balance: '-$1,320.00', positive: false, icon: 'credit_card' },
]

const budgets = [
  { id: 1, name: 'Food & Dining', spent: 320, limit: 500, color: 'bg-amber-500' },
  { id: 2, name: 'Transport', spent: 90, limit: 150, color: 'bg-blue-500' },
  { id: 3, name: 'Entertainment', spent: 60, limit: 100, color: 'bg-purple-500' },
  { id: 4, name: 'Health & Fitness', spent: 45, limit: 80, color: 'bg-rose-500' },
]

const monthlyCategories = [
  { label: 'Housing', amount: 750, color: '#2ecc70' },
  { label: 'Food & Dining', amount: 538, color: '#3b82f6' },
  { label: 'Transport', amount: 323, color: '#f59e0b' },
  { label: 'Entertainment', amount: 216, color: '#a855f7' },
  { label: 'Other', amount: 150, color: '#64748b' },
]

const totalMonthly = computed(() => monthlyCategories.reduce((s, c) => s + c.amount, 0))

const chartSegments = computed(() => {
  let offset = 0
  return monthlyCategories.map(cat => {
    const pct = (cat.amount / totalMonthly.value) * 100
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
              :class="activeTopTab === 'budgets'
                ? 'border-primary text-slate-900 dark:text-white'
                : 'border-transparent text-slate-400 hover:text-primary'"
              @click="activeTopTab = 'budgets'"
            >Budgets</button>
          </div>

          <!-- Tab content -->
          <div class="flex-1 overflow-y-auto">

            <!-- Accounts grid -->
            <div v-if="activeTopTab === 'accounts'" class="p-3 flex flex-col gap-0.5">
              <div
                v-for="account in accounts"
                :key="account.id"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-all group"
              >
                <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-slate-500 dark:text-zinc-400 text-[18px]">{{ account.icon }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{{ account.name }}</p>
                  <p class="text-[10px] text-slate-400 uppercase tracking-wider truncate">{{ account.institution }}</p>
                </div>
                <span class="text-xs font-bold shrink-0" :class="account.positive ? 'text-emerald-600' : 'text-rose-600'">
                  {{ account.balance }}
                </span>
              </div>
            </div>

            <!-- Budgets grid -->
            <div v-if="activeTopTab === 'budgets'" class="p-3 flex flex-col gap-2">
              <div
                v-for="budget in budgets"
                :key="budget.id"
                class="px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
              >
                <div class="flex justify-between items-center mb-1.5">
                  <span class="text-xs font-bold text-slate-900 dark:text-white">{{ budget.name }}</span>
                  <span class="text-[10px] text-slate-400">${{ budget.spent }} / ${{ budget.limit }}</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5">
                  <div
                    class="h-1.5 rounded-full transition-all"
                    :class="budget.color"
                    :style="{ width: Math.min((budget.spent / budget.limit) * 100, 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Right Column: 3/4 width — Monthly Spending Chart -->
        <div class="flex-1 min-w-0 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden p-5 border-l border-slate-100 dark:border-zinc-800">
          <div class="flex justify-between items-center mb-3 shrink-0">
            <h4 class="font-bold text-sm text-slate-900 dark:text-white">Monthly Spending by Category</h4>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">May 2024</span>
          </div>

          <div class="flex-1 flex items-center gap-10 min-h-0 overflow-hidden">

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
                <span class="text-xs font-bold text-slate-900 dark:text-white">${{ totalMonthly.toLocaleString() }}</span>
              </div>
            </div>

            <!-- Category breakdown list -->
            <div class="flex-1 grid grid-cols-2 gap-x-8 gap-y-2.5 min-w-0">
              <div v-for="seg in chartSegments" :key="seg.label" class="flex items-center gap-2 min-w-0">
                <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: seg.color }"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-baseline">
                    <span class="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate">{{ seg.label }}</span>
                    <span class="text-[10px] text-slate-400 ml-1 shrink-0">${{ seg.amount }}</span>
                  </div>
                  <div class="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1 mt-0.5">
                    <div class="h-1 rounded-full" :style="{ width: seg.pct + '%', backgroundColor: seg.color }"></div>
                  </div>
                </div>
              </div>
            </div>

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
