import { describe, expect, it } from 'vitest'
import { getInitials } from './initials'

describe('getInitials', () => {
  it('takes first + last word initials from a full name', () => {
    expect(getInitials('Marco Napoles', 'x@y.com')).toBe('MN')
  })
  it('uses a single letter for a one-word name', () => {
    expect(getInitials('Marco', 'x@y.com')).toBe('M')
  })
  it('collapses extra whitespace', () => {
    expect(getInitials('  Ana   Maria  Lopez ', null)).toBe('AL')
  })
  it('falls back to the email when the name is blank', () => {
    expect(getInitials('   ', 'napoles@example.com')).toBe('N')
  })
  it('falls back to the email when the name is missing', () => {
    expect(getInitials(null, 'zoe@example.com')).toBe('Z')
  })
  it('returns a placeholder when nothing is available', () => {
    expect(getInitials(null, null)).toBe('?')
  })
})
