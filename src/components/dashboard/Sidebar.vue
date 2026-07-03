<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import { logout, useAuthState } from '../../services/auth'
import { BrandMark, ThemeToggle } from '../ui'

const navItems = [
  { icon: 'grid_view', label: 'Dashboard', routeName: 'dashboard' },
  { icon: 'category', label: 'Categories', routeName: 'categories' },
  { icon: 'account_balance_wallet', label: 'Accounts', routeName: 'accounts' },
  { icon: 'receipt_long', label: 'Transactions', routeName: 'transactions' },
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
  <aside class="hidden h-screen w-64 flex-shrink-0 flex-col border-r border-line bg-bg md:flex">
    <div class="px-6 py-6">
      <BrandMark :subtitle="authState.user?.email ?? 'Personal Dashboard'" />
    </div>

    <nav class="flex-1 space-y-1 px-4 py-2">
      <component
        :is="item.routeName ? 'RouterLink' : 'button'"
        v-for="item in navItems"
        :key="item.label"
        :to="item.routeName ? { name: item.routeName } : undefined"
        :type="item.routeName ? undefined : 'button'"
        class="nav-link w-full"
        :class="item.routeName === route.name ? 'nav-link-active' : ''"
      >
        <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </component>
    </nav>

    <div class="flex items-center gap-3 border-t border-line p-4">
      <button
        type="button"
        class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-content transition-colors hover:bg-surface-2"
        @click="handleLogout"
      >
        <span class="material-symbols-outlined text-[20px]">logout</span>
        <span>Sign Out</span>
      </button>
      <ThemeToggle />
    </div>
  </aside>
</template>
