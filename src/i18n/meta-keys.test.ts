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
})
