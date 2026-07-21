import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const projectRoot = join(__dirname, '..')
const indexHtmlPath = join(projectRoot, 'dist/index.html')

function getIndexHtml(): string | null {
  if (!existsSync(indexHtmlPath)) return null
  return readFileSync(indexHtmlPath, 'utf-8')
}

describe('dist/index.html — CSS critical extraction', () => {
  beforeAll(() => {
    if (!existsSync(indexHtmlPath)) {
      execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' })
    }
  })

  it('either inlines a non-empty <style> or links a stylesheet', () => {
    const html = getIndexHtml()
    expect(html).not.toBeNull()
    const hasInlinedStyle = /<style[^>]*>[^<]+<\/style>/.test(html as string)
    const hasLink = /<link[^>]+rel="stylesheet"[^>]+href="\/assets\/index-[^"]+\.css"/.test(html as string)
    expect(hasInlinedStyle || hasLink).toBe(true)
  })

  it('when inline style is present, non-blocking preload pattern is also there', () => {
    const html = getIndexHtml()
    expect(html).not.toBeNull()
    const hasInlinedStyle = /<style[^>]*>[^<]+<\/style>/.test(html as string)
    if (!hasInlinedStyle) return
    expect(html).toMatch(/<link[^>]+rel="preload"[^>]+as="style"[^>]+onload=/)
    expect(html).toMatch(/<noscript>[^<]*<link[^>]+rel="stylesheet"/)
  })

  it('llms.txt is present in dist', () => {
    expect(existsSync(join(projectRoot, 'dist/llms.txt'))).toBe(true)
  })

  it('fonts are preloaded for Inter', () => {
    const html = getIndexHtml()
    expect(html).toMatch(/<link[^>]+rel="preload"[^>]+href="\/assets\/Inter-Variable-[^"]+\.woff2"/)
  })
})

describe('dist/assets — chunks', () => {
  it('UI bundle is a separate chunk under assets/', () => {
    const assets = readdirSync(join(projectRoot, 'dist/assets'))
    const uiChunk = assets.find((f) => /^ui-[A-Za-z0-9_-]+\.js$/.test(f))
    expect(uiChunk).toBeDefined()
  })
})
