<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import api from '../../services/api'
import { formatCurrency } from '../../utils/format'
import { type AccountDetail, accountsApi } from '../../services/accounts'
import {
  type CreateRecurringPayload,
  type RecurrenceFrequency,
  type RecurringDetail,
  recurringApi,
} from '../../services/recurring'
import type { TransactionType } from '../../services/transactions'
import {
  AppBadge,
  AppButton,
  AppCard,
  AppIconButton,
  AppModal,
  AppSpinner,
  ConfirmDialog,
  PageContainer,
  PageHeader,
} from '../ui'

interface BackendCategory {
  id: number
  name: string
  type: 'EXPENSE' | 'INCOME'
  icon: string | null
  parentId: number | null
  active: boolean
  children: BackendCategory[]
}

interface FlatCategory {
  id: number
  label: string
}

type FormMode = 'create' | 'edit'

const { t } = useI18n()

const templates = ref<RecurringDetail[]>([])
const accounts = ref<AccountDetail[]>([])
const allCategories = ref<BackendCategory[]>([])
const isLoading = ref(false)
const error = ref('')

const isModalOpen = ref(false)
const formMode = ref<FormMode>('create')
const editingId = ref<number | null>(null)
const isSaving = ref(false)
const formError = ref('')

const selectedType = ref<TransactionType>('EXPENSE')
const accountId = ref<number | null>(null)
const destinationAccountId = ref<number | null>(null)
const categoryId = ref<number | null>(null)
const amount = ref('')
const frequency = ref<RecurrenceFrequency>('MONTHLY')
const interval = ref('1')
const startDate = ref('')
const endDate = ref('')
const payee = ref('')
const memo = ref('')
const tags = ref('')

const confirmDeleteId = ref<number | null>(null)
const isDeleting = ref(false)
const runningId = ref<number | null>(null)

const today = new Date().toISOString().slice(0, 10)

const expenseCategories = computed<FlatCategory[]>(() => buildFlatCategories('EXPENSE'))
const incomeCategories = computed<FlatCategory[]>(() => buildFlatCategories('INCOME'))
const filteredCategories = computed<FlatCategory[]>(() => {
  if (selectedType.value === 'TRANSFER') return []
  return selectedType.value === 'INCOME' ? incomeCategories.value : expenseCategories.value
})

function buildFlatCategories(type: 'EXPENSE' | 'INCOME'): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const cat of allCategories.value) {
    if (cat.type !== type) continue
    result.push({ id: cat.id, label: cat.name })
    for (const child of cat.children ?? []) {
      result.push({ id: child.id, label: `${cat.name} › ${child.name}` })
    }
  }
  return result
}

const destinationAccounts = computed(() => accounts.value.filter((acc) => acc.id !== accountId.value))

const frequencyLabel = (freq: RecurrenceFrequency, n: number): string => {
  const key = freq.toLowerCase() as 'daily' | 'weekly' | 'monthly' | 'yearly'
  return t(`recurring.frequency.${key}`, n)
}

const formatMoney = formatCurrency

const isSaveDisabled = computed(() => {
  const amt = parseFloat(amount.value)
  if (isSaving.value || !accountId.value || !amount.value || isNaN(amt) || amt <= 0 || !startDate.value) return true
  if (selectedType.value === 'TRANSFER' && !destinationAccountId.value) return true
  return false
})

const loadTemplates = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const { data } = await recurringApi.list()
    templates.value = data
  } catch (e) {
    error.value = t('recurring.loadError')
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const loadRefData = async () => {
  try {
    const [accountsRes, categoriesRes] = await Promise.all([
      accountsApi.list(),
      api.get<BackendCategory[]>('/users/me/categories'),
    ])
    accounts.value = accountsRes.data
    allCategories.value = categoriesRes.data
  } catch (e) {
    console.error('Failed to load accounts/categories', e)
  }
}

const resetForm = () => {
  selectedType.value = 'EXPENSE'
  accountId.value = accounts.value[0]?.id ?? null
  destinationAccountId.value = null
  categoryId.value = null
  amount.value = ''
  frequency.value = 'MONTHLY'
  interval.value = '1'
  startDate.value = today
  endDate.value = ''
  payee.value = ''
  memo.value = ''
  tags.value = ''
  formError.value = ''
}

const openCreateModal = () => {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  isModalOpen.value = true
}

const openEditModal = (tpl: RecurringDetail) => {
  formMode.value = 'edit'
  editingId.value = tpl.id
  selectedType.value = tpl.type
  accountId.value = tpl.accountId
  destinationAccountId.value = tpl.destinationAccountId
  categoryId.value = tpl.categoryId
  amount.value = String(tpl.amount)
  frequency.value = tpl.frequency
  interval.value = String(tpl.interval)
  startDate.value = tpl.nextRunDate
  endDate.value = tpl.endDate ?? ''
  payee.value = tpl.payee ?? ''
  memo.value = tpl.memo ?? ''
  tags.value = tpl.tags ?? ''
  formError.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  formError.value = ''
}

const saveTemplate = async () => {
  if (isSaveDisabled.value) return
  isSaving.value = true
  formError.value = ''

  const isTransfer = selectedType.value === 'TRANSFER'
  const payload: CreateRecurringPayload = {
    accountId: accountId.value!,
    categoryId: isTransfer ? undefined : (categoryId.value ?? undefined),
    destinationAccountId: isTransfer ? destinationAccountId.value! : undefined,
    type: selectedType.value,
    amount: parseFloat(amount.value),
    frequency: frequency.value,
    interval: parseInt(interval.value, 10) || 1,
    startDate: startDate.value,
    endDate: endDate.value || undefined,
    payee: payee.value || undefined,
    memo: memo.value || undefined,
    tags: tags.value || undefined,
  }

  try {
    if (formMode.value === 'create') {
      const { data } = await recurringApi.create(payload)
      templates.value.push(data)
    } else if (editingId.value !== null) {
      const { data } = await recurringApi.update(editingId.value, payload)
      const idx = templates.value.findIndex((t) => t.id === data.id)
      if (idx !== -1) templates.value[idx] = data
    }
    closeModal()
  } catch (e) {
    formError.value = t('recurring.saveError')
    console.error(e)
  } finally {
    isSaving.value = false
  }
}

const toggleActive = async (t: RecurringDetail) => {
  try {
    const { data } = await recurringApi.update(t.id, { active: !t.active })
    const idx = templates.value.findIndex((r) => r.id === data.id)
    if (idx !== -1) templates.value[idx] = data
  } catch (e) {
    console.error('Failed to toggle recurring transaction', e)
  }
}

const runNow = async (t: RecurringDetail) => {
  runningId.value = t.id
  try {
    await recurringApi.runNow(t.id)
    await loadTemplates()
  } catch (e) {
    console.error('Failed to run recurring transaction now', e)
  } finally {
    runningId.value = null
  }
}

const requestDelete = (id: number) => {
  confirmDeleteId.value = id
}

const confirmDelete = async () => {
  if (confirmDeleteId.value === null) return
  const id = confirmDeleteId.value
  isDeleting.value = true
  try {
    await recurringApi.remove(id)
    templates.value = templates.value.filter((t) => t.id !== id)
  } catch (e) {
    console.error('Failed to delete recurring transaction', e)
  } finally {
    isDeleting.value = false
    confirmDeleteId.value = null
  }
}

onMounted(() => {
  loadTemplates()
  loadRefData()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-bg">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <PageHeader :title="t('recurring.pageTitle')" :subtitle="t('recurring.pageSubtitle')" />

      <PageContainer>
        <div class="flex items-center justify-end">
          <AppButton icon="add" @click="openCreateModal">{{ t('recurring.newButton') }}</AppButton>
        </div>

        <div v-if="isLoading" class="flex justify-center py-16 text-primary">
          <AppSpinner size="lg" />
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-2 py-16 text-center">
          <span class="material-symbols-outlined text-3xl text-danger">error</span>
          <p class="text-sm text-danger">{{ error }}</p>
          <AppButton variant="secondary" size="sm" @click="loadTemplates">{{ t('common.retry') }}</AppButton>
        </div>

        <div v-else-if="templates.length === 0" class="surface-card flex flex-col items-center gap-3 py-16 text-center">
          <span class="material-symbols-outlined text-4xl text-faint">event_repeat</span>
          <p class="text-sm text-muted">{{ t('recurring.empty') }}</p>
          <AppButton icon="add" @click="openCreateModal">{{ t('recurring.newButton') }}</AppButton>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AppCard v-for="tpl in templates" :key="tpl.id">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-content">{{ tpl.payee || tpl.categoryName || t('recurring.fallbackName') }}</p>
                <p class="mt-0.5 truncate text-xs text-muted">
                  {{ tpl.accountName }}<span v-if="tpl.destinationAccountName"> › {{ tpl.destinationAccountName }}</span>
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <AppIconButton icon="edit" size="sm" :aria-label="t('recurring.editAria')" @click="openEditModal(tpl)" />
                <AppIconButton icon="delete" variant="danger" size="sm" :aria-label="t('recurring.deleteAria')" @click="requestDelete(tpl.id)" />
              </div>
            </div>

            <div class="mt-4 flex items-baseline justify-between gap-2">
              <span class="text-lg font-bold text-content">{{ formatMoney(tpl.amount) }}</span>
              <AppBadge :variant="tpl.active ? 'success' : 'muted'">{{ tpl.active ? t('recurring.active') : t('recurring.paused') }}</AppBadge>
            </div>

            <div class="mt-2 flex items-center justify-between text-xs text-muted">
              <span>{{ frequencyLabel(tpl.frequency, tpl.interval) }}</span>
              <span>{{ t('recurring.nextRun', { date: tpl.nextRunDate }) }}</span>
            </div>

            <div class="mt-4 flex items-center gap-2">
              <AppButton variant="secondary" size="sm" class="flex-1" :loading="runningId === tpl.id" @click="runNow(tpl)">{{ t('recurring.payNow') }}</AppButton>
              <AppButton variant="ghost" size="sm" class="flex-1" @click="toggleActive(tpl)">{{ tpl.active ? t('recurring.pause') : t('recurring.resume') }}</AppButton>
            </div>
          </AppCard>
        </div>
      </PageContainer>
    </main>

    <AppModal
      :is-open="isModalOpen"
      :title="formMode === 'create' ? t('recurring.modal.titleCreate') : t('recurring.modal.titleEdit')"
      icon="event_repeat"
      size="md"
      @close="closeModal"
    >
      <form id="recurring-form" class="space-y-6 p-6 lg:p-8" @submit.prevent="saveTemplate">
        <div v-if="formError" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
          {{ formError }}
        </div>

        <div class="flex gap-1 rounded-lg border border-line bg-surface-2 p-1">
          <button
            v-for="opt in (['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[])"
            :key="opt"
            type="button"
            class="flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all"
            :class="selectedType === opt ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-content'"
            :disabled="isSaving"
            @click="selectedType = opt; categoryId = null; if (opt !== 'TRANSFER') destinationAccountId = null"
          >
            {{ t(`recurring.types.${opt.toLowerCase()}`) }}
          </button>
        </div>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label class="field-label">{{ t('recurring.modal.amountLabel') }}</label>
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">attach_money</span>
              <input v-model="amount" type="number" step="0.01" min="0.01" placeholder="0.00" class="field-input pl-11 text-base font-bold" :disabled="isSaving" />
            </div>
          </div>

          <div>
            <label class="field-label">{{ selectedType === 'TRANSFER' ? t('recurring.modal.fromAccountLabel') : t('recurring.modal.accountLabel') }}</label>
            <select v-model="accountId" class="field-input" :disabled="isSaving">
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </select>
          </div>

          <div v-if="selectedType === 'TRANSFER'">
            <label class="field-label">{{ t('recurring.modal.toAccountLabel') }}</label>
            <select v-model="destinationAccountId" class="field-input" :disabled="isSaving">
              <option :value="null" disabled>{{ t('recurring.modal.selectDestination') }}</option>
              <option v-for="acc in destinationAccounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </select>
          </div>

          <div v-if="selectedType !== 'TRANSFER'">
            <label class="field-label">{{ t('recurring.modal.categoryLabel') }}</label>
            <select v-model="categoryId" class="field-input" :disabled="isSaving">
              <option :value="null">{{ t('recurring.modal.noneOption') }}</option>
              <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
            </select>
          </div>

          <div>
            <label class="field-label">{{ t('recurring.modal.frequencyLabel') }}</label>
            <select v-model="frequency" class="field-input" :disabled="isSaving">
              <option value="DAILY">{{ t('recurring.modal.freqDaily') }}</option>
              <option value="WEEKLY">{{ t('recurring.modal.freqWeekly') }}</option>
              <option value="MONTHLY">{{ t('recurring.modal.freqMonthly') }}</option>
              <option value="YEARLY">{{ t('recurring.modal.freqYearly') }}</option>
            </select>
          </div>

          <div>
            <label class="field-label">{{ t('recurring.modal.everyLabel') }}</label>
            <input v-model="interval" type="number" min="1" max="365" class="field-input" :disabled="isSaving" />
          </div>

          <div>
            <label class="field-label">{{ t('recurring.modal.startDateLabel') }}</label>
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">calendar_today</span>
              <input v-model="startDate" type="date" class="field-input pl-11" :disabled="isSaving" />
            </div>
          </div>

          <div>
            <label class="field-label">{{ t('recurring.modal.endDateLabel') }}</label>
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">event_busy</span>
              <input v-model="endDate" type="date" class="field-input pl-11" :disabled="isSaving" />
            </div>
          </div>

          <div>
            <label class="field-label">{{ t('recurring.modal.payeeLabel') }}</label>
            <input v-model="payee" type="text" :placeholder="t('recurring.modal.payeePlaceholder')" class="field-input" :disabled="isSaving" />
          </div>
        </div>

        <div>
          <label class="field-label">{{ t('recurring.modal.memoLabel') }}</label>
          <textarea v-model="memo" :placeholder="t('recurring.modal.memoPlaceholder')" rows="2" class="field-input resize-none" :disabled="isSaving"></textarea>
        </div>
        <div>
          <label class="field-label">{{ t('recurring.modal.tagsLabel') }}</label>
          <input v-model="tags" type="text" :placeholder="t('recurring.modal.tagsPlaceholder')" class="field-input" :disabled="isSaving" />
        </div>
      </form>

      <template #footer>
        <AppButton variant="ghost" :disabled="isSaving" @click="closeModal">{{ t('common.cancel') }}</AppButton>
        <AppButton type="submit" form="recurring-form" :loading="isSaving" :disabled="isSaveDisabled">
          {{ formMode === 'create' ? t('recurring.modal.createButton') : t('recurring.modal.updateButton') }}
        </AppButton>
      </template>
    </AppModal>

    <ConfirmDialog
      :is-open="confirmDeleteId !== null"
      :title="t('recurring.deleteDialog.title')"
      :message="t('recurring.deleteDialog.message')"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="confirmDeleteId = null"
    />
  </div>
</template>
