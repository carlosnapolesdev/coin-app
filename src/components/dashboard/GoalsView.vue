<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import { formatCurrency } from '../../utils/format'
import { accountsApi, type AccountDetail } from '../../services/accounts'
import {
  goalsApi,
  type GoalDetail,
  type CreateGoalPayload,
} from '../../services/goals'
import {
  AppBadge,
  AppButton,
  AppCard,
  AppIconButton,
  AppInput,
  AppModal,
  AppSelect,
  AppSpinner,
  ConfirmDialog,
  EmptyState,
  PageContainer,
  PageHeader,
} from '../ui'

type FormMode = 'create' | 'edit'

const { t } = useI18n()

const goals = ref<GoalDetail[]>([])
const accounts = ref<AccountDetail[]>([])
const isLoading = ref(false)
const error = ref('')

const isModalOpen = ref(false)
const formMode = ref<FormMode>('create')
const editingGoalId = ref<number | null>(null)
const formName = ref('')
const formTargetAmount = ref('')
const formTargetDate = ref('')
const formAccountId = ref<number | null>(null)
const isSaving = ref(false)
const formError = ref('')

const confirmDeleteId = ref<number | null>(null)
const isDeleting = ref(false)

const isContributeModalOpen = ref(false)
const contributingGoal = ref<GoalDetail | null>(null)
const contributionAmount = ref('')
const isContributing = ref(false)
const contributionError = ref('')

const formatMoney = formatCurrency

const barClass = (goal: GoalDetail): string => {
  if (goal.isAchieved) return 'bg-success'
  if (goal.percentComplete >= 50) return 'bg-primary'
  return 'bg-warning'
}

const loadGoals = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const { data } = await goalsApi.list()
    goals.value = data
  } catch (e) {
    error.value = t('goals.loadError')
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const loadAccounts = async () => {
  try {
    const { data } = await accountsApi.list()
    accounts.value = data
  } catch (e) {
    console.error('Failed to load accounts', e)
  }
}

const openCreateModal = () => {
  formMode.value = 'create'
  editingGoalId.value = null
  formName.value = ''
  formTargetAmount.value = ''
  formTargetDate.value = ''
  formAccountId.value = null
  formError.value = ''
  isModalOpen.value = true
}

const openEditModal = (goal: GoalDetail) => {
  formMode.value = 'edit'
  editingGoalId.value = goal.id
  formName.value = goal.name
  formTargetAmount.value = String(goal.targetAmount)
  formTargetDate.value = goal.targetDate ?? ''
  formAccountId.value = goal.accountId
  formError.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  formError.value = ''
}

const isSaveDisabled = computed(() => {
  const amount = parseFloat(formTargetAmount.value)
  return isSaving.value || !formName.value.trim() || !formTargetAmount.value || isNaN(amount) || amount <= 0
})

const saveGoal = async () => {
  if (isSaveDisabled.value) return
  isSaving.value = true
  formError.value = ''
  try {
    const targetAmount = parseFloat(formTargetAmount.value)
    const payload: CreateGoalPayload = {
      name: formName.value.trim(),
      targetAmount,
      targetDate: formTargetDate.value || undefined,
      accountId: formAccountId.value ?? undefined,
    }
    if (formMode.value === 'create') {
      const { data } = await goalsApi.create(payload)
      goals.value.push(data)
    } else if (editingGoalId.value !== null) {
      const { data } = await goalsApi.update(editingGoalId.value, payload)
      const idx = goals.value.findIndex((g) => g.id === data.id)
      if (idx !== -1) goals.value[idx] = data
    }
    closeModal()
  } catch (e) {
    formError.value = t('goals.saveError')
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
    await goalsApi.remove(id)
    goals.value = goals.value.filter((g) => g.id !== id)
  } catch (e) {
    console.error('Failed to delete goal', e)
  } finally {
    isDeleting.value = false
    confirmDeleteId.value = null
  }
}

const openContributeModal = (goal: GoalDetail) => {
  contributingGoal.value = goal
  contributionAmount.value = ''
  contributionError.value = ''
  isContributeModalOpen.value = true
}

const closeContributeModal = () => {
  isContributeModalOpen.value = false
  contributingGoal.value = null
}

const isContributeDisabled = computed(() => {
  const amount = parseFloat(contributionAmount.value)
  return isContributing.value || !contributionAmount.value || isNaN(amount) || amount <= 0
})

const saveContribution = async () => {
  if (isContributeDisabled.value || !contributingGoal.value) return
  isContributing.value = true
  contributionError.value = ''
  try {
    const amount = parseFloat(contributionAmount.value)
    const newAmount = contributingGoal.value.currentAmount + amount
    const { data } = await goalsApi.update(contributingGoal.value.id, { currentAmount: newAmount })
    const idx = goals.value.findIndex((g) => g.id === data.id)
    if (idx !== -1) goals.value[idx] = data
    closeContributeModal()
  } catch (e) {
    contributionError.value = t('goals.contribute.error')
    console.error(e)
  } finally {
    isContributing.value = false
  }
}

onMounted(() => {
  loadGoals()
  loadAccounts()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-bg">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <PageHeader :title="t('goals.pageTitle')" :subtitle="t('goals.pageSubtitle')" />

      <PageContainer>
        <div class="flex items-center justify-end">
          <AppButton icon="add" @click="openCreateModal">{{ t('goals.newButton') }}</AppButton>
        </div>

        <div v-if="isLoading" class="flex justify-center py-16 text-primary">
          <AppSpinner size="lg" />
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-2 py-16 text-center">
          <span class="material-symbols-outlined text-3xl text-danger">error</span>
          <p class="text-sm text-danger">{{ error }}</p>
          <AppButton variant="secondary" size="sm" @click="loadGoals">{{ t('common.retry') }}</AppButton>
        </div>

        <EmptyState
          v-else-if="goals.length === 0"
          icon="flag"
          :title="t('goals.empty')"
          :description="t('goals.emptyDesc')"
          :action-label="t('goals.newButton')"
          action-icon="add"
          @action="openCreateModal"
        />

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AppCard v-for="goal in goals" :key="goal.id">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-content">{{ goal.name }}</p>
                <p class="mt-0.5 text-xs text-muted">
                  {{ goal.accountName ? t('goals.linkedTo', { account: goal.accountName }) : t('goals.manualContributions') }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <AppIconButton icon="edit" size="sm" :aria-label="t('goals.editAria')" @click="openEditModal(goal)" />
                <AppIconButton icon="delete" variant="danger" size="sm" :aria-label="t('goals.deleteAria')" @click="requestDelete(goal.id)" />
              </div>
            </div>

            <div class="mt-4 flex items-baseline justify-between gap-2">
              <span class="text-lg font-bold text-content">{{ formatMoney(goal.currentAmount) }}</span>
              <span class="text-sm text-muted">{{ t('goals.ofAmount', { amount: formatMoney(goal.targetAmount) }) }}</span>
            </div>

            <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                class="h-2 rounded-full transition-all"
                :class="barClass(goal)"
                :style="{ width: Math.min(goal.percentComplete, 100) + '%' }"
              />
            </div>

            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="font-semibold text-muted">{{ t('goals.percentComplete', { percent: goal.percentComplete }) }}</span>
              <AppBadge v-if="goal.isAchieved" variant="success" icon="check_circle">{{ t('goals.achieved') }}</AppBadge>
              <span v-else class="text-muted">{{ t('goals.remainingLeft', { amount: formatMoney(goal.remaining) }) }}</span>
            </div>

            <p v-if="goal.targetDate" class="mt-2 text-xs text-muted">{{ t('goals.targetDate', { date: goal.targetDate }) }}</p>

            <AppButton
              v-if="!goal.accountId && !goal.isAchieved"
              variant="secondary"
              size="sm"
              icon="add"
              class="mt-4 w-full"
              @click="openContributeModal(goal)"
            >
              {{ t('goals.addContribution') }}
            </AppButton>
          </AppCard>
        </div>
      </PageContainer>
    </main>

    <AppModal
      :is-open="isModalOpen"
      :title="formMode === 'create' ? t('goals.modal.titleCreate') : t('goals.modal.titleEdit')"
      icon="flag"
      size="sm"
      @close="closeModal"
    >
      <form id="goal-form" class="space-y-5 p-6" @submit.prevent="saveGoal">
        <div v-if="formError" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
          {{ formError }}
        </div>

        <AppInput
          :label="t('goals.modal.nameLabel')"
          icon="flag"
          :placeholder="t('goals.modal.namePlaceholder')"
          :model-value="formName"
          :disabled="isSaving"
          @update:model-value="(v) => (formName = v)"
        />

        <AppInput
          :label="t('goals.modal.targetAmountLabel')"
          icon="attach_money"
          type="number"
          placeholder="0.00"
          :model-value="formTargetAmount"
          :disabled="isSaving"
          @update:model-value="(v) => (formTargetAmount = v)"
        />

        <AppInput
          :label="t('goals.modal.targetDateLabel')"
          icon="event"
          type="date"
          :model-value="formTargetDate"
          :disabled="isSaving"
          @update:model-value="(v) => (formTargetDate = v)"
        />

        <AppSelect
          :label="t('goals.modal.linkedAccountLabel')"
          :model-value="formAccountId ?? ''"
          :disabled="isSaving"
          @update:model-value="(v) => (formAccountId = v ? Number(v) : null)"
        >
          <option :value="null">{{ t('goals.modal.noLinkedAccount') }}</option>
          <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
        </AppSelect>
      </form>

      <template #footer>
        <AppButton variant="ghost" :disabled="isSaving" @click="closeModal">{{ t('common.cancel') }}</AppButton>
        <AppButton type="submit" form="goal-form" :loading="isSaving" :disabled="isSaveDisabled">
          {{ formMode === 'create' ? t('goals.modal.createButton') : t('goals.modal.updateButton') }}
        </AppButton>
      </template>
    </AppModal>

    <AppModal
      :is-open="isContributeModalOpen"
      :title="t('goals.contribute.title')"
      icon="savings"
      size="sm"
      @close="closeContributeModal"
    >
      <form id="contribution-form" class="space-y-5 p-6" @submit.prevent="saveContribution">
        <div v-if="contributionError" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
          {{ contributionError }}
        </div>

        <p v-if="contributingGoal" class="text-sm text-muted">
          {{ t('goals.contribute.currentProgress', { current: formatMoney(contributingGoal.currentAmount), target: formatMoney(contributingGoal.targetAmount) }) }}
        </p>

        <AppInput
          :label="t('goals.contribute.amountLabel')"
          icon="attach_money"
          type="number"
          placeholder="0.00"
          :model-value="contributionAmount"
          :disabled="isContributing"
          @update:model-value="(v) => (contributionAmount = v)"
        />
      </form>

      <template #footer>
        <AppButton variant="ghost" :disabled="isContributing" @click="closeContributeModal">{{ t('common.cancel') }}</AppButton>
        <AppButton type="submit" form="contribution-form" :loading="isContributing" :disabled="isContributeDisabled">
          {{ t('goals.addContribution') }}
        </AppButton>
      </template>
    </AppModal>

    <ConfirmDialog
      :is-open="confirmDeleteId !== null"
      :title="t('goals.deleteDialog.title')"
      :message="t('goals.deleteDialog.message')"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="confirmDeleteId = null"
    />
  </div>
</template>
