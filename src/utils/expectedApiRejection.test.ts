import { describe, expect, it } from 'vitest'
import { isExpectedApiRejection } from './expectedApiRejection'

const axiosErrorWithStatus = (status: number) => ({
  isAxiosError: true,
  response: { status },
})

describe('isExpectedApiRejection', () => {
  it('treats a rejected password change as expected', () => {
    // The case that started this: a 400 meaning "your current password is
    // wrong" was mailing the administrator on every typo.
    expect(isExpectedApiRejection(axiosErrorWithStatus(400))).toBe(true)
  })

  it.each([401, 403, 409, 422])('treats %i as expected', (status) => {
    expect(isExpectedApiRejection(axiosErrorWithStatus(status))).toBe(true)
  })

  it.each([500, 502, 503])('treats %i as a fault worth reporting', (status) => {
    expect(isExpectedApiRejection(axiosErrorWithStatus(status))).toBe(false)
  })

  it('treats a 404 as a fault worth reporting', () => {
    // A missing resource is a bug in the client's assumptions, not something
    // the user can correct by retyping.
    expect(isExpectedApiRejection(axiosErrorWithStatus(404))).toBe(false)
  })

  it('reports a network failure with no response at all', () => {
    expect(isExpectedApiRejection({ isAxiosError: true })).toBe(false)
  })

  it('reports anything that is not an axios error', () => {
    // A TypeError thrown while handling the response must never be swallowed
    // just because it happened inside the same catch.
    expect(isExpectedApiRejection(new TypeError('cannot read property'))).toBe(false)
    expect(isExpectedApiRejection('boom')).toBe(false)
    expect(isExpectedApiRejection(null)).toBe(false)
  })
})
