import { describe, expect, it } from 'vitest'
import { lightboxIndexFor } from './lightboxIndex'

const img = (id: number) => ({ id, fileName: `r${id}.png`, mimeType: 'image/png', url: `?id=${id}` })

describe('lightboxIndexFor', () => {
  it('returns the index when image is in the filtered list', () => {
    expect(lightboxIndexFor([img(1), img(2), img(3)], 2)).toBe(1)
  })

  it('returns -1 when image is not present', () => {
    expect(lightboxIndexFor([img(1), img(2)], 99)).toBe(-1)
  })

  it('returns the correct index in a list that starts with a skipped non-image slot', () => {
    // Reproduces the bug: when the parent attachment list is [pdf, pngA, pngB] but
    // the lightbox receives [pngA, pngB] (filtered), clicking pngA must open at index 0,
    // not index 1 (which would skip to pngB).
    expect(lightboxIndexFor([img(10), img(11)], 10)).toBe(0)
    expect(lightboxIndexFor([img(10), img(11)], 11)).toBe(1)
  })

  it('returns -1 when called with a non-image id (e.g. a PDF)', () => {
    expect(lightboxIndexFor([img(1), img(2)], 5)).toBe(-1)
  })
})
