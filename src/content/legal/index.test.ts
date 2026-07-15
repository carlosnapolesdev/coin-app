import { describe, expect, it } from 'vitest'
import { LEGAL_SLUGS, getLegalDocument, isLegalSlug } from './index'

describe('legal content loader', () => {
  it('exposes exactly the four legal slugs', () => {
    expect([...LEGAL_SLUGS]).toEqual(['privacy', 'terms', 'cookies', 'legal-notice'])
  })

  it('guards slugs with isLegalSlug', () => {
    expect(isLegalSlug('privacy')).toBe(true)
    expect(isLegalSlug('nope')).toBe(false)
  })

  it('returns the Spanish document for every slug', () => {
    for (const slug of LEGAL_SLUGS) {
      const doc = getLegalDocument(slug, 'es')
      expect(doc.slug).toBe(slug)
      expect(doc.sections.length).toBeGreaterThan(0)
      expect(doc.sections.every((s) => s.id && s.heading && s.blocks.length > 0)).toBe(true)
    }
  })
})

describe('english translations', () => {
  it('mirror the Spanish section ids for every slug', () => {
    for (const slug of LEGAL_SLUGS) {
      const es = getLegalDocument(slug, 'es')
      const en = getLegalDocument(slug, 'en')
      expect(en).not.toBe(es)
      expect(en.sections.map((s) => s.id)).toEqual(es.sections.map((s) => s.id))
      expect(en.updatedAt).toBe(es.updatedAt)
    }
  })
})
