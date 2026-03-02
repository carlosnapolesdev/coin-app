<script setup lang="ts">
const stats = [
  {
    label: 'Total Balance',
    value: '$12,450.00',
    icon: 'account_balance',
    trend: '+2.5%',
    trendType: 'positive',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10'
  },
  {
    label: 'Monthly Income',
    value: '+$4,200.00',
    icon: 'trending_up',
    trend: 'Income',
    trendType: 'neutral-green',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    valueColor: 'text-emerald-600'
  },
  {
    label: 'Monthly Expenses',
    value: '-$2,150.00',
    icon: 'trending_down',
    trend: 'Expenses',
    trendType: 'neutral-red',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-100',
    valueColor: 'text-rose-600'
  }
]
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div 
      v-for="stat in stats" 
      :key="stat.label"
      class="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow"
    >
      <div class="flex justify-between items-start mb-4">
        <span class="p-2 rounded-lg material-symbols-outlined" :class="[stat.iconBg, stat.iconColor]">
          {{ stat.icon }}
        </span>
        <span 
          class="text-xs font-bold px-2 py-1 rounded-full"
          :class="{
            'text-primary bg-primary/10': stat.trendType === 'positive',
            'text-emerald-600 bg-emerald-50': stat.trendType === 'neutral-green',
            'text-rose-600 bg-rose-50': stat.trendType === 'neutral-red'
          }"
        >
          {{ stat.trend }}
        </span>
      </div>
      <p class="text-slate-500 text-sm font-medium">{{ stat.label }}</p>
      <h3 class="text-3xl font-bold mt-1" :class="stat.valueColor || 'text-slate-900 dark:text-white'">
        {{ stat.value }}
      </h3>
    </div>
  </div>
</template>
