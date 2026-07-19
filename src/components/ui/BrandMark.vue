<script setup lang="ts">
withDefaults(defineProps<{ wordmark?: boolean; subtitle?: string }>(), { wordmark: true })
</script>

<template>
  <RouterLink
    to="/"
    :aria-label="wordmark ? undefined : 'Crecik'"
    class="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
  >
    <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-sm">
      <svg class="size-6" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true">
        <path d="M18.4 8 A9.3 9.3 0 1 0 25.3 16.2" stroke-width="2.6" />
        <path d="M12.75 17.7 L15.85 14.6 L18.65 16.9 L23.75 11.27" stroke-width="2.8" stroke-linejoin="round" />
        <path d="M25.9 8.9 L25.38 12.75 L22.12 9.79 Z" fill="currentColor" stroke-width="1" stroke-linejoin="round" />
      </svg>
    </div>
    <div v-if="wordmark" class="min-w-0">
      <h1 class="truncate text-lg font-bold leading-tight tracking-tight text-content">Crecik</h1>
      <p v-if="subtitle" class="truncate text-xs text-muted">{{ subtitle }}</p>
    </div>
  </RouterLink>
</template>
