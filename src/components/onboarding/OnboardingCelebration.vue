<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOnboarding } from '../../composables/useOnboarding'
import { AppButton } from '../ui'

const { t } = useI18n()
const { celebrationVisible, dismissCelebration } = useOnboarding()
</script>

<template>
  <Transition name="celebrate">
    <div
      v-if="celebrationVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4 backdrop-blur-sm"
      @click.self="dismissCelebration"
    >
      <div class="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-elevated">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary text-primary-fg">
          <span class="material-symbols-outlined text-3xl" aria-hidden="true">celebration</span>
        </div>
        <h2 class="text-xl font-bold text-content">{{ t('onboarding.celebration.title') }}</h2>
        <p class="mt-2 text-sm text-muted">{{ t('onboarding.celebration.body') }}</p>
        <AppButton class="mt-6" block @click="dismissCelebration">{{ t('onboarding.celebration.cta') }}</AppButton>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.celebrate-enter-active,
.celebrate-leave-active {
  transition: opacity 0.2s ease;
}
.celebrate-enter-from,
.celebrate-leave-to {
  opacity: 0;
}
</style>
