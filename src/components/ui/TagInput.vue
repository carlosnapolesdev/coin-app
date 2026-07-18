<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { tagsApi, type TagDto } from '../../services/tags'
import AppSpinner from './AppSpinner.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    placeholder?: string
    disabled?: boolean
    maxTags?: number
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const draft = ref('')
const allTags = ref<TagDto[]>([])
const suggestionsOpen = ref(false)
const tagsLoaded = ref(false)
const isLoading = ref(false)
const activeIndex = ref(-1)
const listboxId = `tag-suggestions-${useId()}`

const atLimit = computed(() =>
  props.maxTags !== undefined && props.modelValue.length >= props.maxTags,
)

const suggestions = computed(() => {
  if (atLimit.value) return []
  const query = draft.value.trim().toLocaleLowerCase()
  return allTags.value
    .filter((tag) => !props.modelValue.includes(tag.name))
    .filter((tag) => !query || tag.name.toLocaleLowerCase().includes(query))
    .slice(0, 8)
})

const showSuggestions = computed(() =>
  suggestionsOpen.value && (isLoading.value || suggestions.value.length > 0),
)

const activeSuggestionId = computed(() =>
  activeIndex.value >= 0 ? `${listboxId}-${activeIndex.value}` : undefined,
)

const loadTags = async () => {
  if (tagsLoaded.value || isLoading.value) return
  isLoading.value = true
  try {
    allTags.value = await tagsApi.list()
    tagsLoaded.value = true
  } catch {
    allTags.value = []
  } finally {
    isLoading.value = false
  }
}

const handleFocus = async () => {
  if (props.disabled) return
  suggestionsOpen.value = true
  await loadTags()
}

const focusInput = () => {
  if (!props.disabled) input.value?.focus()
}

const addTag = (name: string) => {
  const normalized = name.trim()
  if (!normalized || atLimit.value) return
  draft.value = ''
  activeIndex.value = -1
  suggestionsOpen.value = true
  if (props.modelValue.includes(normalized)) return
  emit('update:modelValue', [...props.modelValue, normalized])
}

const removeTag = (index: number) => {
  if (props.disabled) return
  emit('update:modelValue', props.modelValue.filter((_, tagIndex) => tagIndex !== index))
  nextTick(focusInput)
}

const handleDraftInput = (event: Event) => {
  draft.value = (event.target as HTMLInputElement).value
  activeIndex.value = -1
  suggestionsOpen.value = true
}

const selectActiveOrDraft = () => {
  const active = suggestions.value[activeIndex.value]
  addTag(active?.name ?? draft.value)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) return

  if (event.key === 'Enter') {
    if (draft.value.trim() || activeIndex.value >= 0) {
      event.preventDefault()
      selectActiveOrDraft()
    }
    return
  }

  if (event.key === ',') {
    event.preventDefault()
    addTag(draft.value)
    return
  }

  if (event.key === 'Tab') {
    if (draft.value.trim() || activeIndex.value >= 0) selectActiveOrDraft()
    return
  }

  if (event.key === 'Backspace' && !draft.value && props.modelValue.length > 0) {
    event.preventDefault()
    removeTag(props.modelValue.length - 1)
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    suggestionsOpen.value = true
    void loadTags()
    if (suggestions.value.length > 0) {
      activeIndex.value = (activeIndex.value + 1) % suggestions.value.length
    }
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    suggestionsOpen.value = true
    if (suggestions.value.length > 0) {
      activeIndex.value = activeIndex.value <= 0
        ? suggestions.value.length - 1
        : activeIndex.value - 1
    }
    return
  }

  if (event.key === 'Escape') {
    suggestionsOpen.value = false
    activeIndex.value = -1
  }
}

const handleFocusOut = () => {
  nextTick(() => {
    if (!root.value?.contains(document.activeElement)) {
      suggestionsOpen.value = false
      activeIndex.value = -1
    }
  })
}
</script>

<template>
  <div ref="root" class="relative" @focusout="handleFocusOut">
    <div
      class="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm font-medium text-content transition focus-within:border-primary focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary/20"
      :class="disabled ? 'cursor-not-allowed opacity-60' : ''"
    >
      <span
        v-for="(tag, index) in modelValue"
        :key="`${tag}-${index}`"
        class="inline-flex min-h-8 max-w-full items-center gap-1 rounded-full bg-primary/10 pl-2.5 font-semibold text-primary"
      >
        <span class="max-w-48 truncate">{{ tag }}</span>
        <button
          type="button"
          class="inline-flex size-8 items-center justify-center rounded-full transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed"
          :disabled="disabled"
          :aria-label="t('tagInput.removeTag', { tag })"
          @click.stop="removeTag(index)"
          @keydown.backspace.prevent="removeTag(index)"
        >
          <span class="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
        </button>
      </span>

      <input
        ref="input"
        :value="draft"
        type="text"
        name="tags"
        autocomplete="off"
        class="h-8 min-w-32 flex-1 bg-transparent px-2 text-sm font-medium text-content outline-none placeholder:text-faint disabled:cursor-not-allowed"
        :placeholder="modelValue.length === 0 ? (placeholder ?? t('tagInput.addPlaceholder')) : ''"
        :aria-label="t('tagInput.addPlaceholder')"
        :disabled="disabled"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="showSuggestions"
        :aria-controls="listboxId"
        :aria-activedescendant="activeSuggestionId"
        @focus="handleFocus"
        @input="handleDraftInput"
        @keydown="handleKeydown"
      />
    </div>

    <div
      v-if="showSuggestions"
      :id="listboxId"
      role="listbox"
      class="surface-glass absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl p-1"
    >
      <div v-if="isLoading" class="flex items-center justify-center py-4 text-primary">
        <AppSpinner size="sm" />
      </div>
      <button
        v-for="(tag, index) in suggestions"
        v-else
        :id="`${listboxId}-${index}`"
        :key="tag.id"
        type="button"
        role="option"
        :aria-selected="activeIndex === index"
        class="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-content transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        :class="activeIndex === index ? 'bg-surface-2' : ''"
        @mouseenter="activeIndex = index"
        @mousedown.prevent
        @click="addTag(tag.name)"
      >
        <span class="min-w-0 flex-1 truncate font-medium">{{ tag.name }}</span>
        <span v-if="tag.usageCount !== undefined" class="shrink-0 text-xs text-muted">
          {{ t('tagInput.usageCount', tag.usageCount) }}
        </span>
      </button>
    </div>
  </div>
</template>
