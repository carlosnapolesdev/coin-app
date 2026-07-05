<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from './Sidebar.vue'
import AddTransactionModal from './AddTransactionModal.vue'
import ImportModal from './ImportModal.vue'
import { AppBadge, AppButton, AppIconButton, AppInput, AppSelect, AppSpinner, ConfirmDialog, PageContainer, PageHeader } from '../ui'
import { type AccountDetail, accountsApi } from '../../services/accounts'
import { type TransactionDetail, type TransactionStatus, type TransactionType, transactionsApi } from '../../services/transactions'

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
    error.value = 'Failed to load transactions.'
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
  } catch {
    error.value = 'Failed to export transactions.'
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
  } catch {
    error.value = 'Failed to delete transaction.'
  } finally {
    isDeleting.value = false
  }
}

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)

const statusConfig: Record<TransactionStatus, { label: string; variant: 'success' | 'warning' | 'muted'; icon: string }> = {
  CLEARED: { label: 'Cleared', variant: 'success', icon: 'check_circle' },
  PENDING: { label: 'Pending', variant: 'warning', icon: 'pending' },
  VOID: { label: 'Void', variant: 'muted', icon: 'block' },
}

const parseTags = (tags: string | null) =>
  tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []

const transferLabel = (t: TransactionDetail) => {
  const counterpart = accounts.value.find(a => a.id === t.transferAccountId)?.name ?? 'account'
  return t.transferIn ? `Transfer from ${counterpart}` : `Transfer to ${counterpart}`
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-bg">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <PageHeader title="Transactions" subtitle="Your financial ledger" />

      <!-- Content -->
      <PageContainer>
        <div v-if="error" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
          {{ error }}
        </div>

        <!-- Filters -->
        <div class="surface-card mb-6 flex flex-col gap-4 p-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AppSelect
              label="Account"
              :model-value="selectedAccountId ?? ''"
              @update:model-value="(v) => { selectedAccountId = v ? Number(v) : null; applyFilters() }"
            >
              <option value="">All accounts</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </AppSelect>

            <AppSelect
              label="Type"
              :model-value="typeFilter"
              @update:model-value="(v) => { typeFilter = v as TransactionType | ''; applyFilters() }"
            >
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
            </AppSelect>

            <AppSelect
              label="Status"
              :model-value="statusFilter"
              @update:model-value="(v) => { statusFilter = v as TransactionStatus | ''; applyFilters() }"
            >
              <option value="">All statuses</option>
              <option value="CLEARED">Cleared</option>
              <option value="PENDING">Pending</option>
              <option value="VOID">Void</option>
            </AppSelect>

            <AppInput
              label="Search"
              icon="search"
              placeholder="Payee, memo, tags..."
              :model-value="searchQuery"
              @update:model-value="onSearchInput"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AppInput
              label="From date"
              type="date"
              :model-value="fromDate"
              @update:model-value="(v) => { fromDate = v; applyFilters() }"
            />
            <AppInput
              label="To date"
              type="date"
              :model-value="toDate"
              @update:model-value="(v) => { toDate = v; applyFilters() }"
            />
            <div class="flex items-end gap-2 lg:col-span-2 lg:justify-end">
              <AppButton variant="secondary" icon="upload_file" @click="importModalOpen = true">Import</AppButton>
              <AppButton variant="secondary" icon="download" :loading="isExporting" @click="exportTransactions">Export</AppButton>
              <AppButton icon="add" @click="openCreate">Add Transaction</AppButton>
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
          <p class="font-semibold text-content">{{ hasActiveFilters ? 'No transactions match your filters' : 'No transactions yet' }}</p>
          <p class="mt-1 text-sm text-muted">
            {{ hasActiveFilters ? 'Try adjusting the search or filters above.' : 'Click "Add Transaction" to get started' }}
          </p>
          <AppButton v-if="!hasActiveFilters" class="mt-6" icon="add" @click="openCreate">Add Transaction</AppButton>
        </div>

        <!-- Table -->
        <div v-else class="surface-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-sm">
              <thead>
                <tr class="border-b border-line bg-surface-2/50">
                  <th class="data-th">Date</th>
                  <th class="data-th">Account</th>
                  <th class="data-th">Payee</th>
                  <th class="data-th">Category</th>
                  <th class="data-th">Tags</th>
                  <th class="data-th">Status</th>
                  <th class="data-th text-right text-danger">Expense</th>
                  <th class="data-th text-right text-success">Income</th>
                  <th class="data-th">Memo</th>
                  <th class="data-th"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                <tr
                  v-for="t in transactions"
                  :key="t.id"
                  class="group transition-colors hover:bg-surface-2"
                >
                  <td class="whitespace-nowrap px-4 py-3 font-semibold text-content">
                    {{ formatDate(t.effectiveDate) }}
                  </td>

                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-base text-faint">account_balance_wallet</span>
                      <span class="font-medium text-muted">{{ t.accountName }}</span>
                    </div>
                    <div v-if="t.paymentMethod" class="mt-0.5 text-[11px] text-faint">{{ t.paymentMethod }}</div>
                  </td>

                  <td class="px-4 py-3 font-semibold text-content">
                    {{ t.type === 'TRANSFER' ? transferLabel(t) : (t.payee || '—') }}
                  </td>

                  <td class="px-4 py-3 text-muted">
                    <AppBadge v-if="t.type === 'TRANSFER'" variant="muted" icon="swap_horiz">Transfer</AppBadge>
                    <template v-else>{{ t.categoryName || '—' }}</template>
                  </td>

                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="tag in parseTags(t.tags)" :key="tag" class="badge badge-muted">{{ tag }}</span>
                    </div>
                  </td>

                  <td class="px-4 py-3">
                    <AppBadge :variant="statusConfig[t.status].variant" :icon="statusConfig[t.status].icon">
                      {{ statusConfig[t.status].label }}
                    </AppBadge>
                  </td>

                  <td class="px-4 py-3 text-right font-bold tabular-nums">
                    <span v-if="t.type === 'EXPENSE'" class="text-danger">{{ formatAmount(t.amount) }}</span>
                    <span v-else-if="t.type === 'TRANSFER' && !t.transferIn" class="text-muted">{{ formatAmount(t.amount) }}</span>
                  </td>

                  <td class="px-4 py-3 text-right font-bold tabular-nums">
                    <span v-if="t.type === 'INCOME'" class="text-success">{{ formatAmount(t.amount) }}</span>
                    <span v-else-if="t.type === 'TRANSFER' && t.transferIn" class="text-muted">{{ formatAmount(t.amount) }}</span>
                  </td>

                  <td class="max-w-[180px] truncate px-4 py-3 text-faint" :title="t.memo ?? ''">
                    {{ t.memo || '' }}
                  </td>

                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <AppIconButton icon="edit" aria-label="Edit" @click="openEdit(t)" />
                      <AppIconButton icon="delete" variant="danger" aria-label="Delete" @click="requestDeleteTransaction(t.id)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between border-t border-line px-6 py-4">
            <span class="text-sm text-muted">{{ total }} transaction{{ total === 1 ? '' : 's' }}</span>
            <div class="flex items-center gap-3">
              <AppButton
                variant="ghost"
                size="sm"
                icon="chevron_left"
                :disabled="page <= 1"
                @click="goToPage(page - 1)"
              >
                Prev
              </AppButton>
              <span class="text-sm font-medium text-content">Page {{ page }} of {{ totalPages }}</span>
              <AppButton
                variant="ghost"
                size="sm"
                trailing-icon="chevron_right"
                :disabled="page >= totalPages"
                @click="goToPage(page + 1)"
              >
                Next
              </AppButton>
            </div>
          </div>
        </div>
      </PageContainer>
    </main>

    <ConfirmDialog
      :is-open="confirmDeleteId !== null"
      title="Delete transaction?"
      message="This transaction will be permanently removed. This can't be undone."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="confirmDeleteId = null"
    />

    <AddTransactionModal
      :is-open="modalOpen"
      :mode="modalMode"
      :transaction="editingTransaction"
      @close="modalOpen = false"
      @saved="onSaved"
    />

    <ImportModal
      :is-open="importModalOpen"
      @close="importModalOpen = false"
      @imported="onImported"
    />
  </div>
</template>
