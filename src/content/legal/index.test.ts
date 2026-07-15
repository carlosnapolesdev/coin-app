import { describe, expect, it } from 'vitest'
import { LEGAL_SLUGS, getLegalDocument, isLegalSlug } from './index'
import type { LegalSlug } from './types'

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

  it('falls back to Spanish for locales without a translation yet', () => {
    const slug: LegalSlug = 'privacy'
    expect(getLegalDocument(slug, 'en')).toBe(getLegalDocument(slug, 'es'))
  })
})
