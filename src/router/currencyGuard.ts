// Pure decision for the router guard: fresh Google accounts have no base
// currency and must set one before using the app. Extracted from beforeEach so
// it can be unit-tested without a live router.
export function currencyGuardTarget(
  authed: boolean,
  requiresSetup: boolean | undefined,
  toName: string | null | undefined,
): 'welcome-currency' | 'dashboard' | null {
  if (!authed) return null
  if (requiresSetup && toName !== 'welcome-currency') return 'welcome-currency'
  if (!requiresSetup && toName === 'welcome-currency') return 'dashboard'
  return null
}
