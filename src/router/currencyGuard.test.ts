import { describe, expect, it } from 'vitest'
import { currencyGuardTarget } from './currencyGuard'

describe('currencyGuardTarget', () => {
  it('sends a user that needs setup to the welcome screen', () => {
    expect(currencyGuardTarget(true, true, 'dashboard')).toBe('welcome-currency')
  })
  it('does not loop when already on the welcome screen', () => {
    expect(currencyGuardTarget(true, true, 'welcome-currency')).toBeNull()
  })
  it('keeps a set-up user off the welcome screen', () => {
    expect(currencyGuardTarget(true, false, 'welcome-currency')).toBe('dashboard')
  })
  it('ignores anonymous users', () => {
    expect(currencyGuardTarget(false, true, 'dashboard')).toBeNull()
  })
  it('lets a set-up user navigate normally', () => {
    expect(currencyGuardTarget(true, false, 'transactions')).toBeNull()
  })
})
