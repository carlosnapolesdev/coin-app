/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Light-theme design tokens must keep every informative text pair at >=4.5:1
// (WCAG AA, normal text). This guards the palette retint: a darker canvas plus
// a lighter muted could silently dip below the line. Values are read straight
// from style.css so the test tracks the real tokens, not a copy.
//
// Path is routed through a helper because Vite rewrites literal `new URL(...)`
// calls to dev-server URLs at build time (see src/components/ui/brand-assets.test.ts
// for the same pattern).
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const styles = read('./style.css')
const lightBlock = styles.slice(0, styles.indexOf('.dark {'))

type RGB = [number, number, number]

function token(name: string): RGB {
  const m = lightBlock.match(new RegExp(`${name}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`))
  if (!m) throw new Error(`token ${name} not found in :root`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

const channel = (c: number) => {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const luminance = ([r, g, b]: RGB) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const WHITE: RGB = [255, 255, 255]

describe('light theme token contrast (WCAG AA, normal text)', () => {
  const bg = token('--color-bg')
  const surface2 = token('--color-surface-2')
  const primary = token('--color-primary')
  const muted = token('--color-muted')
  const content = token('--color-content')
  const brandTeal = token('--color-brand-teal')

  const pairs: Array<[string, RGB, RGB]> = [
    ['primary on white (button fill)', primary, WHITE],
    ['primary as text on canvas', primary, bg],
    ['muted text on canvas', muted, bg],
    ['muted text on sunken surface', muted, surface2],
    ['content text on canvas', content, bg],
    ['brand-teal as text on white', brandTeal, WHITE],
  ]

  it.each(pairs)('%s stays >= 4.5:1', (_label, fg, bgc) => {
    expect(ratio(fg, bgc)).toBeGreaterThanOrEqual(4.5)
  })
})
