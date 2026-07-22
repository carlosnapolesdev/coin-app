<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dashboardPreview from '../../assets/landing/dashboard-preview.webp'

const { t } = useI18n()
</script>

<template>
  <section
    class="bg-ambient flex min-h-svh flex-col items-center gap-8 px-6 pt-20 pb-16 text-center sm:min-h-0"
  >
    <h1 class="max-w-3xl text-4xl font-black tracking-tight text-content sm:text-5xl lg:text-6xl">
      {{ t('landing.hero.title') }}
    </h1>
    <p class="max-w-2xl text-lg text-muted sm:text-xl">
      {{ t('landing.hero.subtitle') }}
    </p>
    <div class="flex flex-wrap items-center justify-center gap-4">
      <RouterLink
        to="/register"
        class="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {{ t('landing.hero.ctaPrimary') }}
      </RouterLink>
      <RouterLink
        to="/login"
        class="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-surface px-6 text-base font-semibold text-content transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {{ t('landing.hero.ctaSecondary') }}
      </RouterLink>
    </div>
    <div class="mt-6 w-full max-w-5xl">
      <img
        class="w-full rounded-2xl border border-line shadow-elevated"
        :src="dashboardPreview"
        :alt="t('landing.hero.screenshotAlt')"
        width="1600"
        height="976"
        loading="eager"
        fetchpriority="high"
      />
    </div>
  </section>
</template>