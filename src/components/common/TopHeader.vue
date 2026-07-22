<script setup lang="ts">
import { BrandMark, LanguageToggle, ThemeToggle } from '../ui'
import NotificationBell from './NotificationBell.vue'
import { useAuthState } from '../../services/auth'

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
      <slot name="actions" />
    </div>
  </header>
</template>
