/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Vite deja `?raw` vacío para CSS, así que se leen los tres del disco.
// Las rutas cuelgan de import.meta.url para no depender del cwd de vitest.
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

const favicon = read('../../../public/favicon.svg')
const brandMark = read('./BrandMark.vue')
const styles = read('../../style.css')

/** El favicon es la fuente de verdad: BrandMark y los watermarks lo replican. */
const paths = (svg: string) =>
  Array.from(svg.matchAll(/<path[^>]+d=["']([^"']+)["']/g), ([, d]) => d)

const attrs = (svg: string, d: string) => {
  const tag = svg.match(new RegExp(`<path[^>]*d=["']${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`))
  if (!tag) return null
  return Object.fromEntries(
    Array.from(tag[0].matchAll(/([\w-]+)=["']([^"']*)["']/g), ([, k, v]) => [k, v]),
  )
}

const watermarks = Array.from(
  styles.matchAll(/--wm-logo:\s*url\("data:image\/svg\+xml,([^"]+)"\)/g),
  ([, encoded]) => decodeURIComponent(encoded),
)

const faviconPaths = paths(favicon)

describe('brand assets', () => {
  it('parte de un favicon con las tres piezas del logo', () => {
    expect(faviconPaths).toHaveLength(3)
  })

  it('mantiene BrandMark alineado con el favicon', () => {
    // BrandMark conserva el viewBox completo: su teja redondeada hace de fondo
    // del icono, igual que el <rect> del favicon.
    expect(brandMark).toContain('viewBox="0 0 32 32"')
    expect(paths(brandMark)).toEqual(faviconPaths)

    faviconPaths.forEach((d) => {
      expect(attrs(brandMark, d)).toMatchObject({
        'stroke-width': attrs(favicon, d)!['stroke-width'],
      })
    })
  })

  it('usa la geometría del favicon en ambos watermarks', () => {
    expect(watermarks).toHaveLength(2)

    for (const watermark of watermarks) {
      expect(paths(watermark)).toEqual(faviconPaths)

      faviconPaths.forEach((d) => {
        expect(attrs(watermark, d)).toMatchObject({
          'stroke-width': attrs(favicon, d)!['stroke-width'],
        })
      })
    }
  })

  it('encaja la marca en un azulejo 54×108', () => {
    const viewBoxes = watermarks.map((wm) => wm.match(/viewBox='([^']+)'/)?.[1])
    expect(new Set(viewBoxes).size).toBe(1)

    const [minX, minY, width, height] = viewBoxes[0]!.split(/\s+/).map(Number)
    // El azulejo ya no recorta por viewBox: mide 54×108 y la marca se encaja por transform.
    expect([minX, minY, width, height]).toEqual([0, 0, 54, 108])

    // La marca (nativa 25.44) se escala a ~34px vía scale() dentro del azulejo.
    for (const wm of watermarks) {
      const scale = wm.match(/scale\(([\d.]+)\)/)?.[1]
      expect(Number(scale)).toBeCloseTo(34 / 25.44, 2)
    }
  })

  it('mantiene alineadas las capas del patrón', () => {
    // Ya no hay tres áreas ni wm-logo-side: una sola clase .wm-pattern.
    expect(styles).not.toMatch(/\.wm-logo-(side|main|auth)\b/)

    const body = styles.match(/\.wm-pattern\s*\{([^}]+)\}/)?.[1]
    expect(body).toBeTruthy()

    // background-image / -size / -position son listas paralelas: si una queda
    // corta, CSS la recicla en ciclo y las capas se descuadran.
    const layers = (prop: string) => {
      const value = body!.match(new RegExp(`${prop}:\\s*([^;]+);`))?.[1]
      if (!value) return 0
      let depth = 0
      let count = 1
      for (const char of value) {
        if (char === '(') depth++
        else if (char === ')') depth--
        else if (char === ',' && depth === 0) count++
      }
      return count
    }

    const images = layers('background-image')
    expect(images).toBe(2)
    expect(layers('background-size')).toBe(images)
    expect(layers('background-position')).toBe(images)
  })

  it('tiñe cada watermark según su tema', () => {
    const themes = [
      { color: '#0F6B64', opacity: '.05' },
      { color: '#EDF1EC', opacity: '.06' },
    ]

    watermarks.forEach((watermark, index) => {
      const { color, opacity } = themes[index]
      expect(watermark).toContain(`stroke='${color}'`)
      expect(watermark).toContain(`opacity='${opacity}'`)
      // La punta de flecha va rellena: sin fill quedaría un triángulo hueco.
      expect(attrs(watermark, faviconPaths[2])).toMatchObject({ fill: color })
    })
  })
})
