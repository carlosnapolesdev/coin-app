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

describe('portuguese translations', () => {
  it('mirror the Spanish section ids for every slug', () => {
    for (const slug of LEGAL_SLUGS) {
      const es = getLegalDocument(slug, 'es')
      const pt = getLegalDocument(slug, 'pt')
      expect(pt).not.toBe(es)
      expect(pt.sections.map((s) => s.id)).toEqual(es.sections.map((s) => s.id))
      expect(pt.updatedAt).toBe(es.updatedAt)
    }
  })
})

describe('self-hosted fonts legal copy', () => {
  const flatten = (doc: { sections: { blocks: { text?: string; items?: string[] }[] }[] }): string => {
    const parts: string[] = []
    for (const section of doc.sections) {
      for (const block of section.blocks) {
        if (block.text) parts.push(block.text)
        if (block.items) parts.push(...block.items)
      }
    }
    return parts.join('\n')
  }

  it('adds a typography section to privacy in every locale', () => {
    for (const locale of ['es', 'en', 'pt'] as const) {
      const privacy = getLegalDocument('privacy', locale)
      expect(privacy.sections.some((s) => s.id === 'tipografias')).toBe(true)
    }
  })

  it('removes Google Fonts from the privacy third-party list in every locale', () => {
    for (const locale of ['es', 'en', 'pt'] as const) {
      const privacy = getLegalDocument('privacy', locale)
      const terceros = privacy.sections.find((s) => s.id === 'terceros')
      expect(terceros, `privacy/${locale} is missing the terceros section`).toBeDefined()
      const items = (terceros!.blocks.flatMap((b) => ('items' in b ? b.items : []))).join('\n')
      expect(items).not.toContain('Google Fonts')
    }
  })

  it('removes Google Fonts from the cookies third-party paragraph in every locale', () => {
    for (const locale of ['es', 'en', 'pt'] as const) {
      const cookies = getLegalDocument('cookies', locale)
      const all = flatten(cookies)
      expect(all).not.toContain('Google Fonts')
    }
  })
})
