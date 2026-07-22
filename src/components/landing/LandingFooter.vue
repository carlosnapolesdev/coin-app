<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LanguageToggle from '../ui/LanguageToggle.vue'

const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-line px-6 py-10">
    <div
      class="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="font-display text-lg font-bold text-content">
        {{ t('landing.footer.tagline') }}
      </p>
      <nav
        :aria-label="t('landing.footer.legal')"
        class="flex flex-wrap gap-x-6 gap-y-2"
      >
        <RouterLink
          to="/legal/privacy"
          class="text-sm font-medium text-muted underline-offset-4 hover:text-content hover:underline"
        >
          {{ t('legal.privacy.title') }}
        </RouterLink>
        <RouterLink
          to="/legal/terms"
          class="text-sm font-medium text-muted underline-offset-4 hover:text-content hover:underline"
        >
          {{ t('legal.terms.title') }}
        </RouterLink>
        <RouterLink
          to="/legal/cookies"
          class="text-sm font-medium text-muted underline-offset-4 hover:text-content hover:underline"
        >
          {{ t('legal.cookies.title') }}
        </RouterLink>
        <RouterLink
          to="/legal/legal-notice"
          class="text-sm font-medium text-muted underline-offset-4 hover:text-content hover:underline"
        >
          {{ t('legal.legalNotice.title') }}
        </RouterLink>
      </nav>
      <LanguageToggle />
    </div>
    <p class="mx-auto mt-6 max-w-6xl text-center text-xs text-faint">
      © {{ year }} Crecik. {{ t('landing.footer.rights') }}
    </p>
  </footer>
</template>