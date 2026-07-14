<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOnboarding } from '../../composables/useOnboarding'

const props = withDefaults(
  defineProps<{ coachKey: string; text: string; placement?: 'bottom' | 'top' }>(),
  { placement: 'bottom' },
)

const { t } = useI18n()
const { shouldShowCoach, markCoachSeen } = useOnboarding()
const visible = ref(shouldShowCoach(props.coachKey))

const dismiss = () => {
  markCoachSeen(props.coachKey)
  visible.value = false
}
</script>

<template>
  <div class="relative">
    <slot />
    <div
      v-if="visible"
      class="absolute left-0 z-40 w-64 max-w-[80vw] rounded-xl border border-primary/30 bg-surface p-3 shadow-elevated"
      :class="placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'"
      role="dialog"
    >
      <div class="flex items-start gap-2">
        <span class="material-symbols-outlined mt-0.5 text-[18px] text-primary" aria-hidden="true">lightbulb</span>
        <p class="flex-1 text-sm text-content">{{ text }}</p>
      </div>
      <div class="mt-2 flex justify-end">
        <button
          type="button"
          data-coach-dismiss
          class="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
          @click="dismiss"
        >
          {{ t('onboarding.coach.understood') }}
        </button>
      </div>
    </div>
  </div>
</template>
