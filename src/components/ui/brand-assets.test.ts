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

  it('recorta el padding del icono para que la marca llene la caja', () => {
    // Sin este recuadro la marca ocupa ~66% del viewBox en vez de ~83%, y los
    // offsets de .wm-logo-* (calculados a ojo sobre el logo anterior) fallan.
    const viewBoxes = watermarks.map((wm) => wm.match(/viewBox='([^']+)'/)?.[1])

    expect(new Set(viewBoxes).size).toBe(1)

    const [minX, minY, width, height] = viewBoxes[0]!.split(/\s+/).map(Number)
    expect(width).toBeCloseTo(height, 2)

    // Caja real de la marca: el anillo (r=9.3, centro ~16.03/16.99) más su trazo.
    const extent = 9.3 + 2.6 / 2
    const mark = { x0: 16.03 - extent, y0: 16.99 - extent, size: extent * 2 }

    expect(minX).toBeLessThan(mark.x0)
    expect(minY).toBeLessThan(mark.y0)
    expect(minX + width).toBeGreaterThan(mark.x0 + mark.size)
    expect(minY + height).toBeGreaterThan(mark.y0 + mark.size)
    expect(mark.size / width).toBeCloseTo(20 / 24, 2)
  })

  it('mantiene alineadas las capas de cada área de watermark', () => {
    // background-image / -size / -position son listas paralelas: si una queda
    // corta al añadir una instancia, CSS la recicla en ciclo y las figuras
    // aparecen en sitios que nadie eligió.
    const areas = Array.from(
      styles.matchAll(/\.(wm-logo-[\w-]+)\s*\{([^}]+)\}/g),
      ([, name, body]) => ({ name, body }),
    )

    // .wm-logo-main se redeclara por tramo (@media), así que hay más bloques
    // que áreas; lo que importa es que cada bloque sea coherente consigo mismo.
    expect(new Set(areas.map((area) => area.name))).toEqual(
      new Set(['wm-logo-side', 'wm-logo-main', 'wm-logo-auth']),
    )

    // Corta por comas de nivel superior: calc(50% - 5rem) no lleva, pero
    // cualquier función futura que sí las tenga no debe partir la cuenta.
    const layers = (body: string, prop: string) => {
      const value = body.match(new RegExp(`${prop}:\\s*([^;]+);`))?.[1]
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

    for (const { name, body } of areas) {
      const images = layers(body, 'background-image')
      expect(images).toBeGreaterThan(0)
      expect({ area: name, size: layers(body, 'background-size') }).toEqual({
        area: name,
        size: images,
      })
      expect({ area: name, position: layers(body, 'background-position') }).toEqual({
        area: name,
        position: images,
      })
    }
  })

  it('tiñe cada watermark según su tema', () => {
    const themes = [
      { color: '#14170F', opacity: '.04' },
      { color: '#EDF1EC', opacity: '.05' },
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
