import type { LegalDocument, LegalSlug } from './types'
import type { LocaleCode } from '../../composables/useLocale'
import privacyEs from './es/privacy'
import termsEs from './es/terms'
import cookiesEs from './es/cookies'
import legalNoticeEs from './es/legal-notice'

export type { LegalDocument, LegalSlug, LegalSection, LegalBlock } from './types'

export const LEGAL_SLUGS = ['privacy', 'terms', 'cookies', 'legal-notice'] as const

export const LEGAL_TITLE_KEYS: Record<LegalSlug, string> = {
  privacy: 'legal.privacy.title',
  terms: 'legal.terms.title',
  cookies: 'legal.cookies.title',
  'legal-notice': 'legal.legalNotice.title',
}

export const LEGAL_ROUTE_PATHS: Record<LegalSlug, string> = {
  privacy: '/legal/privacy',
  terms: '/legal/terms',
  cookies: '/legal/cookies',
  'legal-notice': '/legal/legal-notice',
}

const registry: Partial<Record<LocaleCode, Partial<Record<LegalSlug, LegalDocument>>>> = {
  es: {
    privacy: privacyEs,
    terms: termsEs,
    cookies: cookiesEs,
    'legal-notice': legalNoticeEs,
  },
}

export const isLegalSlug = (value: string): value is LegalSlug =>
  (LEGAL_SLUGS as readonly string[]).includes(value)

export const getLegalDocument = (slug: LegalSlug, locale: LocaleCode): LegalDocument =>
  registry[locale]?.[slug] ?? registry.es![slug]!
