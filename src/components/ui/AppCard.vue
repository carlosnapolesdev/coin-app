<script setup lang="ts">
withDefaults(defineProps<{ padding?: 'none' | 'sm' | 'md' | 'lg' }>(), { padding: 'md' })
</script>

<template>
  <div
    class="surface-card"
    :class="{
      'p-0': padding === 'none',
      'p-4': padding === 'sm',
      'p-6': padding === 'md',
      'p-8': padding === 'lg',
    }"
  >
    <slot />
  </div>
</template>
