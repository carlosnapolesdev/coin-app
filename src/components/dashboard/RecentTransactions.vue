<script setup lang="ts">
const transactions = [
  { id: 1, name: 'Apple Store', date: 'May 28, 2024', category: 'Electronics', amount: '-$999.00', amountType: 'negative', icon: 'shopping_bag', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { id: 2, name: 'Green Bistro', date: 'May 27, 2024', category: 'Food & Dining', amount: '-$45.50', amountType: 'negative', icon: 'restaurant', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { id: 3, name: 'Uber Trip', date: 'May 26, 2024', category: 'Transport', amount: '-$18.20', amountType: 'negative', icon: 'directions_car', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  { id: 4, name: 'Monthly Salary', date: 'May 25, 2024', category: 'Income', amount: '+$4,200.00', amountType: 'positive', icon: 'payments', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { id: 5, name: 'Netflix Subscription', date: 'May 24, 2024', category: 'Entertainment', amount: '-$15.99', amountType: 'negative', icon: 'movie', iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
]
</script>

<template>
  <div class="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
    <div class="flex justify-between items-center mb-6">
      <h4 class="font-bold text-lg">Recent Transactions</h4>
      <a class="text-primary text-xs font-bold hover:underline" href="#">View All</a>
    </div>
    <div class="space-y-5">
      <div v-for="t in transactions" :key="t.id" class="flex items-center gap-4 group cursor-pointer">
        <div class="size-10 rounded-full flex items-center justify-center" :class="[t.iconBg, t.iconColor]">
          <span class="material-symbols-outlined text-xl">{{ t.icon }}</span>
        </div>
        <div class="flex-1">
          <h5 class="text-sm font-bold group-hover:text-primary transition-colors">{{ t.name }}</h5>
          <p class="text-xs text-slate-400">{{ t.date }} • {{ t.category }}</p>
        </div>
        <div class="text-right">
          <span class="text-sm font-bold" :class="t.amountType === 'positive' ? 'text-emerald-600' : 'text-rose-600'">
            {{ t.amount }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
