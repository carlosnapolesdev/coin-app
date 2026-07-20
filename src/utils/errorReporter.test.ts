import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logError, setErrorReporter } from './logError'
import { installErrorReporter, __resetReporterDedup } from './errorReporter'

describe('errorReporter', () => {
  beforeEach(() => {
    __resetReporterDedup()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true } as Response)))
  })

  afterEach(() => {
    setErrorReporter(null)
    vi.unstubAllGlobals()
  })

  it('posts the error to the endpoint', async () => {
    installErrorReporter('/api/client-errors')

    logError('onboarding.sync', new TypeError('boom'))
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/client-errors')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.context).toBe('onboarding.sync')
    expect(body.errorName).toBe('TypeError')
    expect(body.message).toBe('boom')
  })

  it('does not resend the same fingerprint within a session', async () => {
    installErrorReporter('/api/client-errors')

    logError('onboarding.sync', new TypeError('boom'))
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    logError('onboarding.sync', new TypeError('boom'))
    await new Promise((r) => setTimeout(r, 10))

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('sends different contexts separately', async () => {
    installErrorReporter('/api/client-errors')

    logError('a', new TypeError('boom'))
    logError('b', new TypeError('boom'))
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
  })

  it('strips the query string from the reported url', async () => {
    // /reset-password?token=<raw> lleva el token de recuperación en la query.
    // Sin recortarla, ese token acaba almacenado en client_errors, que retiene
    // 90 días, por el simple hecho de que falle algo en esa pantalla.
    const original = window.location.href
    Object.defineProperty(window, 'location', {
      value: new URL('https://crecik.com/reset-password?token=SECRETO123'),
      writable: true,
    })
    installErrorReporter('/api/client-errors')

    logError('reset.load', new TypeError('boom'))
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
    )
    expect(body.url).toBe('https://crecik.com/reset-password')
    expect(body.url).not.toContain('SECRETO123')
    Object.defineProperty(window, 'location', { value: new URL(original), writable: true })
  })

  it('falls back to the error name when the message is empty', async () => {
    // El DTO exige message de al menos 1 carácter: un `new Error()` sin mensaje
    // recibiría 400 y el reporte se perdería, tragado por el catch del envío.
    installErrorReporter('/api/client-errors')

    logError('empty.message', new RangeError(''))
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
    )
    expect(body.message).toBe('RangeError')
  })

  it('does not recurse when the POST itself fails', async () => {
    // El test más importante del plan: reportar un fallo de reporte es
    // recursión infinita. Un rechazo debe morir ahí.
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    installErrorReporter('/api/client-errors')

    logError('onboarding.sync', new TypeError('boom'))
    await new Promise((r) => setTimeout(r, 20))

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('handles a non-Error value without throwing', async () => {
    installErrorReporter('/api/client-errors')

    logError('weird', 'just a string')
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
    )
    expect(body.errorName).toBe('UnknownError')
    expect(body.message).toBe('just a string')
  })
})
