<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import { logout, useAuthState } from '../../services/auth'

const navItems = [
  { icon: 'grid_view', label: 'Dashboard', routeName: 'dashboard' },
  { icon: 'category', label: 'Categories', routeName: 'categories' },
  { icon: 'swap_horiz', label: 'Transactions' },
  { icon: 'pie_chart', label: 'Budgets' },
  { icon: 'bar_chart', label: 'Reports' },
  { icon: 'settings', label: 'Settings' },
]

const router = useRouter()
const route = useRoute()
const authState = useAuthState()

const handleLogout = async () => {
  logout()
  await router.replace('/login')
}
</script>

<template>
  <aside class="w-64 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 hidden md:flex flex-col h-screen">
    <div class="p-6 flex items-center gap-3">
      <div class="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
        <span class="material-symbols-outlined">payments</span>
      </div>
      <div>
        <h1 class="font-bold text-lg leading-tight">CoinFlow</h1>
        <p class="text-xs text-slate-500">{{ authState.user?.email ?? 'Personal Dashboard' }}</p>
      </div>
    </div>
    
    <nav class="flex-1 px-4 py-4 space-y-1">
      <component
        v-for="item in navItems" 
        :key="item.label"
        :is="item.routeName ? 'RouterLink' : 'button'"
        :to="item.routeName ? { name: item.routeName } : undefined"
        :type="item.routeName ? undefined : 'button'"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
        :class="item.routeName === route.name ? 'active-nav' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400'"
      >
        <span class="material-symbols-outlined">{{ item.icon }}</span>
        <span class="text-sm font-semibold">{{ item.label }}</span>
      </component>
    </nav>
    
    <div class="p-4 border-t border-slate-200 dark:border-zinc-800">
      <button class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all">
        <span class="material-symbols-outlined">add</span>
        <span>Add Transaction</span>
      </button>
      <button
        @click="handleLogout"
        class="mt-3 w-full border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800"
      >
        <span class="material-symbols-outlined">logout</span>
        <span>Sign Out</span>
      </button>
    </div>
  </aside>
</template>
