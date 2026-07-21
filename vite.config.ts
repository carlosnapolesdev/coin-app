import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
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
  const preloaded = [/MaterialSymbolsOutlined-Subset-.*\.woff2$/, /Inter-Variable-.*\.woff2$/]
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

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), fontPreload()],
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
