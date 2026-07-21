import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const scriptPath = join(__dirname, 'measure-font-metrics.mjs')

function runScript(tmpRoot: string): { stdout: string; css: string } {
  const stdout = execFileSync('node', [scriptPath], {
    env: {
      ...process.env,
      FONTS_OUT_DIR: tmpRoot,
      FONTS_IN_DIR: join(__dirname, '..', 'src/assets/fonts'),
    },
    encoding: 'utf-8',
  })
  const cssPath = join(tmpRoot, 'fonts-metrics.css')
  return { stdout, css: readFileSync(cssPath, 'utf-8') }
}

describe('measure-font-metrics', () => {
  let tmp: string
  let css: string

  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'fonts-metrics-'))
    ;({ css } = runScript(tmp))
  })

  it('emits two @font-face blocks', () => {
    const matches = css.match(/@font-face\s*\{[^}]*\}/g) ?? []
    expect(matches.length).toBe(2)
  })

  it('each @font-face has size-adjust, ascent-override, descent-override, line-gap-override', () => {
    for (const block of css.match(/@font-face\s*\{[^}]*\}/g) ?? []) {
      expect(block).toMatch(/size-adjust:/)
      expect(block).toMatch(/ascent-override:/)
      expect(block).toMatch(/descent-override:/)
      expect(block).toMatch(/line-gap-override:/)
    }
  })

  it('values are in plausible ranges', () => {
    for (const block of css.match(/@font-face\s*\{[^}]*\}/g) ?? []) {
      const sizeAdjust = Number((block.match(/size-adjust:\s*([0-9.]+)%/) ?? [])[1])
      const ascent = Number((block.match(/ascent-override:\s*([0-9.]+)%/) ?? [])[1])
      const descent = Number((block.match(/descent-override:\s*([0-9.]+)%/) ?? [])[1])
      expect(sizeAdjust).toBeGreaterThan(0)
      expect(sizeAdjust).toBeLessThanOrEqual(100)
      expect(ascent).toBeGreaterThan(0)
      expect(ascent).toBeLessThan(100)
      expect(descent).toBeGreaterThan(0)
    }
  })

  it('cleanup', () => {
    if (tmp && existsSync(tmp)) rmSync(tmp, { recursive: true })
  })
})
