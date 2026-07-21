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

// Turns every bundled app stylesheet into a non-render-blocking load. Vite
// emits `<link rel="stylesheet">` for the entry CSS and for each shared CSS
// chunk (index-*.css, ui-*.css); each one blocks first paint until it arrives.
// Because this is a client-rendered SPA the real content only appears after the
// JS bundle runs anyway — and the inline splash in index.html carries its own
// styles — so there is nothing to gain from blocking on CSS. We swap each link
// for a preload that promotes itself to a stylesheet on load, plus a <noscript>
// fallback so the no-JS render still gets styled. Critters used to sit here, but
// it extracts critical CSS from the *rendered* HTML and this app ships an empty
// #app, so it produced no <style> and always fell through to this same rewrite.
function deferStyles(): Plugin {
  return {
    name: 'defer-styles',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html
        return html.replace(
          /<link\s+rel="stylesheet"\s+crossorigin\s+href="(\/assets\/[^"]+\.css)"\s*\/?>/g,
          (_, href) =>
            `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`,
        )
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), fontPreload(), deferStyles()],
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
