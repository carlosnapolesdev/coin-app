// Generates a Material Symbols subset containing only the glyphs listed in
// src/config/icons.ts (ALL_ICONS). Run with `npm run fonts:subset` whenever
// UI_ICONS or CATEGORY_ICONS change. Keeps the FILL axis (0-1) for .is-filled
// and pins the axes the app hard-codes (wght 400, GRAD 0, opsz 24).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import subsetFont from 'subset-font'
import { ALL_ICONS } from '../src/config/icons.ts'

const root = new URL('..', import.meta.url)
const input = fileURLToPath(new URL('fonts-src/MaterialSymbolsOutlined-Variable.woff2', root))
const output = fileURLToPath(new URL('src/assets/fonts/MaterialSymbolsOutlined-Subset.woff2', root))

// Note: this script does NOT validate icon names. subset-font silently omits a
// misspelled name (a typo is still valid text, so HarfBuzz does not fail), and
// @material-symbols/metadata/versions.json can't be used as a checklist — it is
// incomplete for the shipped font (expand_more, notifications_none, restore,
// smartphone, ... are in the woff2 but missing from versions.json). Name
// validation lives in src/config/icons.validity.test.ts, which shapes every
// name against this font and fails in CI if any is not a real single-glyph
// ligature.

const source = readFileSync(input)
const subset = await subsetFont(source, ALL_ICONS.join(' '), {
  targetFormat: 'woff2',
  // Omitted axes (FILL) keep their full range; listed axes are pinned.
  variationAxes: { wght: 400, GRAD: 0, opsz: 24 },
})
writeFileSync(output, subset)

const kib = (n) => `${(n / 1024).toFixed(1)} KiB`
console.log(`Subset ${ALL_ICONS.length} icons: ${kib(source.length)} -> ${kib(subset.length)}`)