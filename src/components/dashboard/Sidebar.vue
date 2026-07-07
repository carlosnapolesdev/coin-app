<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { BrandMark, AppBadge } from '../ui'

const { t } = useI18n()

const navItems = computed(() => [
  { icon: 'grid_view', label: t('sidebar.nav.dashboard'), routeName: 'dashboard' },
  { icon: 'category', label: t('sidebar.nav.categories'), routeName: 'categories' },
  { icon: 'account_balance_wallet', label: t('sidebar.nav.accounts'), routeName: 'accounts' },
  { icon: 'receipt_long', label: t('sidebar.nav.transactions'), routeName: 'transactions' },
  { icon: 'pie_chart', label: t('sidebar.nav.budgets'), routeName: 'budgets' },
  { icon: 'flag', label: t('sidebar.nav.goals'), routeName: 'goals' },
  { icon: 'event_repeat', label: t('sidebar.nav.recurring'), routeName: 'recurring' },
  { icon: 'bar_chart', label: t('sidebar.nav.reports'), routeName: 'reports' },
  { icon: 'settings', label: t('sidebar.nav.settings'), routeName: 'settings' },
])

const route = useRoute()
</script>

<template>
  <aside class="hidden h-screen w-64 flex-shrink-0 flex-col border-r border-line bg-bg md:flex">
    <div class="px-6 py-6">
      <BrandMark :subtitle="t('sidebar.subtitle')" />
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
          <AppBadge variant="muted">{{ t('sidebar.soon') }}</AppBadge>
        </div>
      </template>
    </nav>
  </aside>
</template>
