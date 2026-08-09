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

  it('encaja la marca en un azulejo cuadrado 76×76', () => {
    const viewBoxes = watermarks.map((wm) => wm.match(/viewBox='([^']+)'/)?.[1])
    expect(new Set(viewBoxes).size).toBe(1)

    const [minX, minY, width, height] = viewBoxes[0]!.split(/\s+/).map(Number)
    // El azulejo ya no recorta por viewBox: mide 76×76 y la marca se encaja por
    // transform. Cuadrado a propósito: el desfase de la segunda capa es media
    // celda en ambos ejes, y solo cuadra si el azulejo lo es (ver .wm-pattern).
    expect([minX, minY, width, height]).toEqual([0, 0, 76, 76])
    expect(width).toBe(height)

    // La marca (nativa 25.44) se escala a ~34px vía scale() dentro del azulejo.
    for (const wm of watermarks) {
      const scale = wm.match(/scale\(([\d.]+)\)/)?.[1]
      expect(Number(scale)).toBeCloseTo(34 / 25.44, 2)

      // Y va centrada: descentrarla rompería el tresbolillo, porque la segunda
      // capa asume que la marca cae justo en el centro de la celda.
      const center = wm.match(/translate\((-?[\d.]+) (-?[\d.]+)\)/)
      expect([Number(center?.[1]), Number(center?.[2])]).toEqual([width / 2, height / 2])
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

    // El desfase de la segunda capa es media celda en LOS DOS ejes: así el
    // patrón se lee igual en horizontal que en vertical. Desfasar solo uno deja
    // el otro eje en filas perfectamente alineadas.
    const size = body!.match(/background-size:\s*(\d+)px (\d+)px/)!.slice(1).map(Number)
    const offset = body!.match(/background-position:\s*0 0,\s*(\d+)px (\d+)px/)!.slice(1).map(Number)
    expect(size[0]).toBe(size[1])
    expect(offset).toEqual([size[0] / 2, size[1] / 2])
  })

  it('tiñe cada watermark según su tema', () => {
    const themes = [
      { color: '#0F6B64', opacity: '.05' },
      { color: '#EDF1EC', opacity: '.03' },
    ]

    watermarks.forEach((watermark, index) => {
      const { color, opacity } = themes[index]
      expect(watermark).toContain(`stroke='${color}'`)
      expect(watermark).toContain(`opacity='${opacity}'`)
      // La punta de flecha va rellena: sin fill quedaría un triángulo hueco.
      expect(attrs(watermark, faviconPaths[2])).toMatchObject({ fill: color })
    })
  })

  it('deja el watermark igual de presente en ambos temas', () => {
    // Las opacidades crudas NO son comparables entre temas: el mismo alfa rinde
    // el doble sobre un lienzo casi negro que sobre uno casi blanco. Lo que se
    // compara es cuánto se separa la marca compuesta de su propio lienzo, en
    // L* (CIE Lab), que sí es perceptualmente uniforme.
    const channel = (c: number) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    const lightness = (rgb: number[]) => {
      const y = 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
      // Rama lineal para los casi-negros: la cúbica solo vale por encima de 0.008856.
      return y <= 0.008856 ? 903.3 * y : 116 * Math.cbrt(y) - 16
    }

    const canvasOf = (block: string) => {
      const m = block.match(/--color-bg:\s*(\d+)\s+(\d+)\s+(\d+)/)
      if (!m) throw new Error('--color-bg no encontrado en el bloque de tema')
      return [Number(m[1]), Number(m[2]), Number(m[3])]
    }
    const darkAt = styles.indexOf('.dark {')
    const canvases = [canvasOf(styles.slice(0, darkAt)), canvasOf(styles.slice(darkAt))]

    // Separación marca/lienzo de cada tema, en el mismo orden que `watermarks`.
    const separations = watermarks.map((watermark, index) => {
      const hex = watermark.match(/stroke='#([0-9A-Fa-f]{6})'/)![1]
      const stroke = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
      const alpha = Number(watermark.match(/opacity='([\d.]+)'/)![1])
      const canvas = canvases[index]
      const composite = canvas.map((c, i) => c + alpha * (stroke[i] - c))
      return Math.abs(lightness(composite) - lightness(canvas))
    })

    // Ambos rondan ΔL* 2,6-2,7. El margen del 15% deja retocar la paleta sin
    // que salte el test, pero no deja subir un tema y olvidarse del otro.
    const [light, dark] = separations
    expect(dark / light).toBeGreaterThan(0.85)
    expect(dark / light).toBeLessThan(1.15)
  })
})
