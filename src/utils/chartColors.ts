// Categorical chart palette accessors. The actual colors live in CSS custom
// properties (src/style.css) so they theme with light/dark automatically.
// The slot ORDER is the colorblind-safety mechanism (validated as a set):
// never reorder slots, never cycle hues for extra series — fold into "Other".

export const CHART_SERIES_COUNT = 8

export const chartSeriesColor = (slot: number): string => {
  if (!Number.isInteger(slot) || slot < 0 || slot >= CHART_SERIES_COUNT) {
    throw new RangeError(`chart series slot out of range: ${slot}`)
  }
  return `var(--chart-${slot + 1})`
}

export interface ChartEntry {
  label: string
  amount: number
}

export function foldChartEntries(
  entries: ChartEntry[],
  otherLabel: string,
  maxSlots: number = CHART_SERIES_COUNT,
): ChartEntry[] {
  if (entries.length <= maxSlots) return entries
  const kept = entries.slice(0, maxSlots - 1)
  const rest = entries.slice(maxSlots - 1)
  return [...kept, { label: otherLabel, amount: rest.reduce((sum, e) => sum + e.amount, 0) }]
}