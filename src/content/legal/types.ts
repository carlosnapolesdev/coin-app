export type LegalSlug = 'privacy' | 'terms' | 'cookies' | 'legal-notice'

export type LegalBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'note'; text: string }
  | { kind: 'placeholder'; text: string }

export interface LegalSection {
  id: string
  heading: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  slug: LegalSlug
  updatedAt: string // ISO date, e.g. '2026-07-14'
  intro?: string
  sections: LegalSection[]
}
