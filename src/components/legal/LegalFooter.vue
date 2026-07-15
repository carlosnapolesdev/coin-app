<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LEGAL_SLUGS, LEGAL_ROUTE_PATHS, LEGAL_TITLE_KEYS } from '../../content/legal'

const { t } = useI18n()
</script>

<template>
  <footer class="border-t border-line px-6 py-8">
    <nav class="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2">
      <RouterLink
        v-for="slug in LEGAL_SLUGS"
        :key="slug"
        :to="LEGAL_ROUTE_PATHS[slug]"
        class="text-xs font-semibold uppercase tracking-widest text-faint hover:text-primary hover:underline"
      >
        {{ t(LEGAL_TITLE_KEYS[slug]) }}
      </RouterLink>
    </nav>
  </footer>
</template>
