<script setup lang="ts">
import { useI18n } from 'vue-i18n'
// Inherits text color via border-current, so the caller controls the color.
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })
const { t } = useI18n()
</script>

<template>
  <span
    role="status"
    :aria-label="t('common.loading')"
    class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em]"
    :class="{
      'h-4 w-4': size === 'sm',
      'h-6 w-6': size === 'md',
      'h-8 w-8': size === 'lg',
    }"
  />
</template>
