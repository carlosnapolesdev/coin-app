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

describe.skipIf(!hasBuild)('dist/index.html — non-blocking CSS + prerender', () => {
  it('ships the landing hero text as static HTML (vite-ssg prerender)', () => {
    const html = getIndexHtml() as string
    // With vite-ssg the splash is no longer needed: the prerendered hero is in
    // the static HTML, so the first paint is real content instead of a spinner.
    expect(html).toContain('Grow your money, own your future')
  })

  it('no bundled app stylesheet blocks first paint', () => {
    const html = getIndexHtml() as string
    // Outside <noscript>, every /assets/*.css link must be a self-promoting
    // preload, never a plain render-blocking rel="stylesheet".
    const withoutNoscript = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '')
    expect(withoutNoscript).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="\/assets\/[^"]+\.css"/)
  })

  it('defers the entry (app-*) and shared (ui-*) stylesheets', () => {
    const html = getIndexHtml() as string
    // vite-ssg renames the entry chunk from index-*.css to app-*.css; the
    // shared chunk keeps the ui-* prefix.
    for (const prefix of ['app', 'ui']) {
      const re = new RegExp(
        `<link[^>]+rel="preload"[^>]+href="/assets/${prefix}-[^"]+\\.css"[^>]+as="style"[^>]+onload=`,
      )
      expect(html).toMatch(re)
    }
  })

  it('keeps a <noscript> stylesheet fallback for no-JS renders', () => {
    const html = getIndexHtml() as string
    expect(html).toMatch(/<noscript><link[^>]+rel="stylesheet"[^>]+href="\/assets\/[^"]+\.css"/)
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
