import { describe, expect, it } from 'vitest'
import { computeCountUpValue, resolveAmountTone } from './useCountUp'

describe('computeCountUpValue', () => {
  it('returns the start value when no time has elapsed', () => {
    expect(computeCountUpValue(0, 100, 0, 700)).toBe(0)
  })

  it('returns the target value once elapsed time reaches the duration', () => {
    expect(computeCountUpValue(0, 100, 700, 700)).toBe(100)
  })

  it('returns the target value once elapsed time exceeds the duration', () => {
    expect(computeCountUpValue(0, 100, 900, 700)).toBe(100)
  })

  it('returns a value strictly between start and target mid-animation', () => {
    const mid = computeCountUpValue(0, 100, 350, 700)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(100)
  })
})

describe('resolveAmountTone', () => {
  it('returns positive for values greater than zero', () => {
    expect(resolveAmountTone(50)).toBe('positive')
  })

  it('returns negative for values less than zero', () => {
    expect(resolveAmountTone(-50)).toBe('negative')
  })

  it('returns neutral for exactly zero', () => {
    expect(resolveAmountTone(0)).toBe('neutral')
  })
})
