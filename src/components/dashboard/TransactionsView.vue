<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import AddTransactionModal from './AddTransactionModal.vue'
import ImportModal from './ImportModal.vue'
import CoachMark from '../onboarding/CoachMark.vue'
import { AppBadge, AppButton, AppIconButton, AppInput, AppModal, AppSelect, AppSpinner, ConfirmDialog, PageContainer, PageHeader } from '../ui'
import { type AccountDetail, accountsApi } from '../../services/accounts'
import { type TransactionDetail, type TransactionStatus, type TransactionType, transactionsApi } from '../../services/transactions'
import { type ReconciliationSummary, reconciliationsApi } from '../../services/reconciliations'
import { formatCurrency, formatDate as formatDateLocale } from '../../utils/format'
import { useOnboarding } from '../../composables/useOnboarding'
import { useToast } from '../../composables/useToast'

const { t } = useI18n()
const { notifyTransactionCreated, flushCelebration } = useOnboarding()
const toast = useToast()

const PAGE_SIZE = 15
const SEARCH_DEBOUNCE_MS = 300

const transactions = ref<TransactionDetail[]>([])
const accounts = ref<AccountDetail[]>([])
const selectedAccountId = ref<number | null>(null)
const searchQuery = ref('')
const typeFilter = ref<TransactionType | ''>('')
const statusFilter = ref<TransactionStatus | ''>('')
const fromDate = ref('')
const toDate = ref('')
const page = ref(1)
const total = ref(0)
const isLoading = ref(false)
const error = ref('')
const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingTransaction = ref<TransactionDetail | undefined>(undefined)
const confirmDeleteId = ref<number | null>(null)
const isDeleting = ref(false)
const importModalOpen = ref(false)
const isExporting = ref(false)

const reconciliationOpen = ref(false)
const reconciliation = ref<ReconciliationSummary | null>(null)
const openReconciliationDate = ref(new Date().toISOString().slice(0, 10))
const openReconciliationBalance = ref('0.00')
const isOpeningReconciliation = ref(false)
const isFinishingReconciliation = ref(false)
const reconcilingTransactionId = ref<number | null>(null)

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
const hasActiveFilters = computed(() =>
  Boolean(searchQuery.value || typeFilter.value || statusFilter.value || fromDate.value || toDate.value || selectedAccountId.value),
)

const loadTransactions = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const res = await transactionsApi.search({
      accountId: selectedAccountId.value ?? undefined,
      q: searchQuery.value || undefined,
      type: typeFilter.value || undefined,
      status: statusFilter.value || undefined,
      from: fromDate.value || undefined,
      to: toDate.value || undefined,
      page: page.value,
      pageSize: PAGE_SIZE,
    })
    transactions.value = res.data.data
    total.value = res.data.total
  } catch {
    error.value = t('transactions.loadError')
  } finally {
    isLoading.value = false
  }
}

const loadAccounts = async () => {
  try {
    const res = await accountsApi.list()
    accounts.value = res.data
  } catch {
    // ignore
  }
}

onMounted(async () => {
  await loadAccounts()
  await loadTransactions()
})

const applyFilters = () => {
  page.value = 1
  loadTransactions()
}

const onSearchInput = (value: string) => {
  searchQuery.value = value
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applyFilters, SEARCH_DEBOUNCE_MS)
}

const goToPage = (target: number) => {
  if (target < 1 || target > totalPages.value || target === page.value) return
  page.value = target
  loadTransactions()
}

const openCreate = () => {
  editingTransaction.value = undefined
  modalMode.value = 'create'
  modalOpen.value = true
}

const openEdit = (t: TransactionDetail) => {
  editingTransaction.value = t
  modalMode.value = 'edit'
  modalOpen.value = true
}

const onSaved = async () => {
  await Promise.all([loadAccounts(), loadTransactions()])
  notifyTransactionCreated()
}

// El modal de alta queda abierto tras crear (para adjuntos); mostramos la
// celebración recién al cerrarlo para no apilar dos overlays.
const closeModal = () => {
  modalOpen.value = false
  flushCelebration()
}

const onImported = async () => {
  await Promise.all([loadAccounts(), loadTransactions()])
}

const openReconciliationModal = () => {
  if (selectedAccountId.value === null) return
  openReconciliationDate.value = new Date().toISOString().slice(0, 10)
  const account = accounts.value.find(a => a.id === selectedAccountId.value)
  openReconciliationBalance.value = account ? String(account.currentBalance) : '0.00'
  reconciliation.value = null
  reconciliationOpen.value = true
}

const closeReconciliation = () => {
  reconciliationOpen.value = false
  reconciliation.value = null
}

const startReconciliation = async () => {
  if (selectedAccountId.value === null) return
  isOpeningReconciliation.value = true
  try {
    const { data } = await reconciliationsApi.open(selectedAccountId.value, {
      statementDate: openReconciliationDate.value,
      statementBalance: parseFloat(openReconciliationBalance.value) || 0,
    })
    await loadSummary(data.id)
    await Promise.all([loadAccounts(), loadTransactions()])
  } catch {
    toast.error(t('reconciliation.loadError'))
  } finally {
    isOpeningReconciliation.value = false
  }
}

const loadSummary = async (reconciliationId: number) => {
  if (selectedAccountId.value === null) return
  try {
    const { data } = await reconciliationsApi.getSummary(
      selectedAccountId.value,
      reconciliationId,
    )
    reconciliation.value = data
  } catch {
    toast.error(t('reconciliation.loadError'))
  }
}

const toggleTransactionCleared = async (tx: TransactionDetail) => {
  if (!reconciliation.value) return
  const target: TransactionStatus = tx.status === 'CLEARED' ? 'PENDING' : 'CLEARED'
  reconcilingTransactionId.value = tx.id
  try {
    await transactionsApi.update(tx.id, { status: target })
    const idx = transactions.value.findIndex(t => t.id === tx.id)
    if (idx !== -1) {
      transactions.value[idx] = { ...transactions.value[idx]!, status: target }
    }
    await loadSummary(reconciliation.value.id)
  } catch {
    toast.error(t('transactions.saveError'))
  } finally {
    reconcilingTransactionId.value = null
  }
}

const finishReconciliation = async () => {
  if (!reconciliation.value || selectedAccountId.value === null) return
  if (reconciliation.value.difference !== 0) {
    toast.error(t('reconciliation.notBalanced'))
    return
  }
  isFinishingReconciliation.value = true
  try {
    await reconciliationsApi.complete(selectedAccountId.value, reconciliation.value.id)
    reconciliation.value = { ...reconciliation.value, isCompleted: true }
    toast.success(t('reconciliation.finished'))
  } catch (e: any) {
    const message = e?.response?.data?.message ?? t('reconciliation.notBalanced')
    toast.error(message)
  } finally {
    isFinishingReconciliation.value = false
  }
}

const reconciliationDifferenceClass = computed(() => {
  if (!reconciliation.value) return ''
  return reconciliation.value.difference === 0 ? 'text-success' : 'text-danger'
})

const reconciliationDifferenceLabel = computed(() => {
  if (!reconciliation.value) return ''
  if (reconciliation.value.difference === 0) return t('reconciliation.summary.balanced')
  return t('reconciliation.summary.unbalanced', {
    amount: formatCurrency(reconciliation.value.difference),
  })
})

const canFinishReconciliation = computed(() => {
  return reconciliation.value !== null
    && !reconciliation.value.isCompleted
    && reconciliation.value.difference === 0
})

const exportTransactions = async () => {
  isExporting.value = true
  error.value = ''
  try {
    const res = await transactionsApi.exportCsv({
      accountId: selectedAccountId.value ?? undefined,
      q: searchQuery.value || undefined,
      type: typeFilter.value || undefined,
      status: statusFilter.value || undefined,
      from: fromDate.value || undefined,
      to: toDate.value || undefined,
    })
    const url = URL.createObjectURL(res.data)
    const link = document.createElement('a')
    link.href = url
    link.download = 'transactions.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success(t('transactions.exported'))
  } catch {
    toast.error(t('transactions.exportError'))
  } finally {
    isExporting.value = false
  }
}

const requestDeleteTransaction = (id: number) => {
  confirmDeleteId.value = id
}

const confirmDelete = async () => {
  if (confirmDeleteId.value === null) return
  isDeleting.value = true
  try {
    await transactionsApi.remove(confirmDeleteId.value)
    await Promise.all([loadAccounts(), loadTransactions()])
    confirmDeleteId.value = null
    toast.success(t('transactions.deleted'))
  } catch {
    toast.error(t('transactions.deleteError'))
  } finally {
    isDeleting.value = false
  }
}

const formatDate = (dateStr: string) => formatDateLocale(dateStr, { month: 'short', day: 'numeric', year: 'numeric' })

const formatAmount = formatCurrency

const amountClass = (tx: TransactionDetail): string => {
  if (tx.type === 'EXPENSE') return 'text-danger'
  if (tx.type === 'INCOME') return 'text-success'
  return 'text-muted'
}

const formattedAmount = (tx: TransactionDetail): string => {
  if (tx.type === 'EXPENSE') return `-${formatAmount(tx.amount)}`
  if (tx.type === 'INCOME') return `+${formatAmount(tx.amount)}`
  return formatAmount(tx.amount)
}

const statusConfig = computed<Record<TransactionStatus, { label: string; variant: 'success' | 'warning' | 'muted'; icon: string }>>(() => ({
  CLEARED: { label: t('transactions.status.cleared'), variant: 'success', icon: 'check_circle' },
  PENDING: { label: t('transactions.status.pending'), variant: 'warning', icon: 'pending' },
  VOID: { label: t('transactions.status.void'), variant: 'muted', icon: 'block' },
}))

const parseTags = (tags: string | null) =>
  tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []

const transferLabel = (tx: TransactionDetail) => {
  const counterpart = accounts.value.find(a => a.id === tx.transferAccountId)?.name ?? t('transactions.unknownAccount')
  const direction = tx.transferIn ? t('transactions.transferFrom', { account: counterpart }) : t('transactions.transferTo', { account: counterpart })
  if (tx.exchangeRate === null) return direction

  const sourceAccountId = tx.transferIn ? tx.transferAccountId : tx.accountId
  const destAccountId = tx.transferIn ? tx.accountId : tx.transferAccountId
  const sourceCode = accounts.value.find(a => a.id === sourceAccountId)?.currencyCode ?? ''
  const destCode = accounts.value.find(a => a.id === destAccountId)?.currencyCode ?? ''
  return `${direction} · 1 ${sourceCode} = ${tx.exchangeRate} ${destCode}`
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-ambient">
    <Sidebar />

    <main class="wm-logo-main flex-1 overflow-y-auto">
      <PageHeader :title="t('transactions.pageTitle')" :subtitle="t('transactions.pageSubtitle')" />

      <!-- Content -->
      <PageContainer>
        <div v-if="error" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
          {{ error }}
        </div>

        <!-- Filters -->
        <div class="surface-card relative z-10 mb-6 flex flex-col gap-4 p-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AppSelect
              :label="t('transactions.filters.accountLabel')"
              :model-value="selectedAccountId ?? ''"
              @update:model-value="(v) => { selectedAccountId = v ? Number(v) : null; applyFilters() }"
            >
              <option value="">{{ t('transactions.filters.allAccounts') }}</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </AppSelect>

            <AppSelect
              :label="t('transactions.filters.typeLabel')"
              :model-value="typeFilter"
              @update:model-value="(v) => { typeFilter = v as TransactionType | ''; applyFilters() }"
            >
              <option value="">{{ t('transactions.filters.allTypes') }}</option>
              <option value="INCOME">{{ t('transactions.types.income') }}</option>
              <option value="EXPENSE">{{ t('transactions.types.expense') }}</option>
              <option value="TRANSFER">{{ t('transactions.types.transfer') }}</option>
            </AppSelect>

            <AppSelect
              :label="t('transactions.filters.statusLabel')"
              :model-value="statusFilter"
              @update:model-value="(v) => { statusFilter = v as TransactionStatus | ''; applyFilters() }"
            >
              <option value="">{{ t('transactions.filters.allStatuses') }}</option>
              <option value="CLEARED">{{ t('transactions.status.cleared') }}</option>
              <option value="PENDING">{{ t('transactions.status.pending') }}</option>
              <option value="VOID">{{ t('transactions.status.void') }}</option>
            </AppSelect>

            <AppInput
              :label="t('transactions.filters.searchLabel')"
              icon="search"
              :placeholder="t('transactions.filters.searchPlaceholder')"
              :model-value="searchQuery"
              @update:model-value="onSearchInput"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AppInput
              :label="t('transactions.filters.fromDate')"
              type="date"
              :model-value="fromDate"
              @update:model-value="(v) => { fromDate = v; applyFilters() }"
            />
            <AppInput
              :label="t('transactions.filters.toDate')"
              type="date"
              :model-value="toDate"
              @update:model-value="(v) => { toDate = v; applyFilters() }"
            />
            <div class="lg:col-span-2">
              <div class="flex flex-col gap-2 lg:hidden">
                <div class="grid grid-cols-2 gap-2">
                  <AppButton size="sm" variant="secondary" icon="upload_file" @click="importModalOpen = true">{{ t('transactions.actions.import') }}</AppButton>
                  <AppButton size="sm" variant="secondary" icon="download" :loading="isExporting" @click="exportTransactions">{{ t('transactions.actions.export') }}</AppButton>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <AppButton
                    size="sm"
                    variant="secondary"
                    icon="fact_check"
                    :disabled="selectedAccountId === null"
                    @click="openReconciliationModal"
                  >{{ t('reconciliation.actions.start') }}</AppButton>
                  <CoachMark coach-key="transactions" :text="t('onboarding.coach.transactions')" placement="bottom">
                    <AppButton block icon="add" @click="openCreate">{{ t('transactions.actions.add') }}</AppButton>
                  </CoachMark>
                </div>
              </div>
              <div class="hidden h-full items-end justify-end gap-2 lg:flex">
                <AppButton variant="secondary" icon="upload_file" @click="importModalOpen = true">{{ t('transactions.actions.import') }}</AppButton>
                <AppButton variant="secondary" icon="download" :loading="isExporting" @click="exportTransactions">{{ t('transactions.actions.export') }}</AppButton>
                <AppButton
                  variant="secondary"
                  icon="fact_check"
                  :disabled="selectedAccountId === null"
                  @click="openReconciliationModal"
                >{{ t('reconciliation.actions.start') }}</AppButton>
                <CoachMark coach-key="transactions" :text="t('onboarding.coach.transactions')" placement="bottom">
                  <AppButton icon="add" @click="openCreate">{{ t('transactions.actions.add') }}</AppButton>
                </CoachMark>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center justify-center py-24 text-primary">
          <AppSpinner size="lg" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="transactions.length === 0"
          class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface py-24 text-center"
        >
          <span class="material-symbols-outlined mb-4 text-5xl text-faint">receipt_long</span>
          <p class="font-semibold text-content">{{ hasActiveFilters ? t('transactions.empty.filteredTitle') : t('transactions.empty.title') }}</p>
          <p class="mt-1 text-sm text-muted">
            {{ hasActiveFilters ? t('transactions.empty.filteredHint') : t('transactions.empty.hint') }}
          </p>
          <AppButton v-if="!hasActiveFilters" class="mt-6" icon="add" @click="openCreate">{{ t('transactions.actions.add') }}</AppButton>
        </div>

        <!-- Table / cards -->
        <div v-else class="surface-card overflow-hidden">
          <!-- Mobile cards (< lg) -->
          <ul class="divide-y divide-line lg:hidden">
            <li
              v-for="tx in transactions"
              :key="tx.id"
              class="flex flex-col gap-2 p-4 transition-colors hover:bg-surface-2"
            >
              <div v-if="reconciliation" class="flex items-center gap-2 pb-1">
                <input
                  type="checkbox"
                  class="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                  :checked="tx.status === 'CLEARED'"
                  :disabled="reconcilingTransactionId === tx.id"
                  :aria-label="t('reconciliation.summary.cleared')"
                  @change="toggleTransactionCleared(tx)"
                />
                <span class="text-xs font-medium text-muted">{{ t('reconciliation.summary.cleared') }}</span>
              </div>
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 text-xs text-faint">
                    <span class="font-semibold text-content">{{ formatDate(tx.effectiveDate) }}</span>
                    <span v-if="tx.accountName" class="truncate">· {{ tx.accountName }}</span>
                  </div>
                  <div class="mt-1 flex items-center gap-2">
                    <span class="truncate font-semibold text-content">
                      {{ tx.type === 'TRANSFER' ? transferLabel(tx) : (tx.payee || '—') }}
                    </span>
                    <svg
                      v-if="tx.attachmentCount > 0"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="shrink-0 text-muted"
                      :aria-label="t('transactionAttachments.paperclipAriaLabel')"
                      :title="t('transactionAttachments.paperclipAriaLabel')"
                    >
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    <span
                      v-if="tx.splitCount > 0"
                      class="material-symbols-outlined text-[16px] text-muted"
                      :aria-label="t('transactionSplits.indicatorAriaLabel')"
                      :title="t('transactionSplits.indicatorAriaLabel')"
                    >call_split</span>
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <div class="text-base font-bold tabular-nums" :class="amountClass(tx)">
                    {{ formattedAmount(tx) }}
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between gap-2">
                <div class="flex min-w-0 flex-1 items-center gap-2">
                  <AppBadge v-if="tx.type === 'TRANSFER'" variant="muted" icon="swap_horiz">{{ t('transactions.transferBadge') }}</AppBadge>
                  <span v-else class="truncate text-xs text-muted">{{ tx.categoryName || '—' }}</span>
                  <span v-if="parseTags(tx.tags).length" class="truncate text-xs text-faint">
                    · {{ parseTags(tx.tags).join(', ') }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <AppBadge :variant="statusConfig[tx.status].variant" :icon="statusConfig[tx.status].icon">
                    {{ statusConfig[tx.status].label }}
                  </AppBadge>
                  <div class="flex items-center gap-1">
                    <AppIconButton icon="edit" :aria-label="t('common.edit')" @click="openEdit(tx)" />
                    <AppIconButton icon="delete" variant="danger" :aria-label="t('common.delete')" @click="requestDeleteTransaction(tx.id)" />
                  </div>
                </div>
              </div>
            </li>
          </ul>

          <!-- Desktop table (lg+) -->
          <div class="hidden lg:block">
            <div class="max-h-[70vh] overflow-auto">
              <table class="w-full min-w-[900px] text-sm">
                <thead>
                  <!-- border-collapse deja atrás los bordes del tr al fijar las th; la línea inferior va como sombra inset en cada celda -->
                  <tr>
                    <th
                      v-if="reconciliation"
                      class="data-th sticky top-0 z-10 w-12 bg-surface-2/95 text-center shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm"
                      :aria-label="t('reconciliation.summary.cleared')"
                    >
                      <span class="material-symbols-outlined text-base text-muted">check_circle</span>
                    </th>
                    <th class="data-th sticky top-0 z-10 bg-surface-2/95 shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm">{{ t('transactions.columns.date') }}</th>
                    <th class="data-th sticky top-0 z-10 bg-surface-2/95 shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm">{{ t('transactions.columns.account') }}</th>
                    <th class="data-th sticky top-0 z-10 bg-surface-2/95 shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm">{{ t('transactions.columns.payee') }}</th>
                    <th class="data-th sticky top-0 z-10 bg-surface-2/95 shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm">{{ t('transactions.columns.category') }}</th>
                    <th class="data-th sticky top-0 z-10 bg-surface-2/95 shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm">{{ t('transactions.columns.tags') }}</th>
                    <th class="data-th sticky top-0 z-10 bg-surface-2/95 shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm">{{ t('transactions.columns.status') }}</th>
                    <th class="data-th sticky top-0 z-10 bg-surface-2/95 text-right text-danger shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm">{{ t('transactions.columns.expense') }}</th>
                    <th class="data-th sticky top-0 z-10 bg-surface-2/95 text-right text-success shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm">{{ t('transactions.columns.income') }}</th>
                    <th class="data-th sticky top-0 z-10 bg-surface-2/95 shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm">{{ t('transactions.columns.memo') }}</th>
                    <th class="data-th sticky top-0 z-10 bg-surface-2/95 shadow-[inset_0_-1px_0_rgb(var(--color-line))] backdrop-blur-sm"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line">
                  <tr
                    v-for="tx in transactions"
                    :key="tx.id"
                    class="group transition-colors hover:bg-surface-2"
                  >
                    <td v-if="reconciliation" class="w-12 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        class="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                        :checked="tx.status === 'CLEARED'"
                        :disabled="reconcilingTransactionId === tx.id"
                        :aria-label="t('reconciliation.summary.cleared')"
                        @change="toggleTransactionCleared(tx)"
                      />
                    </td>
                    <td class="whitespace-nowrap px-4 py-3 font-semibold text-content">
                      {{ formatDate(tx.effectiveDate) }}
                    </td>

                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-faint">account_balance_wallet</span>
                        <span class="font-medium text-muted">{{ tx.accountName }}</span>
                      </div>
                      <div v-if="tx.paymentMethod" class="mt-0.5 text-[11px] text-faint">{{ tx.paymentMethod }}</div>
                    </td>

                    <td class="px-4 py-3 font-semibold text-content">
                      <span class="inline-flex items-center gap-2">
                        <span>{{ tx.type === 'TRANSFER' ? transferLabel(tx) : (tx.payee || '—') }}</span>
                        <svg
                          v-if="tx.attachmentCount > 0"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="text-muted"
                          :aria-label="t('transactionAttachments.paperclipAriaLabel')"
                          :title="t('transactionAttachments.paperclipAriaLabel')"
                        >
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        <span
                          v-if="tx.splitCount > 0"
                          class="material-symbols-outlined text-[16px] text-muted"
                          :aria-label="t('transactionSplits.indicatorAriaLabel')"
                          :title="t('transactionSplits.indicatorAriaLabel')"
                        >call_split</span>
                      </span>
                    </td>

                    <td class="px-4 py-3 text-muted">
                      <AppBadge v-if="tx.type === 'TRANSFER'" variant="muted" icon="swap_horiz">{{ t('transactions.transferBadge') }}</AppBadge>
                      <template v-else>{{ tx.categoryName || '—' }}</template>
                    </td>

                    <td class="px-4 py-3">
                      <div class="flex flex-wrap gap-1">
                        <span v-for="tag in parseTags(tx.tags)" :key="tag" class="badge badge-muted">{{ tag }}</span>
                      </div>
                    </td>

                    <td class="px-4 py-3">
                      <AppBadge :variant="statusConfig[tx.status].variant" :icon="statusConfig[tx.status].icon">
                        {{ statusConfig[tx.status].label }}
                      </AppBadge>
                    </td>

                    <td class="px-4 py-3 text-right font-bold tabular-nums">
                      <span v-if="tx.type === 'EXPENSE'" class="text-danger">{{ formatAmount(tx.amount) }}</span>
                      <span v-else-if="tx.type === 'TRANSFER' && !tx.transferIn" class="text-muted">{{ formatAmount(tx.amount) }}</span>
                    </td>

                    <td class="px-4 py-3 text-right font-bold tabular-nums">
                      <span v-if="tx.type === 'INCOME'" class="text-success">{{ formatAmount(tx.amount) }}</span>
                      <span v-else-if="tx.type === 'TRANSFER' && tx.transferIn" class="text-muted">{{ formatAmount(tx.amount) }}</span>
                    </td>

                    <td class="max-w-[180px] truncate px-4 py-3 text-faint" :title="tx.memo ?? ''">
                      {{ tx.memo || '' }}
                    </td>

                    <td class="px-4 py-3">
                      <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <AppIconButton icon="edit" :aria-label="t('common.edit')" @click="openEdit(tx)" />
                        <AppIconButton icon="delete" variant="danger" :aria-label="t('common.delete')" @click="requestDeleteTransaction(tx.id)" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line px-4 py-4 sm:px-6">
            <span class="text-sm text-muted">{{ t('transactions.totalCount', total) }}</span>
            <div class="flex items-center gap-3">
              <AppButton
                variant="ghost"
                size="sm"
                icon="chevron_left"
                :disabled="page <= 1"
                @click="goToPage(page - 1)"
              >
                {{ t('common.prev') }}
              </AppButton>
              <span class="text-sm font-medium text-content">{{ t('common.pageOf', { page, total: totalPages }) }}</span>
              <AppButton
                variant="ghost"
                size="sm"
                trailing-icon="chevron_right"
                :disabled="page >= totalPages"
                @click="goToPage(page + 1)"
              >
                {{ t('common.next') }}
              </AppButton>
            </div>
          </div>
        </div>
      </PageContainer>

      <!-- Reconciliation summary bar (only while a reconciliation is open) -->
      <Transition name="modal">
        <div
          v-if="reconciliation"
          class="sticky bottom-0 z-20 mt-6 border-t border-line bg-surface/95 px-4 py-4 shadow-[0_-8px_24px_-12px_rgb(var(--color-overlay)/0.25)] backdrop-blur sm:px-6"
        >
          <div class="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:flex lg:items-center lg:gap-6">
              <div class="flex flex-col">
                <span class="text-xs uppercase tracking-wide text-faint">{{ t('reconciliation.summary.cleared') }}</span>
                <span class="font-semibold tabular-nums text-content">{{ formatCurrency(reconciliation.clearedBalance) }}</span>
                <span class="text-xs text-muted">{{ t('reconciliation.summary.clearedCount', reconciliation.clearedCount) }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs uppercase tracking-wide text-faint">{{ t('reconciliation.summary.statement') }}</span>
                <span class="font-semibold tabular-nums text-content">{{ formatCurrency(reconciliation.statementBalance) }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs uppercase tracking-wide text-faint">{{ t('reconciliation.summary.difference') }}</span>
                <span class="font-bold tabular-nums" :class="reconciliationDifferenceClass">{{ formatCurrency(reconciliation.difference) }}</span>
                <span class="text-xs font-medium" :class="reconciliationDifferenceClass">{{ reconciliationDifferenceLabel }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs uppercase tracking-wide text-faint">&nbsp;</span>
                <span class="text-xs text-muted">{{ t('reconciliation.summary.pendingCount', reconciliation.pendingCount) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <AppButton variant="ghost" size="sm" @click="closeReconciliation">{{ t('reconciliation.actions.cancel') }}</AppButton>
              <AppButton
                size="sm"
                icon="check"
                :disabled="!canFinishReconciliation"
                :loading="isFinishingReconciliation"
                @click="finishReconciliation"
              >{{ t('reconciliation.actions.finish') }}</AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </main>

    <AppModal
      :is-open="reconciliationOpen"
      :title="t('reconciliation.openDialog.title')"
      icon="fact_check"
      size="sm"
      @close="closeReconciliation"
    >
      <div class="flex flex-col gap-4 p-6">
        <p class="text-sm text-muted">{{ t('reconciliation.openDialog.hint') }}</p>
        <AppInput
          :label="t('reconciliation.openDialog.statementDateLabel')"
          type="date"
          :model-value="openReconciliationDate"
          @update:model-value="(v: string) => { openReconciliationDate = v }"
        />
        <AppInput
          :label="t('reconciliation.openDialog.statementBalanceLabel')"
          type="number"
          step="0.01"
          :model-value="openReconciliationBalance"
          @update:model-value="(v: string) => { openReconciliationBalance = v }"
        />
        <div class="flex justify-end gap-2 pt-2">
          <AppButton variant="ghost" size="sm" @click="closeReconciliation">{{ t('reconciliation.actions.cancel') }}</AppButton>
          <AppButton size="sm" icon="play_arrow" :loading="isOpeningReconciliation" @click="startReconciliation">{{ t('reconciliation.actions.start') }}</AppButton>
        </div>
      </div>
    </AppModal>

    <ConfirmDialog
      :is-open="confirmDeleteId !== null"
      :title="t('transactions.deleteDialog.title')"
      :message="t('transactions.deleteDialog.message')"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="confirmDeleteId = null"
    />

    <AddTransactionModal
      :is-open="modalOpen"
      :mode="modalMode"
      :transaction="editingTransaction"
      @close="closeModal"
      @saved="onSaved"
    />

    <ImportModal
      :is-open="importModalOpen"
      @close="importModalOpen = false"
      @imported="onImported"
    />
  </div>
</template>
