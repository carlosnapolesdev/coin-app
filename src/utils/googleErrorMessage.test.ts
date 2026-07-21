import axios from 'axios'
import { describe, expect, it } from 'vitest'
import { googleErrorMessage } from './googleErrorMessage'

const t = (k: string) => k

const axiosErrWithCode = (code: string) =>
  new axios.AxiosError('boom', undefined, undefined, undefined, {
    data: { code },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: undefined as never,
  })

describe('googleErrorMessage', () => {
  it('maps the unverified-email code', () => {
    expect(googleErrorMessage(axiosErrWithCode('GOOGLE_EMAIL_UNVERIFIED'), t)).toBe(
      'auth.google.errors.emailUnverified',
    )
  })
  it('maps the invalid-token code', () => {
    expect(googleErrorMessage(axiosErrWithCode('GOOGLE_TOKEN_INVALID'), t)).toBe(
      'auth.google.errors.tokenInvalid',
    )
  })
  it('falls back to a generic message otherwise', () => {
    expect(googleErrorMessage(new Error('x'), t)).toBe('auth.google.errors.generic')
  })
})