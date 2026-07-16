<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useToast } from '../composables/useToast'

const { t } = useI18n()
const { toasts, dismiss } = useToast()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup name="toast">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="surface-glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl p-4"
      >
        <span
          class="material-symbols-outlined text-xl"
          :class="item.type === 'success' ? 'text-success' : 'text-danger'"
          aria-hidden="true"
        >{{ item.type === 'success' ? 'check_circle' : 'error' }}</span>
        <p class="flex-1 text-sm font-medium text-content">{{ item.message }}</p>
        <button
          type="button"
          class="text-faint transition-colors hover:text-content"
          :aria-label="t('common.close')"
          @click="dismiss(item.id)"
        >
          <span class="material-symbols-outlined text-lg" aria-hidden="true">close</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
