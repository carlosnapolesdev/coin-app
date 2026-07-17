import { onScopeDispose, ref, watch, type Ref } from 'vue'
import { attachmentsApi, type AttachmentDto } from '../services/attachments'

/**
 * Mantiene un `blob:` URL por cada adjunto de imagen de la lista, obtenido vía
 * fetch con header `Authorization` (attachmentsApi.fetchInlineBlobUrl). Así los
 * thumbnails nunca llevan el JWT en la URL del `<img src>` — el backend ya no
 * acepta `?token=`. Revoca cada URL cuando el adjunto sale de la lista y todas
 * al destruirse el scope del componente.
 */
export function useAttachmentBlobUrls(attachments: Ref<AttachmentDto[]>) {
  const urlById = ref<Map<number, string>>(new Map())
  const pending = new Set<number>()

  watch(
    attachments,
    (list) => {
      const imageIds = new Set(
        list.filter((a) => a.mimeType.startsWith('image/')).map((a) => a.id),
      )

      for (const [id, url] of urlById.value) {
        if (!imageIds.has(id)) {
          URL.revokeObjectURL(url)
          const next = new Map(urlById.value)
          next.delete(id)
          urlById.value = next
        }
      }

      for (const id of imageIds) {
        if (urlById.value.has(id) || pending.has(id)) continue
        pending.add(id)
        attachmentsApi
          .fetchInlineBlobUrl(id)
          .then((url) => {
            // El adjunto pudo salir de la lista mientras se descargaba.
            const stillWanted = attachments.value.some((a) => a.id === id)
            if (!stillWanted) {
              URL.revokeObjectURL(url)
              return
            }
            const next = new Map(urlById.value)
            next.set(id, url)
            urlById.value = next
          })
          .catch((err) => {
            console.error(`attachment thumbnail ${id} failed to load`, err)
          })
          .finally(() => pending.delete(id))
      }
    },
    { immediate: true, deep: true },
  )

  onScopeDispose(() => {
    for (const url of urlById.value.values()) URL.revokeObjectURL(url)
    urlById.value = new Map()
  })

  return { urlById }
}
