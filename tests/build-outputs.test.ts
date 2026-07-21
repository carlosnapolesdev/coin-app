import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = join(__dirname, '..')
const indexHtmlPath = join(projectRoot, 'dist/index.html')
const llmsTxtPath = join(projectRoot, 'dist/llms.txt')
const assetsDir = join(projectRoot, 'dist/assets')

const hasBuild = existsSync(indexHtmlPath)

function getIndexHtml(): string | null {
  if (!hasBuild) return null
  return readFileSync(indexHtmlPath, 'utf-8')
}

describe.skipIf(!hasBuild)('dist/index.html — CSS critical extraction', () => {
  it('either inlines a non-empty <style> or links a stylesheet', () => {
    const html = getIndexHtml()
    const hasInlinedStyle = /<style[^>]*>[^<]+<\/style>/.test(html as string)
    const hasLink = /<link[^>]+rel="stylesheet"[^>]+href="\/assets\/index-[^"]+\.css"/.test(html as string)
    expect(hasInlinedStyle || hasLink).toBe(true)
  })

  it('when inline style is present, non-blocking preload pattern is also there', () => {
    const html = getIndexHtml()
    if (!/<style[\s\S]+?<\/style>/.test(html as string)) return
    expect(html).toMatch(/<link[^>]+rel="preload"[^>]+as="style"[^>]+onload=/)
    expect(html).toMatch(/<noscript>[^<]*<link[^>]+rel="stylesheet"/)
  })

  it('llms.txt is present in dist', () => {
    expect(existsSync(llmsTxtPath)).toBe(true)
  })

  it('fonts are preloaded for Inter', () => {
    const html = getIndexHtml()
    expect(html).toMatch(/<link[^>]+rel="preload"[^>]+href="\/assets\/Inter-Variable-[^"]+\.woff2"/)
  })
})

describe.skipIf(!hasBuild)('dist/assets — chunks', () => {
  it('UI bundle is a separate chunk under assets/', () => {
    const assets = readdirSync(assetsDir)
    const uiChunk = assets.find((f) => /^ui-[A-Za-z0-9_-]+\.js$/.test(f))
    expect(uiChunk).toBeDefined()
  })
})
