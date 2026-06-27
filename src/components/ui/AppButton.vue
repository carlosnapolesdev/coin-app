<script setup lang="ts">
import { computed } from 'vue'
import AppSpinner from './AppSpinner.vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    icon?: string
    trailingIcon?: string
    loading?: boolean
    block?: boolean
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover shadow-sm',
  secondary: 'border border-line bg-surface text-content hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-content',
  danger: 'bg-danger text-white shadow-sm hover:opacity-90',
  subtle: 'bg-primary/10 text-primary hover:bg-primary/15',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-11 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
}

const iconSize = computed(() => (props.size === 'lg' ? 'text-[22px]' : 'text-[20px]'))
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60"
    :class="[variantClass[variant], sizeClass[size], block ? 'w-full' : '']"
  >
    <AppSpinner v-if="loading" size="sm" />
    <span v-else-if="icon" class="material-symbols-outlined" :class="iconSize">{{ icon }}</span>
    <slot />
    <span v-if="trailingIcon && !loading" class="material-symbols-outlined" :class="iconSize">{{ trailingIcon }}</span>
  </button>
</template>
