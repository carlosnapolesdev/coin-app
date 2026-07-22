import { describe, expect, it } from 'vitest'
import router from './index'

describe('landing route', () => {
  it('resolves the root path to the landing view', () => {
    const resolved = router.resolve('/')
    expect(resolved.name).toBe('landing')
  })

  it('marks the landing as a public, indexable route (no requiresAuth, no publicOnly)', () => {
    const resolved = router.resolve('/')
    expect(resolved.meta.requiresAuth).toBeFalsy()
    expect(resolved.meta.publicOnly).toBeFalsy()
    expect(resolved.meta.authenticatedRedirect).toBe('dashboard')
  })
})