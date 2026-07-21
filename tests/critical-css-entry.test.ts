import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const config = readFileSync(join(__dirname, '..', 'vite.config.ts'), 'utf-8')
const ALLOWED = new Set(["'/'", "'/login'"])

describe('criticalCss entry guard', () => {
  it('entry literal is whitelisted', () => {
    const match = config.match(/criticalCss\s*\(\s*\{\s*entry:\s*(['"])([^'"]+)\1/)
    expect(match).not.toBeNull()
    const [, quote, value] = match as unknown as [string, string, string]
    expect(ALLOWED.has(`${quote}${value}${quote}`)).toBe(true)
  })
})
