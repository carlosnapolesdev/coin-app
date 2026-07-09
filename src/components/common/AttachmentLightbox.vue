<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface ImgAttachment {
  id: number
  fileName: string
  mimeType: string
  url: string
}

const props = defineProps<{
  images: ImgAttachment[]
  startIndex: number
  open: boolean
}>()

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const idx = ref(props.startIndex)
const container = ref<HTMLElement | null>(null)
let lastFocused: HTMLElement | null = null

const current = computed(() =>
  props.images.length
    ? props.images[Math.min(idx.value, props.images.length - 1)] ?? null
    : null,
)
const hasMultiple = computed(() => props.images.length > 1)

function next() {
  if (!hasMultiple.value) return
  idx.value = (idx.value + 1) % props.images.length
}
function prev() {
  if (!hasMultiple.value) return
  idx.value = (idx.value - 1 + props.images.length) % props.images.length
}
function close() {
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      idx.value = props.startIndex
      lastFocused = document.activeElement as HTMLElement | null
      await nextTick()
      container.value?.focus()
    } else if (lastFocused) {
      lastFocused.focus()
      lastFocused = null
    }
  },
)
</script>

<template>
  <div
    v-if="open && current"
    ref="container"
    role="dialog"
    aria-modal="true"
    :aria-label="t('transactionAttachments.lightboxAriaLabel')"
    tabindex="-1"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 outline-none backdrop-blur-sm"
    @click.self="close"
    @keydown="onKeydown"
  >
    <button
      type="button"
      class="absolute right-4 top-4 rounded-lg p-2 text-white hover:bg-white/10"
      :aria-label="t('transactionAttachments.viewerClose')"
      @click="close"
    >&times;</button>

    <button
      v-if="hasMultiple"
      type="button"
      class="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white hover:bg-white/10"
      :aria-label="t('transactionAttachments.viewerPrev')"
      @click.stop="prev"
    >&lsaquo;</button>

    <img
      :src="current.url"
      :alt="current.fileName"
      class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-elevated"
    />

    <button
      v-if="hasMultiple"
      type="button"
      class="absolute right-4 bottom-4 rounded-lg p-2 text-white hover:bg-white/10"
      :aria-label="t('transactionAttachments.viewerNext')"
      @click.stop="next"
    >&rsaquo;</button>
  </div>
</template>
