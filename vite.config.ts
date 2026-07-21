import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// @ts-expect-error critters 0.0.23 ships types but excludes them via "exports"; runtime is fine.
import Critters from 'critters'
import type { Plugin } from 'vite'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string }

// Injects <link rel="preload"> for the fonts on the critical render path so
// the browser fetches them before parsing the bundled CSS. Only the icon
// subset (kills the icon FOUT) and Inter (body text) are preloaded; Space
// Grotesk is display-only and loads via CSS. Build-only: ctx.bundle is
// undefined in dev, where fonts load through CSS anyway.
function fontPreload(): Plugin {
  const preloaded = [
    /MaterialSymbolsOutlined-Subset-.*\.woff2$/,
    /Inter-Variable-.*\.woff2$/,
    /SpaceGrotesk-Variable-.*\.woff2$/,
  ] 
  return {
    name: 'font-preload',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html
        const tags = Object.keys(ctx.bundle)
          .filter((name) => preloaded.some((re) => re.test(name)))
          .map((name) => ({
            tag: 'link',
            injectTo: 'head' as const,
            attrs: {
              rel: 'preload',
              href: `/${name}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: true,
            },
          }))
        return { html, tags }
      },
    },
  }
}

// Esta ruta es el above-the-fold objetivo. Si cambias la página de entrada
// (p. ej. landing pública en `/`, ver `docs/ROADMAP.md`), actualiza este
// string. El CSS crítico extraído cubre solo lo necesario para que esa vista
// pinte sin FOUC.
function criticalCss(_options: { entry: string }): Plugin {
  return {
    name: 'critical-css',
    async transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html
      try {
        const c = new Critters({ preload: 'swap', pruneSource: false, logLevel: 'silent' })
        const processed = await c.process(html)
        if (/<style[\s\S]+?<\/style>/.test(processed)) return processed
      } catch (err) {
        console.warn('[critical-css] critters failed, falling back:', err)
      }
      const replaced = html.replace(
        /<link\s+rel="stylesheet"\s+crossorigin\s+href="(\/assets\/index-[^"]+\.css)"\s*\/?>/g,
        (_, href) => `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`,
      )
      return replaced
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), fontPreload(), criticalCss({ entry: '/login' })],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
