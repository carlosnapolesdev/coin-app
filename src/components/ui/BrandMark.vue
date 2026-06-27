<script setup lang="ts">
// The single source of truth for the CoinFlow brand lockup.
withDefaults(defineProps<{ wordmark?: boolean; subtitle?: string }>(), { wordmark: true })
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-sm">
      <span class="material-symbols-outlined">account_balance_wallet</span>
    </div>
    <div v-if="wordmark" class="min-w-0">
      <h1 class="truncate text-lg font-bold leading-tight tracking-tight text-content">CoinFlow</h1>
      <p v-if="subtitle" class="truncate text-xs text-muted">{{ subtitle }}</p>
    </div>
  </div>
</template>
