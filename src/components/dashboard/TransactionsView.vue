<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import AddTransactionModal from './AddTransactionModal.vue'
import ImportModal from './ImportModal.vue'
import CoachMark from '../onboarding/CoachMark.vue'
import { AppBadge, AppButton, AppIconButton, AppInput, AppSelect, AppSpinner, ConfirmDialog, PageContainer, PageHeader } from '../ui'
import { type AccountDetail, accountsApi } from '../../services/accounts'
import { type TransactionDetail, type TransactionStatus, type TransactionType, transactionsApi } from '../../services/transactions'
import { formatCurrency, formatDate as formatDateLocale } from '../../utils/format'
import { useOnboarding } from '../../composables/useOnboarding'
import { useToast } from '../../composables/useToast'

const { t } = useI18n()
const { notifyTransactionCreated, flushCelebration } = useOnboarding()
const toast = useToast()

const PAGE_SIZE = 25
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
            <div class="flex flex-wrap items-end gap-2 lg:col-span-2 lg:justify-end">
              <AppButton variant="secondary" icon="upload_file" @click="importModalOpen = true">{{ t('transactions.actions.import') }}</AppButton>
              <AppButton variant="secondary" icon="download" :loading="isExporting" @click="exportTransactions">{{ t('transactions.actions.export') }}</AppButton>
              <CoachMark coach-key="transactions" :text="t('onboarding.coach.transactions')" placement="bottom">
                <AppButton icon="add" @click="openCreate">{{ t('transactions.actions.add') }}</AppButton>
              </CoachMark>
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

        <!-- Table -->
        <div v-else class="surface-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-sm">
              <thead>
                <tr class="border-b border-line bg-surface-2/50">
                  <th class="data-th">{{ t('transactions.columns.date') }}</th>
                  <th class="data-th">{{ t('transactions.columns.account') }}</th>
                  <th class="data-th">{{ t('transactions.columns.payee') }}</th>
                  <th class="data-th">{{ t('transactions.columns.category') }}</th>
                  <th class="data-th">{{ t('transactions.columns.tags') }}</th>
                  <th class="data-th">{{ t('transactions.columns.status') }}</th>
                  <th class="data-th text-right text-danger">{{ t('transactions.columns.expense') }}</th>
                  <th class="data-th text-right text-success">{{ t('transactions.columns.income') }}</th>
                  <th class="data-th">{{ t('transactions.columns.memo') }}</th>
                  <th class="data-th"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                <tr
                  v-for="tx in transactions"
                  :key="tx.id"
                  class="group transition-colors hover:bg-surface-2"
                >
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

          <div class="flex items-center justify-between border-t border-line px-6 py-4">
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
    </main>

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
