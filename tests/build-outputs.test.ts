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

describe.skipIf(!hasBuild)('dist/index.html — prerendered landing paints styled', () => {
  it('ships the landing hero text as static HTML (vite-ssg prerender)', () => {
    const html = getIndexHtml() as string
    // With vite-ssg the prerendered hero is in the static HTML, so the first
    // paint is real content instead of a spinner.
    expect(html).toContain('Grow your money, own your future')
  })

  it('loads the entry (app-*) and shared (ui-*) stylesheets render-blocking', () => {
    // The landing HTML carries real content, so its critical CSS must block the
    // first paint (styled) instead of being deferred. Deferring it produced a
    // staged flash of unstyled content — see docs/MEJORAS-PENDIENTES.md →
    // "Rendimiento". Each critical stylesheet must be a plain rel="stylesheet".
    const html = getIndexHtml() as string
    for (const prefix of ['app', 'ui']) {
      const re = new RegExp(
        `<link[^>]+rel="stylesheet"[^>]+href="/assets/${prefix}-[^"]+\\.css"`,
      )
      expect(html).toMatch(re)
    }
  })

  it('does not defer critical CSS with the preload/onload self-promotion hack', () => {
    // The regression guard: the old deferStyles rewrite turned every stylesheet
    // into `rel="preload" as="style" onload="...rel='stylesheet'"`. It must not
    // come back for the prerendered landing.
    const html = getIndexHtml() as string
    expect(html).not.toMatch(/rel="preload"[^>]+as="style"[^>]+onload=/)
  })

  it('preloads the hero image with high fetch priority', () => {
    // The hero screenshot is the landing's LCP element; it must be preloaded so
    // it is not discovered late and painted last.
    const html = getIndexHtml() as string
    expect(html).toMatch(
      /<link[^>]+rel="preload"[^>]+href="\/assets\/dashboard-preview-[^"]+\.(png|webp)"[^>]*fetchpriority="high"/,
    )
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
