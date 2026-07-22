<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LanguageToggle from '../ui/LanguageToggle.vue'
import { LEGAL_SLUGS, LEGAL_ROUTE_PATHS, LEGAL_TITLE_KEYS } from '../../content/legal'

const { t } = useI18n()
</script>

<template>
  <footer class="px-6 py-8 text-center">
    <p class="text-xs font-medium uppercase tracking-widest text-faint">
      {{ t('auth.login.footer') }}
    </p>
  </footer>
  <footer class="border-t border-line px-6 py-8">
    <div
      class="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr]"
    >
      <div class="hidden sm:block"></div>
      <nav class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <RouterLink
          v-for="slug in LEGAL_SLUGS"
          :key="slug"
          :to="LEGAL_ROUTE_PATHS[slug]"
          class="text-xs font-semibold uppercase tracking-widest text-faint hover:text-primary hover:underline"
        >
          {{ t(LEGAL_TITLE_KEYS[slug]) }}
        </RouterLink>
      </nav>
      <div class="flex justify-center sm:justify-end">
        <LanguageToggle />
      </div>
    </div>
  </footer>
</template>
