<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../services/api'
import { CATEGORY_ICONS } from '../../config/icons'
import { AppButton, AppModal } from '../ui'
import { logError } from '../../utils/logError'
import { isExpectedApiRejection } from '../../utils/expectedApiRejection'
import { useToast } from '../../composables/useToast'

const { t } = useI18n()
const toast = useToast()

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

const iconOptions = [...CATEGORY_ICONS].sort((a, b) => a.localeCompare(b))

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
        error.value = t('categoryModal.invalidCategory')
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

    toast.success(isCreateMode.value ? t('categoryModal.created') : t('categoryModal.updated'))
    handleClose()
  } catch (err: unknown) {
    if (!isExpectedApiRejection(err)) logError('categoryModal.handleSave', err)
    error.value = isCreateMode.value
      ? t('categoryModal.createError')
      : t('categoryModal.updateError')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AppModal
    :is-open="isOpen"
    :title="isCreateMode ? t('categoryModal.titleCreate') : (isSubcategory ? t('categoryModal.titleEditSubcategory') : t('categoryModal.titleEditCategory'))"
    :subtitle="isCreateMode
      ? t('categoryModal.subtitleCreate')
      : (isSubcategory ? t('categoryModal.subtitleEditSubcategory') : t('categoryModal.subtitleEditCategory'))"
    icon="category"
    size="lg"
    @close="handleClose"
  >
    <div class="space-y-6 p-6 lg:p-8">
      <div v-if="error" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
        {{ error }}
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Left -->
        <div class="space-y-5">
          <div>
            <label class="field-label">{{ t('categoryModal.nameLabel') }}</label>
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">label</span>
              <input
                v-model="editName"
                type="text"
                :placeholder="t('categoryModal.namePlaceholder')"
                class="field-input pl-11"
                :disabled="isLoading"
              />
            </div>
            <p v-if="editName.trim().length === 0" class="mt-1.5 text-xs text-muted">{{ t('categoryModal.nameRequired') }}</p>
          </div>

          <div v-if="isCreateMode">
            <label class="field-label">{{ t('categoryModal.flowTypeLabel') }}</label>
            <select v-model="selectedFlow" class="field-input" :disabled="isLoading">
              <option value="expense">{{ t('categoryModal.flowExpense') }}</option>
              <option value="income">{{ t('categoryModal.flowIncome') }}</option>
            </select>
          </div>

          <div class="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted">
            {{ isCreateMode ? t('categoryModal.tipCreate') : t('categoryModal.tipEdit') }}
          </div>
        </div>

        <!-- Icon picker -->
        <div class="space-y-3">
          <label class="field-label">{{ t('categoryModal.iconLabel') }}</label>
          <div class="relative">
            <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">search</span>
            <input
              v-model="iconSearch"
              type="text"
              :placeholder="t('categoryModal.iconSearchPlaceholder')"
              class="field-input pl-11"
              :disabled="isLoading"
              @input="visibleIconLimit = 180"
            />
          </div>

          <div class="max-h-72 overflow-y-auto rounded-xl border border-line bg-surface-2 p-3">
            <div class="grid grid-cols-5 gap-2 sm:grid-cols-6">
              <button
                v-for="icon in displayedIconOptions"
                :key="icon"
                type="button"
                class="flex h-12 items-center justify-center rounded-lg border transition"
                :class="selectedIcon === icon
                  ? 'border-primary bg-primary text-primary-fg shadow-sm'
                  : 'border-line bg-surface text-muted hover:border-line-strong'"
                :disabled="isLoading"
                @click="selectedIcon = icon"
              >
                <span class="material-symbols-outlined">{{ icon }}</span>
              </button>
            </div>

            <div v-if="hasMoreIcons" class="mt-4 flex justify-center">
              <AppButton variant="secondary" size="sm" :disabled="isLoading" @click="loadMoreIcons">
                {{ t('categoryModal.loadMoreIcons', { count: filteredIconOptions.length - displayedIconOptions.length }) }}
              </AppButton>
            </div>

            <div v-if="filteredIconOptions.length === 0" class="py-10 text-center text-sm text-muted">
              {{ t('categoryModal.noIcons', { query: iconSearch }) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" :disabled="isLoading" @click="handleClose">{{ t('common.cancel') }}</AppButton>
      <AppButton :loading="isLoading" :disabled="isSaveDisabled" @click="handleSave">
        {{ isCreateMode ? t('categoryModal.saveCreate') : t('categoryModal.saveEdit') }}
      </AppButton>
    </template>
  </AppModal>
</template>
