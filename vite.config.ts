import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'
import 'vite-ssg'

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
//
// The same rewrite has to run a second time inside vite-ssg's `onPageRendered`,
// because vite-ssg appends more <link rel="stylesheet"> after rendering the
// route component, *after* the Vite plugin pass.
//
// Implementation note: the regex has to ignore `<link rel="stylesheet">` that
// lives inside the `<noscript>` we already wrote, otherwise running the rewrite
// twice nests preload→noscript→preload→noscript trees. Mask noscript blocks
// before the regex, then put them back.
const STYLESHEET_RE =
  /<link\s+rel="stylesheet"(?:\s+crossorigin)?\s+href="(\/assets\/[^"]+\.css)"\s*\/?>/g
const NOSCRIPT_RE = /<noscript>[\s\S]*?<\/noscript>/g

const rewriteStylesheets = (html: string): string => {
  const noscripts: string[] = []
  const masked = html.replace(NOSCRIPT_RE, (m) => {
    noscripts.push(m)
    return `<!--__NOSCRIPT_${noscripts.length - 1}__-->`
  })
  const rewritten = masked.replace(
    STYLESHEET_RE,
    (_, href) =>
      `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`,
  )
  return rewritten.replace(
    /<!--__NOSCRIPT_(\d+)__-->/g,
    (_m, i) => noscripts[Number(i)],
  )
}

function deferStyles(): Plugin {
  return {
    name: 'defer-styles',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html
        return rewriteStylesheets(html)
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
  // Only the public landing is prerendered to HTML; every other route stays
  // client-rendered SPA. Keep this list in lockstep with the indexable routes
  // documented in docs/ROADMAP.md — auth-gated routes must never reach here.
  // `onPageRendered` re-applies the same stylesheet-defer rewrite to anything
  // vite-ssg appends after rendering the route component, since that addition
  // happens after the Vite plugin pass.
  ssgOptions: {
    includedRoutes: () => ['/'],
    onPageRendered: (_route, html) => rewriteStylesheets(html),
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
