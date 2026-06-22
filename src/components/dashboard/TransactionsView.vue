<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from './Sidebar.vue'
import AddTransactionModal from './AddTransactionModal.vue'
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
    const res = await transactionsApi.list(selectedAccountId.value ?? undefined)
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

const statusConfig: Record<TransactionStatus, { label: string; class: string; icon: string }> = {
  CLEARED: { label: 'Cleared', class: 'bg-emerald-100 text-emerald-700', icon: 'check_circle' },
  PENDING: { label: 'Pending', class: 'bg-amber-100 text-amber-700', icon: 'pending' },
  VOID: { label: 'Void', class: 'bg-slate-100 text-slate-500', icon: 'block' },
}

const parseTags = (tags: string | null) =>
  tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background text-on-background">
    <Sidebar @add-transaction="openCreate" />

    <main class="flex-1 overflow-y-auto">
      <!-- Header -->
      <header class="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-background/80 px-8 py-6 backdrop-blur-md">
        <div>
          <h1 class="text-3xl font-black uppercase tracking-tighter text-slate-900">Transactions</h1>
          <p class="mt-1 text-[12px] font-bold uppercase tracking-widest text-slate-500">Global Financial Ledger</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="hidden items-center rounded-full border border-slate-100 bg-white px-6 py-2 shadow-sm md:flex">
            <span class="material-symbols-outlined mr-2 text-xl text-slate-400">search</span>
            <input
              v-model="searchQuery"
              class="w-48 border-none bg-transparent text-sm font-medium focus:ring-0"
              placeholder="Search records..."
              type="text"
            />
          </div>
          <button
            class="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            @click="openCreate"
          >
            <span class="material-symbols-outlined">add</span>
            Add Transaction
          </button>
        </div>
      </header>

      <!-- Filters -->
      <div class="border-b border-slate-100 bg-white px-8 py-4">
        <div class="flex items-center gap-4">
          <label class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Account</label>
          <select
            v-model="selectedAccountId"
            class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 focus:border-primary focus:ring-0"
            @change="onAccountChange"
          >
            <option :value="null">All accounts</option>
            <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
          </select>
          <span v-if="selectedAccountId" class="text-[11px] text-slate-400">
            Running balance shown
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="px-8 py-6">
        <div v-if="error" class="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {{ error }}
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center justify-center py-24">
          <span class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></span>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="filteredTransactions.length === 0"
          class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-24 text-center"
        >
          <span class="material-symbols-outlined mb-4 text-5xl text-slate-300">receipt_long</span>
          <p class="font-bold text-slate-500">No transactions yet</p>
          <p class="mt-1 text-sm text-slate-400">Click "Add Transaction" to get started</p>
          <button
            class="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-widest text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
            @click="openCreate"
          >
            Add Transaction
          </button>
        </div>

        <!-- Table -->
        <div v-else class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-sm">
              <thead>
                <tr class="border-b border-slate-100 bg-slate-50 text-left">
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Payee</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tags</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-rose-400">Expense</th>
                  <th class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-emerald-500">Income</th>
                  <th v-if="selectedAccountId" class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Balance</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Memo</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr
                  v-for="t in filteredTransactions"
                  :key="t.id"
                  class="group transition-colors hover:bg-slate-50"
                >
                  <!-- Date -->
                  <td class="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">
                    {{ formatDate(t.effectiveDate) }}
                  </td>

                  <!-- Account / Info -->
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-base text-slate-400">account_balance_wallet</span>
                      <span class="font-medium text-slate-600">{{ t.accountName }}</span>
                    </div>
                    <div v-if="t.paymentMethod" class="mt-0.5 text-[11px] text-slate-400">{{ t.paymentMethod }}</div>
                  </td>

                  <!-- Payee -->
                  <td class="px-4 py-3 font-semibold text-slate-800">
                    {{ t.payee || '—' }}
                  </td>

                  <!-- Category -->
                  <td class="px-4 py-3 text-slate-600">
                    {{ t.categoryName || '—' }}
                  </td>

                  <!-- Tags -->
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="tag in parseTags(t.tags)"
                        :key="tag"
                        class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </td>

                  <!-- Status -->
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      :class="statusConfig[t.status].class"
                    >
                      <span class="material-symbols-outlined text-xs" style="font-size:14px">{{ statusConfig[t.status].icon }}</span>
                      {{ statusConfig[t.status].label }}
                    </span>
                  </td>

                  <!-- Expense -->
                  <td class="px-4 py-3 text-right font-bold">
                    <span v-if="t.type === 'EXPENSE'" class="text-rose-600">
                      {{ formatAmount(t.amount) }}
                    </span>
                  </td>

                  <!-- Income -->
                  <td class="px-4 py-3 text-right font-bold">
                    <span v-if="t.type === 'INCOME'" class="text-emerald-600">
                      {{ formatAmount(t.amount) }}
                    </span>
                  </td>

                  <!-- Balance (only when account filtered) -->
                  <td v-if="selectedAccountId" class="px-4 py-3 text-right font-bold">
                    <span
                      v-if="t.balance !== null && t.balance !== undefined"
                      :class="t.balance >= 0 ? 'text-slate-700' : 'text-rose-600'"
                    >
                      {{ formatAmount(t.balance) }}
                    </span>
                    <span v-else class="text-slate-300">—</span>
                  </td>

                  <!-- Memo -->
                  <td class="max-w-[180px] truncate px-4 py-3 text-slate-400" :title="t.memo ?? ''">
                    {{ t.memo || '' }}
                  </td>

                  <!-- Actions -->
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Edit"
                        @click="openEdit(t)"
                      >
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                        @click="deleteTransaction(t.id)"
                      >
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
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
