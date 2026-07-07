<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppButton, BrandMark, LanguageToggle, ThemeToggle } from '../ui'

const { t } = useI18n()
</script>

<template>
  <header
    class="flex items-center justify-between whitespace-nowrap border-b border-line bg-bg px-6 py-4 lg:px-20"
  >
    <BrandMark :wordmark="true" />
    <div class="flex items-center gap-3">
      <LanguageToggle />
      <ThemeToggle />
      <AppButton variant="secondary" size="md">{{ t('topHeader.help') }}</AppButton>
    </div>
  </header>
</template>
