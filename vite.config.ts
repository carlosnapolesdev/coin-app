import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'
import 'vite-ssg'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string }

// Preloads the assets on the landing's critical render path so the browser
// fetches them early instead of discovering them late in the CSS/DOM:
//   - the icon subset (kills the icon FOUT) and Inter (body text); Space
//     Grotesk is display-only and loads via CSS,
//   - the hero screenshot, as a high-priority image so it is not the last
//     thing to paint (it is the landing's LCP element).
// Build-only: ctx.bundle is undefined in dev, where assets load lazily anyway.
function preloadCriticalAssets(): Plugin {
  const fonts = [
    /MaterialSymbolsOutlined-Subset-.*\.woff2$/,
    /Inter-Variable-.*\.woff2$/,
    /SpaceGrotesk-Variable-.*\.woff2$/,
  ]
  const heroImage = /dashboard-preview-.*\.(png|webp)$/
  return {
    name: 'preload-critical-assets',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html
        const names = Object.keys(ctx.bundle)
        const tags = [
          ...names
            .filter((name) => fonts.some((re) => re.test(name)))
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
            })),
          ...names
            .filter((name) => heroImage.test(name))
            .map((name) => ({
              tag: 'link',
              injectTo: 'head' as const,
              attrs: {
                rel: 'preload',
                href: `/${name}`,
                as: 'image',
                fetchpriority: 'high',
              },
            })),
        ]
        return { html, tags }
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), preloadCriticalAssets()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // Only the public landing is prerendered to HTML; every other route stays
  // client-rendered SPA. Keep this list in lockstep with the indexable routes
  // documented in docs/ROADMAP.md — auth-gated routes must never reach here.
  //
  // The landing ships real content in the static HTML, so its critical CSS is
  // left render-blocking on purpose: deferring it (the old `deferStyles` plugin)
  // made the browser paint the prerendered content *before* its styles arrived,
  // a staged flash of unstyled content. Blocking CSS trades a Lighthouse
  // render-blocking note for a styled first paint — the right call once there is
  // real content to flash. See docs/MEJORAS-PENDIENTES.md → "Rendimiento".
  ssgOptions: {
    includedRoutes: () => ['/'],
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
