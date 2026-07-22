import { describe, expect, it } from 'vitest'
import en from './locales/en'
import es from './locales/es'
import pt from './locales/pt'

describe('meta description and not-found i18n keys', () => {
  it('defines every meta description in every locale', () => {
    for (const messages of [en, es, pt]) {
      expect(messages.meta.description.default).toBeTruthy()
      expect(messages.meta.description.login).toBeTruthy()
      expect(messages.meta.description.register).toBeTruthy()
      expect(messages.meta.description.legalPrivacy).toBeTruthy()
      expect(messages.meta.description.legalTerms).toBeTruthy()
      expect(messages.meta.description.legalCookies).toBeTruthy()
      expect(messages.meta.description.legalNotice).toBeTruthy()
    }
  })

  it('defines the not-found copy in every locale', () => {
    for (const messages of [en, es, pt]) {
      expect(messages.notFound.title).toBeTruthy()
      expect(messages.notFound.message).toBeTruthy()
      expect(messages.notFound.cta).toBeTruthy()
    }
  })

  it('defines the landing meta description in every locale', () => {
    for (const messages of [en, es, pt]) {
      expect(messages.meta.description.landing).toBeTruthy()
    }
  })

  it('defines the landing copy in every locale', () => {
    for (const messages of [en, es, pt]) {
      expect(messages.landing.hero.title).toBeTruthy()
      expect(messages.landing.hero.subtitle).toBeTruthy()
      expect(messages.landing.hero.ctaPrimary).toBeTruthy()
      expect(messages.landing.hero.ctaSecondary).toBeTruthy()
      expect(messages.landing.hero.screenshotAlt).toBeTruthy()
      expect(messages.landing.features.title).toBeTruthy()
      for (const key of ['accounts', 'budgets', 'goals', 'recurring', 'reports'] as const) {
        expect(messages.landing.features[key].title).toBeTruthy()
        expect(messages.landing.features[key].body).toBeTruthy()
      }
      expect(messages.landing.how.title).toBeTruthy()
      for (const key of ['step1', 'step2', 'step3'] as const) {
        expect(messages.landing.how[key].title).toBeTruthy()
        expect(messages.landing.how[key].body).toBeTruthy()
      }
      expect(messages.landing.footer.tagline).toBeTruthy()
      expect(messages.landing.footer.legal).toBeTruthy()
      expect(messages.landing.footer.rights).toBeTruthy()
    }
  })
})
