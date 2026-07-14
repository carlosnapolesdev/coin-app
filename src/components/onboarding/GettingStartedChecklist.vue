<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppCard } from '../ui'
import { useOnboarding } from '../../composables/useOnboarding'

const router = useRouter()
const { t } = useI18n()
const {
  steps,
  completedCount,
  totalSteps,
  checklistVisible,
  loadCounts,
  dismissChecklist,
} = useOnboarding()

onMounted(loadCounts)

const go = (route: string) => router.push({ name: route })
</script>

<template>
  <AppCard v-if="checklistVisible" padding="none" class="overflow-hidden">
    <div class="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
      <div>
        <h2 class="font-display text-sm font-bold text-content">{{ t('onboarding.checklist.title') }}</h2>
        <p class="mt-0.5 text-sm text-muted">{{ t('onboarding.checklist.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold uppercase tracking-wide text-faint">
          {{ t('onboarding.checklist.progress', { done: completedCount, total: totalSteps }) }}
        </span>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-content"
          @click="dismissChecklist"
        >
          {{ t('onboarding.checklist.dismiss') }}
        </button>
      </div>
    </div>

    <div class="h-1.5 w-full bg-surface-2">
      <div
        class="h-1.5 rounded-r-full bg-primary transition-all duration-500"
        :style="{ width: `${(completedCount / totalSteps) * 100}%` }"
      />
    </div>

    <ul class="divide-y divide-line">
      <li class="flex items-center gap-3 px-6 py-3">
        <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <span class="material-symbols-outlined text-[16px]">check</span>
        </span>
        <span class="text-sm font-medium text-muted line-through">{{ t('onboarding.checklist.setup') }}</span>
      </li>

      <li v-for="step in steps" :key="step.key" class="flex items-center gap-3 px-6 py-3">
        <span
          class="flex size-6 shrink-0 items-center justify-center rounded-full"
          :class="step.done ? 'bg-success/15 text-success' : 'border-2 border-line text-transparent'"
        >
          <span v-if="step.done" class="material-symbols-outlined text-[16px]">check</span>
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold" :class="step.done ? 'text-muted line-through' : 'text-content'">
            {{ t(`onboarding.checklist.${step.key}`) }}
          </p>
          <p v-if="!step.done" class="text-xs text-muted">{{ t(`onboarding.checklist.${step.key}Desc`) }}</p>
        </div>
        <button
          v-if="!step.done"
          type="button"
          class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          @click="go(step.route)"
        >
          <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </li>
    </ul>
  </AppCard>
</template>