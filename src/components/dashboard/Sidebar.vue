<script setup lang="ts">
import { useRoute } from 'vue-router'
import { BrandMark, AppBadge } from '../ui'

const navItems = [
  { icon: 'grid_view', label: 'Dashboard', routeName: 'dashboard' },
  { icon: 'category', label: 'Categories', routeName: 'categories' },
  { icon: 'account_balance_wallet', label: 'Accounts', routeName: 'accounts' },
  { icon: 'receipt_long', label: 'Transactions', routeName: 'transactions' },
  { icon: 'pie_chart', label: 'Budgets', routeName: 'budgets' },
  { icon: 'bar_chart', label: 'Reports' },
  { icon: 'settings', label: 'Settings' },
]

const route = useRoute()
</script>

<template>
  <aside class="hidden h-screen w-64 flex-shrink-0 flex-col border-r border-line bg-bg md:flex">
    <div class="px-6 py-6">
      <BrandMark subtitle="Personal Finance" />
    </div>

    <nav class="flex-1 space-y-1 px-4 py-2">
      <template v-for="item in navItems" :key="item.label">
        <RouterLink
          v-if="item.routeName"
          :to="{ name: item.routeName }"
          class="nav-link w-full"
          :class="item.routeName === route.name ? 'nav-link-active' : ''"
        >
          <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
        <div
          v-else
          class="nav-link w-full cursor-default text-faint"
          aria-disabled="true"
        >
          <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
          <span class="flex-1">{{ item.label }}</span>
          <AppBadge variant="muted">Soon</AppBadge>
        </div>
      </template>
    </nav>
  </aside>
</template>
