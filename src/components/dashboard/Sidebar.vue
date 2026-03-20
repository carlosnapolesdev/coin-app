<script setup lang="ts">
const navItems = [
  { icon: 'grid_view', label: 'Home', active: true },
  { icon: 'account_balance_wallet', label: 'Accounts', active: false },
  { icon: 'swap_horiz', label: 'Transactions', active: false },
  { icon: 'pie_chart', label: 'Budgets', active: false },
  { icon: 'bar_chart', label: 'Reports', active: false },
  { icon: 'settings', label: 'Settings', active: false },
]
</script>

<template>
  <aside class="w-64 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 hidden md:flex flex-col h-screen">
    <div class="p-6 flex items-center gap-3">
      <div class="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
        <span class="material-symbols-outlined">payments</span>
      </div>
      <div>
        <h1 class="font-bold text-lg leading-tight">CoinFlow</h1>
        <p class="text-xs text-slate-500">Personal Dashboard</p>
      </div>
    </div>
    
    <nav class="flex-1 px-4 py-4 space-y-1">
      <a 
        v-for="item in navItems" 
        :key="item.label"
        href="#" 
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
        :class="item.active ? 'active-nav' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400'"
      >
        <span class="material-symbols-outlined">{{ item.icon }}</span>
        <span class="text-sm font-semibold">{{ item.label }}</span>
      </a>
    </nav>
    
    <div class="p-4 border-t border-slate-200 dark:border-zinc-800">
      <button class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all">
        <span class="material-symbols-outlined">add</span>
        <span>Add Transaction</span>
      </button>
    </div>
  </aside>
</template>
