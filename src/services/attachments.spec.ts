import { afterEach, describe, expect, it, vi } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import api from './api'
import * as authSession from './auth-session'
import { attachmentsApi } from './attachments'

const dummyDto = {
  id: 1, fileName: 'r.pdf', mimeType: 'application/pdf',
  sizeBytes: 12, createdAt: '2026-07-09T10:00:00.000Z',
}

describe('attachmentsApi', () => {
  afterEach(() => vi.restoreAllMocks())

  it('list', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [dummyDto] })
    const out = await attachmentsApi.list(7)
    expect(get).toHaveBeenCalledWith('/users/me/transactions/7/attachments')
    expect(out).toEqual([dummyDto])
  })

  it('upload posts FormData with progress callback wired', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: dummyDto })
    const onProgress = vi.fn()
    const file = new File(['x'], 'r.pdf', { type: 'application/pdf' })
    await attachmentsApi.upload(7, file, onProgress)
    expect(post).toHaveBeenCalledWith(
      '/users/me/transactions/7/attachments',
      expect.any(FormData),
      expect.objectContaining({ onUploadProgress: expect.any(Function) }),
    )
  })

  it('upload clears Content-Type so axios transformRequest does not JSON-stringify FormData', async () => {
    // Regression test: src/services/api.ts sets the instance default
    // `Content-Type: application/json`. axios 1.14's default transformRequest
    // JSON-serializes FormData bodies when the Content-Type includes
    // 'application/json' (see node_modules/axios/dist/node/axios.cjs:1511-1521
    // — `return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data`).
    // Without the explicit per-call override, the server receives a JSON body,
    // multer finds no `file` field, and the controller throws
    // "Missing file field" — the symptom that motivated this override.
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: dummyDto })
    const file = new File(['x'], 'r.pdf', { type: 'application/pdf' })
    await attachmentsApi.upload(7, file)
    expect(post).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': undefined }),
      }),
    )
  })

  it('upload sends FormData (not JSON) through real axios + a custom adapter', async () => {
    // Stronger integration-style regression: run a real axios call (with
    // transformRequest) by installing a custom adapter that captures the
    // outbound config. If axios 1.14 JSON-stringifies FormData, this fails;
    // if multipart is preserved, it passes.
    let capturedConfig: InternalAxiosRequestConfig | undefined
    const previousAdapter = api.defaults.adapter
    api.defaults.adapter = (config) => {
      capturedConfig = config
      return Promise.resolve({
        data: dummyDto,
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      })
    }
    try {
      const file = new File(['x'], 'r.pdf', { type: 'application/pdf' })
      await attachmentsApi.upload(7, file)
    } finally {
      api.defaults.adapter = previousAdapter
    }
    // Falla explícitamente si el adaptador nunca corrió, en vez de dar un falso
    // verde por comparar contra `undefined`.
    expect(capturedConfig).toBeDefined()
    // After transformRequest: body must still be FormData, not a stringified blob.
    expect(capturedConfig!.data).toBeInstanceOf(FormData)
  })

  it('remove deletes', async () => {
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: undefined })
    await attachmentsApi.remove(99)
    expect(del).toHaveBeenCalledWith('/users/me/attachments/99')
  })

  describe('fetchInlineBlobUrl (PDF blob URL flow)', () => {
    // Nota: el window.open ya NO vive aquí — lo hace el panel síncronamente dentro del
    // clic para no ser bloqueado por el navegador tras el await. Este servicio solo
    // obtiene el blob URL vía fetch con Authorization header (sin token en la URL).
    it('fetches with Authorization header (no token in URL) and returns a blob: URL', async () => {
      vi.spyOn(authSession, 'getAccessToken').mockReturnValue('jwt-abc')
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['pdf-bytes'], { type: 'application/pdf' }),
      } as Response)

      const blobUrl = await attachmentsApi.fetchInlineBlobUrl(99)

      // Authorization must be in the header, NOT in the URL.
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/attachments/99/download?disposition=inline'),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer jwt-abc' }) }),
      )
      const fetchUrl = fetchSpy.mock.calls[0]![0] as string
      expect(fetchUrl).not.toContain('token=')
      expect(blobUrl).toMatch(/^blob:/)
    })

    it('throws when no auth token is available', async () => {
      vi.spyOn(authSession, 'getAccessToken').mockReturnValue(null)
      await expect(attachmentsApi.fetchInlineBlobUrl(99)).rejects.toThrow(/authenticated/)
    })

    it('throws on non-2xx response', async () => {
      vi.spyOn(authSession, 'getAccessToken').mockReturnValue('jwt-abc')
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404 } as Response)
      await expect(attachmentsApi.fetchInlineBlobUrl(99)).rejects.toThrow(/404/)
    })
  })
})