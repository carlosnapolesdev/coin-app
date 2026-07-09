<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { attachmentsApi } from '../../services/attachments'
import { useAttachments } from '../../composables/useAttachments'
import AttachmentLightbox from '../common/AttachmentLightbox.vue'
import { lightboxIndexFor } from '../common/lightboxIndex'
import { ConfirmDialog } from '../ui'

const props = defineProps<{
  /** ID de la transacción a cuyos adjuntos apunta el panel. */
  transactionId: number
}>()

const { t } = useI18n()
const attach = useAttachments()
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const filePicker = ref<HTMLInputElement | null>(null)
const confirmDialogOpen = ref(false)
const attachmentToRemove = ref<number | null>(null)
const isDragOver = ref(false)
// Recordamos los Files del cliente para poder reintentar una subida fallida por nombre.
const pendingFiles = new Map<string, File>()

// Carga los adjuntos de la transacción cuando cambia el id (p. ej. cuando el modal
// pasa de "create" a "edit" o el padre abre el modal sobre otra transacción). Con
// `:key="transactionId"` en el padre, este componente se remonta en lugar de
// recibir updates del prop, pero este watch cubre ambos casos sin asumir montaje.
watch(
  () => props.transactionId,
  async (id) => {
    await attach.load(id)
  },
  { immediate: true },
)

const allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const maxBytes = 5 * 1024 * 1024
const maxFiles = 5

function openFilePicker() {
  filePicker.value?.click()
}
function onFilePickerChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) handleFiles(Array.from(files))
  ;(e.target as HTMLInputElement).value = ''
}
function onDrop(e: DragEvent) {
  isDragOver.value = false
  if (!e.dataTransfer?.files) return
  handleFiles(Array.from(e.dataTransfer.files))
}
async function handleFiles(files: File[]) {
  // Validación cliente: errores de mime/tamaño se setean ANTES del upload; el bug
  // anterior era que addFiles hacía clearErrors() global y los barría.
  for (const f of files) {
    if (!allowedMimes.includes(f.type)) {
      const next = new Map(attach.errorByFile.value)
      next.set(f.name, t('transactionAttachments.mimeError'))
      attach.errorByFile.value = next
    } else if (f.size > maxBytes) {
      const next = new Map(attach.errorByFile.value)
      next.set(f.name, t('transactionAttachments.sizeError'))
      attach.errorByFile.value = next
    }
  }
  const filtered = files.filter((f) => allowedMimes.includes(f.type) && f.size <= maxBytes)
  if (!filtered.length) return
  filtered.forEach((f) => pendingFiles.set(f.name, f))
  await attach.addFiles(props.transactionId, filtered)
}
function retryUpload(name: string) {
  const f = pendingFiles.get(name)
  if (f) void attach.retry(props.transactionId, f)
}
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
function askRemove(id: number) {
  attachmentToRemove.value = id
  confirmDialogOpen.value = true
}
async function confirmRemove() {
  if (attachmentToRemove.value !== null) {
    await attach.remove(attachmentToRemove.value)
    attachmentToRemove.value = null
  }
  confirmDialogOpen.value = false
}
function openPdf(id: number) {
  // window.open DEBE ser síncrono dentro del clic: si se llamara tras el await del
  // fetch, la activación transitoria del gesto ya habría expirado y el navegador
  // bloquearía el popup (Safari/Firefox siempre; Chrome con red lenta). Abrimos la
  // pestaña ahora y le asignamos el blob URL cuando esté listo.
  const win = window.open('', '_blank')
  attachmentsApi
    .fetchInlineBlobUrl(id)
    .then((blobUrl) => {
      if (win) win.location.href = blobUrl
      else window.open(blobUrl, '_blank') // fallback si el popup ya venía bloqueado
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    })
    .catch((err) => {
      win?.close()
      console.error('attachment openPdf failed', err)
    })
}
function openLightboxFor(id: number) {
  // El lightbox recibe lightboxImages (sólo imágenes, PDFs excluidos), por eso el
  // índice debe calcularse sobre esa lista filtrada — usar attach.attachments.value
  // abre la imagen siguiente cuando hay un PDF antes del adjunto clickeado.
  const i = lightboxIndexFor(lightboxImages.value, id)
  if (i >= 0) {
    lightboxIndex.value = i
    lightboxOpen.value = true
  }
}
const lightboxImages = computed(() =>
  attach.attachments.value
    .filter((a) => a.mimeType.startsWith('image/'))
    .map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      url: attachmentsApi.downloadUrl(a.id, 'inline'),
    })),
)
const attachmentCount = computed(() => attach.attachments.value.length)
const atLimit = computed(() => attachmentCount.value >= maxFiles)
</script>

<template>
  <section class="border-t border-line bg-surface-2/30 px-6 py-5 lg:px-8">
    <h3 class="text-sm font-semibold text-content">{{ t('transactionAttachments.panel') }}</h3>
    <p class="mt-1 text-xs text-muted">{{ t('transactionAttachments.dropzoneHint') }}</p>

    <div
      class="mt-3 rounded-lg border-2 border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted transition-colors"
      :class="{ 'border-accent bg-surface-hover': isDragOver, 'cursor-not-allowed opacity-50': atLimit }"
      role="button"
      tabindex="0"
      :aria-disabled="atLimit"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="onDrop"
      @click="!atLimit && openFilePicker()"
      @keydown.enter.prevent="!atLimit && openFilePicker()"
      @keydown.space.prevent="!atLimit && openFilePicker()"
    >
      {{ t('transactionAttachments.dropzone') }}
      <input
        ref="filePicker"
        type="file"
        multiple
        class="hidden"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        @change="onFilePickerChange"
      />
    </div>

    <p class="mt-3 text-xs text-muted">
      {{ t('transactionAttachments.ofAttachments', { count: attachmentCount, max: maxFiles }) }}
    </p>

    <ul v-if="attach.attachments.value.length" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      <li
        v-for="a in attach.attachments.value"
        :key="a.id"
        class="rounded-lg border border-border bg-surface p-2"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate text-xs text-content">{{ a.fileName }}</p>
            <p class="text-[11px] text-muted">{{ formatSize(a.sizeBytes) }}</p>
          </div>
          <button
            type="button"
            class="text-muted hover:text-danger"
            :aria-label="t('transactionAttachments.remove')"
            @click="askRemove(a.id)"
          >&times;</button>
        </div>

        <div
          v-if="a.mimeType.startsWith('image/')"
          class="mt-2 aspect-square w-full overflow-hidden rounded-md bg-surface-2"
        >
          <img
            :src="attachmentsApi.downloadUrl(a.id, 'inline')"
            :alt="a.fileName"
            class="h-full w-full cursor-zoom-in object-cover"
            @click="openLightboxFor(a.id)"
          />
        </div>
        <div v-else class="mt-2 flex h-full min-h-[2.5rem] items-center justify-center">
          <button
            type="button"
            class="rounded-md border border-border px-3 py-1 text-xs text-content hover:bg-surface-hover"
            @click="openPdf(a.id)"
          >
            {{ t('transactionAttachments.openPdf') }}
          </button>
        </div>
      </li>
    </ul>

    <ul
      v-if="attach.progressByFile.value.size || attach.errorByFile.value.size"
      class="mt-3 space-y-1"
    >
      <li
        v-for="[name, pct] in attach.progressByFile.value"
        :key="`p-${name}`"
        class="flex items-center gap-2 text-[11px] text-muted"
      >
        <span class="truncate">{{ name }}</span>
        <span class="ml-auto">{{ t('transactionAttachments.uploading') }} {{ pct }}%</span>
      </li>
      <li
        v-for="[name, msg] in attach.errorByFile.value"
        :key="`e-${name}`"
        class="flex items-center gap-2 text-[11px] text-danger"
      >
        <span class="truncate">{{ name }} &mdash; {{ msg }}</span>
        <button
          type="button"
          class="ml-auto underline"
          @click="retryUpload(name)"
        >
          {{ t('transactionAttachments.retry') }}
        </button>
      </li>
    </ul>

    <ConfirmDialog
      :is-open="confirmDialogOpen"
      :title="t('transactionAttachments.remove')"
      :message="t('transactionAttachments.removeConfirm')"
      @cancel="confirmDialogOpen = false"
      @confirm="confirmRemove"
    />

    <AttachmentLightbox
      :images="lightboxImages"
      :start-index="lightboxIndex"
      :open="lightboxOpen"
      @close="lightboxOpen = false"
    />
  </section>
</template>
