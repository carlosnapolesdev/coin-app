<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const titleKeys = {
  step1: 'landing.how.step1.title',
  step2: 'landing.how.step2.title',
  step3: 'landing.how.step3.title',
} as const

const bodyKeys = {
  step1: 'landing.how.step1.body',
  step2: 'landing.how.step2.body',
  step3: 'landing.how.step3.body',
} as const

const steps = ['step1', 'step2', 'step3'] as const
</script>

<template>
  <section
    class="mx-auto flex max-w-6xl flex-col px-6 py-16 lg:py-24"
  >
    <h2 class="mb-12 text-center text-3xl font-black tracking-tight text-content sm:text-4xl">
      {{ t('landing.how.title') }}
    </h2>
    <ol class="grid gap-8 sm:grid-cols-3">
      <li
        v-for="(step, i) in steps"
        :key="step"
        class="surface-card flex flex-col items-center gap-3 p-6 text-center"
      >
        <span
          class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-black text-primary-fg"
          aria-hidden="true"
        >
          {{ i + 1 }}
        </span>
        <h3 class="text-lg font-bold text-content">
          {{ t(titleKeys[step]) }}
        </h3>
        <p class="text-sm leading-relaxed text-muted">
          {{ t(bodyKeys[step]) }}
        </p>
      </li>
    </ol>
  </section>
</template>