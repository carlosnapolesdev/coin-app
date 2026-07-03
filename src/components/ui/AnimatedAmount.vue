<script setup lang="ts">
import { computed, toRef } from 'vue'
import { resolveAmountTone, useCountUp } from '../../composables/useCountUp'

const props = withDefaults(
  defineProps<{
    value: number
    size?: 'md' | 'lg'
    currencySymbol?: string
    showSign?: boolean
  }>(),
  { size: 'lg', currencySymbol: '$', showSign: true },
)

const valueRef = toRef(props, 'value')
const { displayValue } = useCountUp(valueRef)

const tone = computed(() => resolveAmountTone(props.value))

const toneTextClass = computed(
  () =>
    ({
      positive: 'text-primary',
      negative: 'text-danger',
      neutral: 'text-content',
    })[tone.value],
)

const sign = computed(() => {
  if (!props.showSign) return ''
  if (tone.value === 'positive') return '+'
  if (tone.value === 'negative') return '-'
  return ''
})

const formatted = computed(() =>
  Math.abs(displayValue.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
)

// The glow/underline treatment is reserved for the "hero" size — small inline
// balances (size="md") stay static-colored so the signature moment isn't diluted.
const showEmphasis = computed(() => props.size === 'lg' && tone.value !== 'neutral')
</script>

<template>
  <span class="relative isolate inline-flex items-baseline" :class="size === 'lg' ? 'text-3xl' : 'text-sm'">
    <span
      v-if="showEmphasis"
      class="pointer-events-none absolute inset-0 -z-10 hidden rounded-full blur-2xl dark:block"
      :class="tone === 'positive' ? 'bg-primary/25' : 'bg-danger/25'"
    />
    <span
      class="font-display font-bold tabular-nums"
      :class="[toneTextClass, showEmphasis ? 'underline decoration-2 underline-offset-4 dark:no-underline' : '']"
      >{{ sign }}{{ currencySymbol }}{{ formatted }}</span
    >
  </span>
</template>
