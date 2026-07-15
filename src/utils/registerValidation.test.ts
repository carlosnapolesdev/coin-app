import { describe, expect, it } from 'vitest'
import { validateRegisterStep1 } from './registerValidation'

const messages = {
  fullNameRequired: 'full name required',
  emailRequired: 'email required',
  passwordTooShort: 'password too short',
  consentRequired: 'consent required',
}

const validBase = { fullName: 'Ada', email: 'ada@example.com', password: 'longenough', acceptedLegal: true }

describe('validateRegisterStep1', () => {
  it('returns no errors for valid input with consent', () => {
    expect(validateRegisterStep1(validBase, messages)).toEqual({})
  })

  it('requires consent', () => {
    expect(validateRegisterStep1({ ...validBase, acceptedLegal: false }, messages)).toEqual({
      acceptedLegal: 'consent required',
    })
  })

  it('flags all missing fields at once', () => {
    expect(validateRegisterStep1({ fullName: '', email: '', password: 'x', acceptedLegal: false }, messages)).toEqual({
      fullName: 'full name required',
      email: 'email required',
      password: 'password too short',
      acceptedLegal: 'consent required',
    })
  })
})
