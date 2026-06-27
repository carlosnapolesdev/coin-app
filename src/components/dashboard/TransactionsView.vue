<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from './Sidebar.vue'
import AddTransactionModal from './AddTransactionModal.vue'
import { AppBadge, AppButton, AppIconButton, AppSpinner, PageHeader } from '../ui'
import { type AccountDetail, accountsApi } from '../../services/accounts'
import { type TransactionDetail, type TransactionStatus, transactionsApi } from '../../services/transactions'

const transactions = ref<TransactionDetail[]>([])
const accounts = ref<AccountDetail[]>([])
const selectedAccountId = ref<number | null>(null)
const searchQuery = ref('')
const isLoading = ref(false)
const error = ref('')
const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingTransaction = ref<TransactionDetail | undefined>(undefined)

const filteredTransactions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return transactions.value
  return transactions.value.filter(t =>
    t.payee?.toLowerCase().includes(q) ||
    t.categoryName?.toLowerCase().includes(q) ||
    t.memo?.toLowerCase().includes(q) ||
    t.tags?.toLowerCase().includes(q)
  )
})

const loadTransactions = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const res = await transactionsApi.list({ accountId: selectedAccountId.value ?? undefined })
    transactions.value = res.data
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

const onAccountChange = () => {
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

const onSaved = () => {
  loadTransactions()
}

const deleteTransaction = async (id: number) => {
  if (!confirm('Delete this transaction?')) return
  try {
    await transactionsApi.remove(id)
    await loadTransactions()
  } catch {
    error.value = 'Failed to delete transaction.'
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
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-bg">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <PageHeader title="Transactions" subtitle="Your financial ledger">
        <template #actions>
          <div class="relative hidden md:block">
            <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search records..."
              class="field-input w-64 pl-11"
            />
          </div>
          <AppButton icon="add" @click="openCreate">Add Transaction</AppButton>
        </template>
      </PageHeader>

      <!-- Filters -->
      <div class="border-b border-line bg-surface px-6 py-4 lg:px-8">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-muted">Account</span>
          <div class="relative">
            <select
              v-model="selectedAccountId"
              class="field-input appearance-none py-2 pr-10"
              @change="onAccountChange"
            >
              <option :value="null">All accounts</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </select>
            <span class="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-faint">unfold_more</span>
          </div>
          <span v-if="selectedAccountId" class="text-xs text-muted">Running balance shown</span>

          <!-- Mobile search -->
          <div class="relative w-full md:hidden">
            <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">search</span>
            <input v-model="searchQuery" type="text" placeholder="Search records..." class="field-input pl-11" />
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 lg:p-8">
        <div v-if="error" class="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
          {{ error }}
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center justify-center py-24 text-primary">
          <AppSpinner size="lg" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="filteredTransactions.length === 0"
          class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface py-24 text-center"
        >
          <span class="material-symbols-outlined mb-4 text-5xl text-faint">receipt_long</span>
          <p class="font-semibold text-content">No transactions yet</p>
          <p class="mt-1 text-sm text-muted">Click "Add Transaction" to get started</p>
          <AppButton class="mt-6" icon="add" @click="openCreate">Add Transaction</AppButton>
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
                  <th v-if="selectedAccountId" class="data-th text-right">Balance</th>
                  <th class="data-th">Memo</th>
                  <th class="data-th"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                <tr
                  v-for="t in filteredTransactions"
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
                    {{ t.payee || '—' }}
                  </td>

                  <td class="px-4 py-3 text-muted">
                    {{ t.categoryName || '—' }}
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

                  <td class="px-4 py-3 text-right font-bold">
                    <span v-if="t.type === 'EXPENSE'" class="text-danger">{{ formatAmount(t.amount) }}</span>
                  </td>

                  <td class="px-4 py-3 text-right font-bold">
                    <span v-if="t.type === 'INCOME'" class="text-success">{{ formatAmount(t.amount) }}</span>
                  </td>

                  <td v-if="selectedAccountId" class="px-4 py-3 text-right font-bold">
                    <span
                      v-if="t.balance !== null && t.balance !== undefined"
                      :class="t.balance >= 0 ? 'text-content' : 'text-danger'"
                    >
                      {{ formatAmount(t.balance) }}
                    </span>
                    <span v-else class="text-faint">—</span>
                  </td>

                  <td class="max-w-[180px] truncate px-4 py-3 text-faint" :title="t.memo ?? ''">
                    {{ t.memo || '' }}
                  </td>

                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <AppIconButton icon="edit" aria-label="Edit" @click="openEdit(t)" />
                      <AppIconButton icon="delete" variant="danger" aria-label="Delete" @click="deleteTransaction(t.id)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <AddTransactionModal
      :is-open="modalOpen"
      :mode="modalMode"
      :transaction="editingTransaction"
      @close="modalOpen = false"
      @saved="onSaved"
    />
  </div>
</template>
