import { describe, expect, it } from 'vitest'
import { CHART_SERIES_COUNT, chartSeriesColor, foldChartEntries } from './chartColors'

describe('chartSeriesColor', () => {
  it('maps slot 0..7 to var(--chart-1)..var(--chart-8)', () => {
    expect(chartSeriesColor(0)).toBe('var(--chart-1)')
    expect(chartSeriesColor(7)).toBe('var(--chart-8)')
  })

  it('throws on out-of-range slots instead of cycling hues', () => {
    expect(() => chartSeriesColor(8)).toThrow(RangeError)
    expect(() => chartSeriesColor(-1)).toThrow(RangeError)
  })
})

describe('foldChartEntries', () => {
  const entries = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ label: `Cat ${i + 1}`, amount: 100 - i }))

  it('returns entries unchanged when they fit the slots', () => {
    expect(foldChartEntries(entries(8), 'Other')).toHaveLength(8)
    expect(foldChartEntries(entries(3), 'Other')).toHaveLength(3)
  })

  it('folds the tail into an Other bucket when exceeding the slots', () => {
    const folded = foldChartEntries(entries(10), 'Other')
    expect(folded).toHaveLength(CHART_SERIES_COUNT)
    const other = folded[folded.length - 1]
    expect(other.label).toBe('Other')
    // entries 8, 9, 10 have amounts 93, 92, 91
    expect(other.amount).toBe(93 + 92 + 91)
  })

  it('keeps the largest categories as their own slots', () => {
    const folded = foldChartEntries(entries(12), 'Other')
    expect(folded[0]).toEqual({ label: 'Cat 1', amount: 100 })
    expect(folded[6]).toEqual({ label: 'Cat 7', amount: 94 })
  })
})