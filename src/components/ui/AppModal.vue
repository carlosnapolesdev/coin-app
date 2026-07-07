<script setup lang="ts">
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    isOpen: boolean
    title?: string
    subtitle?: string
    icon?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { size: 'md' },
)

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
</script>

<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div
        class="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-elevated"
        :class="{
          'max-w-md': size === 'sm',
          'max-w-2xl': size === 'md',
          'max-w-4xl': size === 'lg',
          'max-w-5xl': size === 'xl',
        }"
      >
        <!-- Header -->
        <div
          v-if="title || $slots.header"
          class="flex items-start justify-between gap-4 border-b border-line px-6 py-5"
        >
          <slot name="header">
            <div class="flex items-center gap-3">
              <div v-if="icon" class="icon-tile size-10 bg-primary/10 text-primary">
                <span class="material-symbols-outlined">{{ icon }}</span>
              </div>
              <div>
                <h2 class="text-lg font-bold text-content">{{ title }}</h2>
                <p v-if="subtitle" class="mt-0.5 text-sm text-muted">{{ subtitle }}</p>
              </div>
            </div>
          </slot>
          <button
            type="button"
            :aria-label="t('common.close')"
            class="flex size-9 shrink-0 items-center justify-center rounded-lg text-faint transition hover:bg-surface-2 hover:text-content"
            @click="emit('close')"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto">
          <slot />
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="flex flex-col-reverse gap-3 border-t border-line bg-surface-2/40 px-6 py-4 sm:flex-row sm:justify-end"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
