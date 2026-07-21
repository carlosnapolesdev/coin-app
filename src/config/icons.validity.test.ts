// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as fontkit from 'fontkit'
import { describe, expect, it } from 'vitest'
import { ALL_ICONS } from './icons'

// The picker lists (UI_ICONS, CATEGORY_ICONS, ACCOUNT_ICONS) are hand-maintained.
// subset-font silently omits a misspelled name — a typo is still valid text, so
// it never throws and never grows the subset with the intended glyph. The result
// would be a blank/wrong icon in production with no build or test failure.
//
// This validates every name against the actual shipped font: a real Material
// Symbols icon is a ligature that shapes to exactly one glyph, while a typo
// shapes to several (one glyph per leftover letter). @material-symbols/metadata
// can't do this — its versions.json is incomplete for the shipped font.
const FONT = join(__dirname, '../../fonts-src/MaterialSymbolsOutlined-Variable.woff2')

describe('icon names resolve to real glyphs', () => {
  const font = fontkit.create(readFileSync(FONT)) as fontkit.Font

  it('every ALL_ICONS name is a single-glyph Material Symbols ligature', () => {
    const invalid = ALL_ICONS.filter((name) => font.layout(name).glyphs.length !== 1)
    expect(invalid, `Not real icons (typos?): ${invalid.join(', ')}`).toEqual([])
  })
})
