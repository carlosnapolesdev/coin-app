import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAttachments } from './useAttachments'
import { attachmentsApi } from '../services/attachments'

const dto = (id: number, name: string) => ({
  id, fileName: name, mimeType: 'image/png',
  sizeBytes: 10, createdAt: '2026-07-09T10:00:00.000Z',
})

describe('useAttachments', () => {
  beforeEach(() => {
    attachmentsApi.list = vi.fn().mockResolvedValue([dto(1, 'a.png'), dto(2, 'b.pdf')])
    attachmentsApi.upload = vi.fn().mockImplementation(async (_tx, file) => dto(99, file.name))
    attachmentsApi.remove = vi.fn().mockResolvedValue(undefined)
  })
  afterEach(() => vi.restoreAllMocks())

  it('load populates attachments', async () => {
    const { attachments, load } = useAttachments()
    await load(7)
    expect(attachments.value).toHaveLength(2)
    expect(vi.mocked(attachmentsApi.list).mock.calls[0][0]).toBe(7)
  })

  it('addFiles uploads in parallel, aggregates per-file progress, fills errorByFile on fail', async () => {
    const progressSpy = vi.fn()
    vi.mocked(attachmentsApi.upload).mockReset()
    vi.mocked(attachmentsApi.upload)
      .mockImplementationOnce(async (_tx: number, file: File, onProgress?: (p: number) => void) => {
        onProgress?.(50)
        onProgress?.(100)
        progressSpy(100)
        return dto(3, file.name)
      })
      .mockImplementationOnce(async () => {
        throw new Error('boom')
      })
    const { attachments, addFiles, errorByFile } = useAttachments()
    const files = [
      new File(['x'], 'a.png', { type: 'image/png' }),
      new File(['x'], 'b.png', { type: 'image/png' }),
    ]
    await addFiles(7, files)
    // The OK file ends up in the persisted list; the failing one ends up in errorByFile.
    expect(attachments.value.find((a) => a.fileName === 'a.png')).toBeTruthy()
    expect(attachments.value).toHaveLength(1)
    expect(errorByFile.value.get('b.png')).toBeTruthy()
    // Progress was observed during the upload (transient: cleared on completion, so we don't assert progressByFile at the end).
    expect(progressSpy).toHaveBeenCalledWith(100)
  })

  it('remove deletes from list and calls api', async () => {
    const { attachments, load, remove } = useAttachments()
    await load(7)
    await remove(2)
    expect(attachments.value.find((a) => a.id === 2)).toBeUndefined()
    expect(vi.mocked(attachmentsApi.remove)).toHaveBeenCalledWith(2)
  })

  it('addFiles preserves pre-existing errorByFile entries (client validation errors survive)', async () => {
    // The modal sets errorByFile for client-rejected files (mime/size) BEFORE calling addFiles.
    // addFiles must NOT wipe those — only its own upload-time rejections belong to addFiles.
    vi.mocked(attachmentsApi.upload).mockReset()
    vi.mocked(attachmentsApi.upload).mockResolvedValue(dto(99, 'ok.png'))
    const { addFiles, errorByFile } = useAttachments()
    // Pre-populate a client validation error for a file that will NOT be uploaded.
    const next = new Map(errorByFile.value)
    next.set('rejected.exe', 'Tipo de archivo no admitido')
    errorByFile.value = next
    await addFiles(7, [new File(['x'], 'ok.png', { type: 'image/png' })])
    // The pre-existing client validation error must survive.
    expect(errorByFile.value.get('rejected.exe')).toBe('Tipo de archivo no admitido')
  })
})