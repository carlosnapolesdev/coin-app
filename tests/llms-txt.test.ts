import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = join(__dirname, '..')
const srcPath = join(projectRoot, 'public/llms.txt')
const distPath = join(projectRoot, 'dist/llms.txt')

const src = readFileSync(srcPath, 'utf-8')

describe('llms.txt', () => {
  it('source exists and starts with H1', () => {
    expect(src.startsWith('# Crecik')).toBe(true)
  })

  it('contains at least one link to crecik.com', () => {
    expect(src).toMatch(/https:\/\/crecik\.com\//)
  })

  it('does not link private routes', () => {
    const privateRoutes = ['/dashboard', '/accounts', '/transactions', '/budgets', '/goals', '/recurring', '/reports', '/categories', '/settings']
    for (const route of privateRoutes) {
      expect(src).not.toContain(`](https://crecik.com${route})`)
    }
  })
})

describe.skipIf(!existsSync(distPath))('llms.txt (build copy)', () => {
  it('production build copies it unchanged', () => {
    const dist = readFileSync(distPath, 'utf-8')
    expect(dist).toBe(src)
  })
})
