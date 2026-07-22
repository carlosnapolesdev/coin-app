<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TopHeader from './common/TopHeader.vue'
import LandingHero from './landing/LandingHero.vue'
import LandingFeatures from './landing/LandingFeatures.vue'
import LandingHowItWorks from './landing/LandingHowItWorks.vue'
import LegalFooter from './legal/LegalFooter.vue'

const { t } = useI18n()
</script>

<template>
  <main class="min-h-screen bg-bg font-body text-content">
    <TopHeader>
      <template #actions>
        <RouterLink
          to="/login"
          class="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-content transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {{ t('landing.cta.signIn') }}
        </RouterLink>
        <RouterLink
          to="/register"
          class="hidden h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:inline-flex"
        >
          {{ t('landing.cta.createAccount') }}
        </RouterLink>
      </template>
    </TopHeader>
    <LandingHero />
    <LandingFeatures />
    <LandingHowItWorks />
    <footer class="px-6 py-8 text-center">
      <p class="text-xs font-medium uppercase tracking-widest text-faint">
        {{ t('auth.login.footer') }}
      </p>
    </footer>
    <LegalFooter />
  </main>
</template>