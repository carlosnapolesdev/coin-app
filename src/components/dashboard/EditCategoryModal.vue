<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import api from '../../services/api'
import iconVersions from '@material-symbols/metadata/versions.json'

type FlowType = 'expense' | 'income'
type FormMode = 'create' | 'edit'

interface CategoryResponse {
  id: number
  name: string
  type: 'EXPENSE' | 'INCOME'
  icon: string
}

const props = defineProps<{
  isOpen: boolean
  mode: FormMode
  categoryId?: number
  initialName?: string
  initialIcon?: string
  initialType?: FlowType
  isSubcategory?: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: [
    data: {
      mode: FormMode
      id?: number
      name: string
      icon: string
      type: FlowType
    },
  ]
}>()

const editName = ref('')
const selectedIcon = ref('label')
const selectedFlow = ref<FlowType>('expense')
const iconSearch = ref('')
const visibleIconLimit = ref(180)
const isLoading = ref(false)
const error = ref('')

const iconOptions = Object.keys(iconVersions as Record<string, number>).sort((a, b) =>
  a.localeCompare(b)
)

const filteredIconOptions = computed(() => {
  const query = iconSearch.value.trim().toLowerCase()
  if (!query) return iconOptions
  return iconOptions.filter((icon) => icon.toLowerCase().includes(query))
})

const displayedIconOptions = computed(() =>
  filteredIconOptions.value.slice(0, visibleIconLimit.value)
)

const hasMoreIcons = computed(() =>
  displayedIconOptions.value.length < filteredIconOptions.value.length
)

const isCreateMode = computed(() => props.mode === 'create')

const isSaveDisabled = computed(() => {
  return editName.value.trim().length === 0 || isLoading.value
})

watch(
  () => props.isOpen,
  (newValue) => {
    if (!newValue) return

    editName.value = props.initialName ?? ''
    selectedIcon.value = props.initialIcon ?? 'label'
    selectedFlow.value = props.initialType ?? 'expense'
    iconSearch.value = ''
    visibleIconLimit.value = 180
    error.value = ''
  }
)

const handleClose = () => {
  editName.value = ''
  selectedIcon.value = 'label'
  selectedFlow.value = 'expense'
  iconSearch.value = ''
  visibleIconLimit.value = 180
  error.value = ''
  emit('close')
}

const loadMoreIcons = () => {
  visibleIconLimit.value += 180
}

const handleSave = async () => {
  if (isSaveDisabled.value) return

  isLoading.value = true
  error.value = ''

  try {
    if (isCreateMode.value) {
      const response = await api.post<CategoryResponse>('/users/me/categories', {
        name: editName.value.trim(),
        type: selectedFlow.value.toUpperCase(),
        icon: selectedIcon.value,
      })

      emit('saved', {
        mode: 'create',
        id: response.data.id,
        name: response.data.name,
        icon: response.data.icon,
        type: response.data.type.toLowerCase() as FlowType,
      })
    } else {
      if (!props.categoryId) {
        error.value = 'Invalid category selected.'
        return
      }

      await api.patch(`/users/me/categories/${props.categoryId}`, {
        name: editName.value.trim(),
        icon: selectedIcon.value,
      })

      emit('saved', {
        mode: 'edit',
        id: props.categoryId,
        name: editName.value.trim(),
        icon: selectedIcon.value,
        type: selectedFlow.value,
      })
    }

    handleClose()
  } catch (e) {
    error.value = isCreateMode.value
      ? 'Failed to create category. Please try again.'
      : 'Failed to update category. Please try again.'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div class="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div class="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
        <div>
          <h3 class="text-xl font-bold text-slate-900">
            {{ isCreateMode ? 'New category' : (isSubcategory ? 'Edit subcategory' : 'Edit category') }}
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            {{ isCreateMode ? 'Create a category with type and icon to keep your dashboard consistent.' : `Update the name and icon for this ${isSubcategory ? 'subcategory' : 'category'}.` }}
          </p>
        </div>

        <button
          type="button"
          class="flex size-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:text-slate-900"
          @click="handleClose"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="space-y-6 px-6 py-6">
        <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {{ error }}
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-5">
            <div class="space-y-2">
              <label class="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Name</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">label</span>
                <input
                  v-model="editName"
                  type="text"
                  placeholder="Enter category name"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  :disabled="isLoading"
                />
              </div>
              <p v-if="editName.trim().length === 0" class="text-xs text-slate-400">Name is required</p>
            </div>

            <div v-if="isCreateMode" class="space-y-2">
              <label class="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Flow type</label>
              <select
                v-model="selectedFlow"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                :disabled="isLoading"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div class="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-slate-600">
              {{ isCreateMode ? 'Top-level categories help with clean reporting. Use subcategories for details inside the same group.' : 'Changes are applied immediately after saving and reflected in the current list.' }}
            </div>
          </div>

          <div class="space-y-3">
            <label class="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Icon</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                v-model="iconSearch"
                type="text"
                placeholder="Search icon"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                :disabled="isLoading"
                @input="visibleIconLimit = 180"
              />
            </div>

            <div class="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div class="grid grid-cols-5 gap-2 sm:grid-cols-6">
                <button
                  v-for="icon in displayedIconOptions"
                  :key="icon"
                  type="button"
                  class="flex h-12 items-center justify-center rounded-xl border transition"
                  :class="selectedIcon === icon ? 'border-primary bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                  :disabled="isLoading"
                  @click="selectedIcon = icon"
                >
                  <span class="material-symbols-outlined">{{ icon }}</span>
                </button>
              </div>

              <div v-if="hasMoreIcons" class="mt-4 flex justify-center">
                <button
                  type="button"
                  class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  :disabled="isLoading"
                  @click="loadMoreIcons"
                >
                  Load more icons ({{ filteredIconOptions.length - displayedIconOptions.length }} remaining)
                </button>
              </div>

              <div v-if="filteredIconOptions.length === 0" class="py-10 text-center text-sm text-slate-500">
                No icons found for "{{ iconSearch }}"
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          :disabled="isSaveDisabled"
          @click="handleSave"
        >
          <span v-if="isLoading" class="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
          <span>{{ isLoading ? 'Saving...' : (isCreateMode ? 'Save category' : 'Save changes') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
