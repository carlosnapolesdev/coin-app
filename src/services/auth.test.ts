import { afterEach, describe, expect, it, vi } from 'vitest'
import * as useLocaleModule from '../composables/useLocale'

vi.mock('./api', () => ({
  default: { post: vi.fn(), get: vi.fn(), patch: vi.fn() },
}))

describe('changeLanguage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('applies the locale locally without calling the backend when logged out', async () => {
    const setLocaleSpy = vi.spyOn(useLocaleModule, 'setLocale')
    const api = (await import('./api')).default
    const { changeLanguage } = await import('./auth')

    await changeLanguage('es')

    expect(setLocaleSpy).toHaveBeenCalledWith('es')
    expect(api.patch).not.toHaveBeenCalled()
  })
})
