<script setup lang="ts">
const categories = [
  { label: 'Housing', percentage: 50, color: 'bg-primary' },
  { label: 'Food', percentage: 30, color: 'bg-rose-500' },
  { label: 'Transport', percentage: 20, color: 'bg-blue-500' },
]
</script>

<template>
  <div class="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
    <h4 class="font-bold text-lg mb-6">Spending Categories</h4>
    <div class="flex items-center gap-8">
      <div class="relative size-32 flex-shrink-0">
        <svg class="size-full transform -rotate-90" viewBox="0 0 36 36">
          <path class="text-slate-100 dark:text-zinc-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4"></path>
          <path class="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="currentColor" stroke-dasharray="50, 100" stroke-width="4"></path>
          <path class="text-rose-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="currentColor" stroke-dasharray="30, 100" stroke-dashoffset="-50" stroke-width="4"></path>
          <path class="text-blue-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="currentColor" stroke-dasharray="20, 100" stroke-dashoffset="-80" stroke-width="4"></path>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-xs font-semibold text-slate-400">Total</span>
          <span class="text-sm font-bold">$2,150</span>
        </div>
      </div>
      <div class="flex-1 space-y-4">
        <div v-for="cat in categories" :key="cat.label">
          <div class="flex justify-between text-xs font-bold mb-1">
            <span>{{ cat.label }}</span>
            <span>{{ cat.percentage }}%</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2">
            <div class="h-2 rounded-full" :class="cat.color" :style="{ width: cat.percentage + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
