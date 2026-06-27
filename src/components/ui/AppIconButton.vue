<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string
    variant?: 'default' | 'danger' | 'primary'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit'
    disabled?: boolean
    ariaLabel?: string
  }>(),
  { variant: 'default', size: 'md', type: 'button' },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :title="ariaLabel"
    class="inline-flex items-center justify-center rounded-lg text-faint transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
    :class="[
      size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
      variant === 'danger'
        ? 'hover:bg-danger/10 hover:text-danger'
        : variant === 'primary'
          ? 'hover:bg-primary/10 hover:text-primary'
          : 'hover:bg-surface-2 hover:text-content',
    ]"
  >
    <span class="material-symbols-outlined" :class="size === 'sm' ? 'text-[18px]' : 'text-[20px]'">{{ icon }}</span>
  </button>
</template>
