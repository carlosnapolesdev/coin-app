<script setup lang="ts">
// The single source of truth for the CoinFlow brand lockup.
withDefaults(defineProps<{ wordmark?: boolean; subtitle?: string }>(), { wordmark: true })
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-sm">
      <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14l3-3 2 2 3.5-4" />
        <path d="M17 9h1.5v1.5" />
      </svg>
    </div>
    <div v-if="wordmark" class="min-w-0">
      <h1 class="truncate text-lg font-bold leading-tight tracking-tight text-content">CoinFlow</h1>
      <p v-if="subtitle" class="truncate text-xs text-muted">{{ subtitle }}</p>
    </div>
  </div>
</template>
