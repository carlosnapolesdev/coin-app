import { afterEach, describe, expect, it, vi } from 'vitest'
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

  it('downloadUrl builds signed url with disposition and token', () => {
    vi.spyOn(authSession, 'getAccessToken').mockReturnValue('jwt-abc')
    const url = attachmentsApi.downloadUrl(99, 'inline')
    expect(url).toContain('/users/me/attachments/99/download')
    expect(url).toContain('disposition=inline')
    expect(url).toContain('token=jwt-abc')
  })

  it('remove deletes', async () => {
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: undefined })
    await attachmentsApi.remove(99)
    expect(del).toHaveBeenCalledWith('/users/me/attachments/99')
  })
})