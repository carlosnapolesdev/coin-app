<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppButton, BrandMark, LanguageToggle, ThemeToggle } from '../ui'
import NotificationBell from './NotificationBell.vue'
import { useAuthState } from '../../services/auth'

const { t } = useI18n()
// Esta cabecera se usa también en vistas públicas; una campana de
// notificaciones no tiene sentido sin sesión.
const auth = useAuthState()
</script>

<template>
  <header
    class="surface-panel flex items-center justify-between whitespace-nowrap border-b border-line px-6 py-4 lg:px-20"
  >
    <BrandMark :wordmark="true" />
    <div class="flex items-center gap-3">
      <LanguageToggle />
      <ThemeToggle />
      <NotificationBell v-if="auth.user" />
      <AppButton variant="secondary" size="md">{{ t('topHeader.help') }}</AppButton>
    </div>
  </header>
</template>
