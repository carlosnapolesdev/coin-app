import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import type { AttachmentDto } from '../services/attachments'
import { attachmentsApi } from '../services/attachments'
import { useAttachmentBlobUrls } from './useAttachmentBlobUrls'

const image = (id: number): AttachmentDto => ({
  id,
  fileName: `img-${id}.png`,
  mimeType: 'image/png',
  sizeBytes: 10,
  createdAt: '2026-07-09T10:00:00.000Z',
})

const pdf = (id: number): AttachmentDto => ({
  id,
  fileName: `doc-${id}.pdf`,
  mimeType: 'application/pdf',
  sizeBytes: 10,
  createdAt: '2026-07-09T10:00:00.000Z',
})

describe('useAttachmentBlobUrls', () => {
  beforeEach(() => {
    ;(URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn()
    vi.spyOn(attachmentsApi, 'fetchInlineBlobUrl').mockImplementation(
      async (id: number) => `blob:fake-${id}`,
    )
  })
  afterEach(() => vi.restoreAllMocks())

  it('loads a blob URL for each image attachment', async () => {
    const attachments = ref<AttachmentDto[]>([image(1), image(2)])
    const scope = effectScope()
    const { urlById } = scope.run(() => useAttachmentBlobUrls(attachments))!

    await vi.waitFor(() => {
      expect(urlById.value.get(1)).toBe('blob:fake-1')
      expect(urlById.value.get(2)).toBe('blob:fake-2')
    })
    scope.stop()
  })

  it('does not fetch blobs for non-image attachments', async () => {
    const attachments = ref<AttachmentDto[]>([pdf(3), image(4)])
    const scope = effectScope()
    const { urlById } = scope.run(() => useAttachmentBlobUrls(attachments))!

    await vi.waitFor(() => expect(urlById.value.get(4)).toBe('blob:fake-4'))
    expect(attachmentsApi.fetchInlineBlobUrl).not.toHaveBeenCalledWith(3)
    expect(urlById.value.has(3)).toBe(false)
    scope.stop()
  })

  it('revokes and drops the URL when an attachment leaves the list', async () => {
    const attachments = ref<AttachmentDto[]>([image(1), image(2)])
    const scope = effectScope()
    const { urlById } = scope.run(() => useAttachmentBlobUrls(attachments))!
    await vi.waitFor(() => expect(urlById.value.size).toBe(2))

    attachments.value = [image(2)]

    await vi.waitFor(() => expect(urlById.value.has(1)).toBe(false))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-1')
    expect(urlById.value.get(2)).toBe('blob:fake-2')
    scope.stop()
  })

  it('revokes every URL when the owning scope is disposed', async () => {
    const attachments = ref<AttachmentDto[]>([image(1), image(2)])
    const scope = effectScope()
    const { urlById } = scope.run(() => useAttachmentBlobUrls(attachments))!
    await vi.waitFor(() => expect(urlById.value.size).toBe(2))

    scope.stop()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-1')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-2')
  })

  it('keeps other thumbnails when one fetch fails', async () => {
    vi.spyOn(attachmentsApi, 'fetchInlineBlobUrl').mockImplementation(
      async (id: number) => {
        if (id === 1) throw new Error('boom')
        return `blob:fake-${id}`
      },
    )
    const attachments = ref<AttachmentDto[]>([image(1), image(2)])
    const scope = effectScope()
    const { urlById } = scope.run(() => useAttachmentBlobUrls(attachments))!

    await vi.waitFor(() => expect(urlById.value.get(2)).toBe('blob:fake-2'))
    expect(urlById.value.has(1)).toBe(false)
    scope.stop()
  })
})
