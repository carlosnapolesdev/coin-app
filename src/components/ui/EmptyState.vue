<script setup lang="ts">
import AppButton from './AppButton.vue'

defineProps<{
  icon: string
  title: string
  description?: string
  actionLabel?: string
  actionIcon?: string
}>()

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="surface-card flex flex-col items-center gap-3 py-16 text-center">
    <div class="icon-tile size-14 bg-surface-2 text-faint">
      <span class="material-symbols-outlined text-3xl">{{ icon }}</span>
    </div>
    <div>
      <p class="text-base font-semibold text-content">{{ title }}</p>
      <p v-if="description" class="mx-auto mt-1 max-w-sm text-sm text-muted">{{ description }}</p>
    </div>
    <AppButton v-if="actionLabel" :icon="actionIcon" @click="emit('action')">
      {{ actionLabel }}
    </AppButton>
  </div>
</template>
