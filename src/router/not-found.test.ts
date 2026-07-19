import { describe, expect, it } from 'vitest'
import router from './index'

describe('catch-all route', () => {
  it('resolves unknown paths to the not-found view', () => {
    expect(router.resolve('/definitely/not/a/route').name).toBe('not-found')
  })

  it('keeps resolving real routes normally', () => {
    expect(router.resolve('/login').name).toBe('login')
  })
})
