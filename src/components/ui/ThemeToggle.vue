<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTheme } from '../../composables/useTheme'

const { isDark, toggleTheme } = useTheme()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:bg-surface-2 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    :aria-label="isDark ? t('themeToggle.switchToLight') : t('themeToggle.switchToDark')"
    :title="isDark ? t('themeToggle.lightMode') : t('themeToggle.darkMode')"
    @click="toggleTheme"
  >
    <span class="material-symbols-outlined text-[20px]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
  </button>
</template>
