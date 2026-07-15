import { describe, expect, it } from 'vitest'
import en from './locales/en'
import es from './locales/es'
import pt from './locales/pt'

describe('legal i18n keys', () => {
  it('define a title for each legal page in every locale', () => {
    for (const messages of [en, es, pt]) {
      expect(messages.legal.privacy.title).toBeTruthy()
      expect(messages.legal.terms.title).toBeTruthy()
      expect(messages.legal.cookies.title).toBeTruthy()
      expect(messages.legal.legalNotice.title).toBeTruthy()
    }
  })

  it('define the registration consent copy in every locale', () => {
    for (const messages of [en, es, pt]) {
      expect(messages.auth.register.consent.privacy).toBeTruthy()
      expect(messages.auth.register.errors.consentRequired).toBeTruthy()
    }
  })
})
