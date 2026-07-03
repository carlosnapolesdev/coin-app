import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export function computeCountUpValue(from: number, to: number, elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0 || elapsedMs >= durationMs) return to
  if (elapsedMs <= 0) return from
  const progress = elapsedMs / durationMs
  const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
  return from + (to - from) * eased
}

export type AmountTone = 'positive' | 'negative' | 'neutral'

export function resolveAmountTone(value: number): AmountTone {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

export interface UseCountUpOptions {
  durationMs?: number
}

export function useCountUp(target: Ref<number>, options: UseCountUpOptions = {}) {
  const durationMs = options.durationMs ?? 700
  const displayValue = ref(0)
  const prefersReducedMotion =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  let frameId: number | null = null

  const animateTo = (to: number) => {
    if (prefersReducedMotion) {
      displayValue.value = to
      return
    }
    const from = displayValue.value
    const start = performance.now()
    if (frameId !== null) cancelAnimationFrame(frameId)

    const tick = (now: number) => {
      const elapsed = now - start
      displayValue.value = computeCountUpValue(from, to, elapsed, durationMs)
      frameId = elapsed < durationMs ? requestAnimationFrame(tick) : null
    }
    frameId = requestAnimationFrame(tick)
  }

  onMounted(() => animateTo(target.value))
  watch(target, (newValue) => animateTo(newValue))
  onBeforeUnmount(() => {
    if (frameId !== null) cancelAnimationFrame(frameId)
  })

  return { displayValue }
}
