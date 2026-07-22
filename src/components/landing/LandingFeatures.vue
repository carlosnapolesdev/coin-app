<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const features = [
  { key: 'accounts', icon: 'account_balance_wallet' },
  { key: 'budgets', icon: 'savings' },
  { key: 'goals', icon: 'flag' },
  { key: 'recurring', icon: 'event_repeat' },
  { key: 'reports', icon: 'bar_chart' },
] as const

const titleKeys = {
  accounts: 'landing.features.accounts.title',
  budgets: 'landing.features.budgets.title',
  goals: 'landing.features.goals.title',
  recurring: 'landing.features.recurring.title',
  reports: 'landing.features.reports.title',
} as const

const bodyKeys = {
  accounts: 'landing.features.accounts.body',
  budgets: 'landing.features.budgets.body',
  goals: 'landing.features.goals.body',
  recurring: 'landing.features.recurring.body',
  reports: 'landing.features.reports.body',
} as const
</script>

<template>
  <section class="mx-auto max-w-6xl px-6 py-16 lg:py-24">
    <h2 class="mb-12 text-center text-3xl font-black tracking-tight text-content sm:text-4xl">
      {{ t('landing.features.title') }}
    </h2>
    <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="f in features"
        :key="f.key"
        class="surface-card flex flex-col gap-3 p-6"
      >
        <span
          class="icon-tile bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <span class="material-symbols-outlined text-[28px]">{{ f.icon }}</span>
        </span>
        <h3 class="text-lg font-bold text-content">
          {{ t(titleKeys[f.key]) }}
        </h3>
        <p class="text-sm leading-relaxed text-muted">
          {{ t(bodyKeys[f.key]) }}
        </p>
      </li>
    </ul>
  </section>
</template>