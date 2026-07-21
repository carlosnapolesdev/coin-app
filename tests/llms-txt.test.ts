import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = join(__dirname, '..')

describe('llms.txt', () => {
  let src: string
  let dist: string

  beforeAll(() => {
    src = readFileSync(join(projectRoot, 'public/llms.txt'), 'utf-8')
    const distPath = join(projectRoot, 'dist/llms.txt')
    dist = existsSync(distPath) ? readFileSync(distPath, 'utf-8') : ''
  })

  it('source exists and starts with H1', () => {
    expect(src.startsWith('# Crecik')).toBe(true)
  })

  it('contains at least one link to crecik.com', () => {
    expect(src).toMatch(/https:\/\/crecik\.com\//)
  })

  it('production build copies it unchanged', () => {
    expect(dist).toBe(src)
  })

  it('does not link private routes', () => {
    const privateRoutes = ['/dashboard', '/accounts', '/transactions', '/budgets', '/goals', '/recurring', '/reports', '/categories', '/settings']
    for (const route of privateRoutes) {
      expect(src).not.toContain(`](https://crecik.com${route})`)
    }
  })
})
