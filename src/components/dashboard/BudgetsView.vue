<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import api from '../../services/api'
import {
  budgetsApi,
  type BudgetDetail,
  type CreateBudgetPayload,
} from '../../services/budgets'
import {
  AppButton,
  AppCard,
  AppIconButton,
  AppInput,
  AppModal,
  AppSelect,
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
  isActive: boolean
  children: BackendCategory[]
}

interface FlatCategory {
  id: number
  label: string
}

type FormMode = 'create' | 'edit'

const budgets = ref<BudgetDetail[]>([])
const allCategories = ref<BackendCategory[]>([])
const isLoading = ref(false)
const error = ref('')

const isModalOpen = ref(false)
const formMode = ref<FormMode>('create')
const editingBudgetId = ref<number | null>(null)
const formCategoryId = ref<number | null>(null)
const formAmount = ref('')
const isSaving = ref(false)
const formError = ref('')

const confirmDeleteId = ref<number | null>(null)
const isDeleting = ref(false)

const expenseCategories = computed<FlatCategory[]>(() => {
  const result: FlatCategory[] = []
  for (const cat of allCategories.value) {
    if (cat.type !== 'EXPENSE') continue
    result.push({ id: cat.id, label: cat.name })
    for (const child of cat.children ?? []) {
      result.push({ id: child.id, label: `${cat.name} › ${child.name}` })
    }
  }
  return result
})

const budgetedCategoryIds = computed(() => new Set(budgets.value.map((b) => b.categoryId)))

const availableCategoriesForCreate = computed(() =>
  expenseCategories.value.filter((c) => !budgetedCategoryIds.value.has(c.id)),
)

const barClass = (percentUsed: number): string => {
  if (percentUsed > 100) return 'bg-danger'
  if (percentUsed >= 80) return 'bg-warning'
  return 'bg-success'
}

const textClass = (percentUsed: number): string => {
  if (percentUsed > 100) return 'text-danger'
  if (percentUsed >= 80) return 'text-warning'
  return 'text-success'
}

const formatMoney = (amount: number): string =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const loadBudgets = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const { data } = await budgetsApi.list()
    budgets.value = data
  } catch (e) {
    error.value = 'Failed to load budgets'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const loadCategories = async () => {
  try {
    const { data } = await api.get<BackendCategory[]>('/users/me/categories')
    allCategories.value = data
  } catch (e) {
    console.error('Failed to load categories', e)
  }
}

const openCreateModal = () => {
  formMode.value = 'create'
  editingBudgetId.value = null
  formCategoryId.value = availableCategoriesForCreate.value[0]?.id ?? null
  formAmount.value = ''
  formError.value = ''
  isModalOpen.value = true
}

const openEditModal = (budget: BudgetDetail) => {
  formMode.value = 'edit'
  editingBudgetId.value = budget.id
  formCategoryId.value = budget.categoryId
  formAmount.value = String(budget.amount)
  formError.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  formError.value = ''
}

const isSaveDisabled = computed(() => {
  const amount = parseFloat(formAmount.value)
  return isSaving.value || !formCategoryId.value || !formAmount.value || isNaN(amount) || amount <= 0
})

const saveBudget = async () => {
  if (isSaveDisabled.value) return
  isSaving.value = true
  formError.value = ''
  try {
    const amount = parseFloat(formAmount.value)
    if (formMode.value === 'create') {
      const payload: CreateBudgetPayload = { categoryId: formCategoryId.value!, amount }
      const { data } = await budgetsApi.create(payload)
      budgets.value.push(data)
    } else if (editingBudgetId.value !== null) {
      const { data } = await budgetsApi.update(editingBudgetId.value, { amount })
      const idx = budgets.value.findIndex((b) => b.id === data.id)
      if (idx !== -1) budgets.value[idx] = data
    }
    closeModal()
  } catch (e) {
    formError.value = 'Failed to save budget. Please try again.'
    console.error(e)
  } finally {
    isSaving.value = false
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
    await budgetsApi.remove(id)
    budgets.value = budgets.value.filter((b) => b.id !== id)
  } catch (e) {
    console.error('Failed to delete budget', e)
  } finally {
    isDeleting.value = false
    confirmDeleteId.value = null
  }
}

onMounted(() => {
  loadBudgets()
  loadCategories()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-bg">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <PageHeader title="Budgets" subtitle="Set a monthly spending limit per category and track your progress." />

      <PageContainer>
        <div class="flex items-center justify-end">
          <AppButton icon="add" @click="openCreateModal">New budget</AppButton>
        </div>

        <div v-if="isLoading" class="flex justify-center py-16 text-primary">
          <AppSpinner size="lg" />
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-2 py-16 text-center">
          <span class="material-symbols-outlined text-3xl text-danger">error</span>
          <p class="text-sm text-danger">{{ error }}</p>
          <AppButton variant="secondary" size="sm" @click="loadBudgets">Retry</AppButton>
        </div>

        <div v-else-if="budgets.length === 0" class="surface-card flex flex-col items-center gap-3 py-16 text-center">
          <span class="material-symbols-outlined text-4xl text-faint">pie_chart</span>
          <p class="text-sm text-muted">No budgets yet. Create one to start tracking your spending.</p>
          <AppButton icon="add" @click="openCreateModal">New budget</AppButton>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AppCard v-for="budget in budgets" :key="budget.id">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-content">{{ budget.categoryName ?? 'Uncategorized' }}</p>
                <p class="mt-0.5 text-xs text-muted">Monthly budget</p>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <AppIconButton icon="edit" size="sm" aria-label="Edit budget" @click="openEditModal(budget)" />
                <AppIconButton icon="delete" variant="danger" size="sm" aria-label="Delete budget" @click="requestDelete(budget.id)" />
              </div>
            </div>

            <div class="mt-4 flex items-baseline justify-between gap-2">
              <span class="text-lg font-bold text-content">{{ formatMoney(budget.spent) }}</span>
              <span class="text-sm text-muted">of {{ formatMoney(budget.amount) }}</span>
            </div>

            <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                class="h-2 rounded-full transition-all"
                :class="barClass(budget.percentUsed)"
                :style="{ width: Math.min(budget.percentUsed, 100) + '%' }"
              />
            </div>

            <div class="mt-2 flex items-center justify-between text-xs">
              <span :class="textClass(budget.percentUsed)" class="font-semibold">{{ budget.percentUsed }}% used</span>
              <span class="text-muted">
                {{ budget.remaining >= 0 ? `${formatMoney(budget.remaining)} left` : `${formatMoney(-budget.remaining)} over` }}
              </span>
            </div>
          </AppCard>
        </div>
      </PageContainer>
    </main>

    <AppModal
      :is-open="isModalOpen"
      :title="formMode === 'create' ? 'New Budget' : 'Edit Budget'"
      icon="pie_chart"
      size="sm"
      @close="closeModal"
    >
      <form id="budget-form" class="space-y-5 p-6" @submit.prevent="saveBudget">
        <div v-if="formError" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
          {{ formError }}
        </div>

        <AppSelect
          label="Category"
          :model-value="formCategoryId ?? ''"
          :disabled="formMode === 'edit' || isSaving"
          @update:model-value="(v) => (formCategoryId = v ? Number(v) : null)"
        >
          <option v-if="formMode === 'create' && availableCategoriesForCreate.length === 0" :value="null" disabled>
            All categories already have a budget
          </option>
          <option v-for="cat in (formMode === 'create' ? availableCategoriesForCreate : expenseCategories)" :key="cat.id" :value="cat.id">
            {{ cat.label }}
          </option>
        </AppSelect>

        <AppInput
          label="Monthly amount"
          icon="attach_money"
          type="number"
          placeholder="0.00"
          :model-value="formAmount"
          :disabled="isSaving"
          @update:model-value="(v) => (formAmount = v)"
        />
      </form>

      <template #footer>
        <AppButton variant="ghost" :disabled="isSaving" @click="closeModal">Cancel</AppButton>
        <AppButton type="submit" form="budget-form" :loading="isSaving" :disabled="isSaveDisabled">
          {{ formMode === 'create' ? 'Create Budget' : 'Save Changes' }}
        </AppButton>
      </template>
    </AppModal>

    <ConfirmDialog
      :is-open="confirmDeleteId !== null"
      title="Delete budget?"
      message="This budget will be removed. Existing transactions are not affected."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="confirmDeleteId = null"
    />
  </div>
</template>
