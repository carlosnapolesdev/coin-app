<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'success' | 'danger' | 'warning' | 'primary' | 'muted'
    icon?: string
  }>(),
  { variant: 'muted' },
)
</script>

<template>
  <span class="badge" :class="`badge-${variant}`">
    <span v-if="icon" class="material-symbols-outlined" style="font-size: 14px">{{ icon }}</span>
    <slot />
  </span>
</template>
