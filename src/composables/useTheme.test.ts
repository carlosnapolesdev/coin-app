import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveInitialTheme } from './useTheme'

describe('resolveInitialTheme', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('returns dark when no theme is stored, regardless of system preference', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('returns the stored theme when one is present', () => {
    window.localStorage.setItem('crecik-theme', 'light')
    expect(resolveInitialTheme()).toBe('light')
  })
})
