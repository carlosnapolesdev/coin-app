<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import api from '../../services/api'
import { type CreateTransactionPayload, type TransactionDetail, type TransactionStatus, type TransactionType, transactionsApi } from '../../services/transactions'
import { type AccountDetail, accountsApi } from '../../services/accounts'

type FormMode = 'create' | 'edit'

interface BackendCategory {
  id: number
  name: string
  type: 'EXPENSE' | 'INCOME'
  icon: string
  parentId: number | null
  active: boolean
  children: BackendCategory[]
}

interface FlatCategory {
  id: number
  label: string
  type: 'EXPENSE' | 'INCOME'
  indent: boolean
}

const props = defineProps<{
  isOpen: boolean
  mode: FormMode
  transaction?: TransactionDetail
}>()

const emit = defineEmits<{
  close: []
  saved: [transaction: TransactionDetail]
}>()

const selectedType = ref<TransactionType>('EXPENSE')
const effectiveDate = ref('')
const amount = ref('')
const accountId = ref<number | null>(null)
const paymentMethod = ref('')
const payee = ref('')
const categoryId = ref<number | null>(null)
const status = ref<TransactionStatus>('CLEARED')
const memo = ref('')
const tags = ref('')

const accounts = ref<AccountDetail[]>([])
const allCategories = ref<BackendCategory[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref('')

const today = new Date().toISOString().slice(0, 10)

const filteredCategories = computed<FlatCategory[]>(() => {
  if (selectedType.value === 'TRANSFER') return []
  const typeFilter = selectedType.value === 'INCOME' ? 'INCOME' : 'EXPENSE'
  const result: FlatCategory[] = []
  for (const cat of allCategories.value) {
    if (cat.type !== typeFilter) continue
    result.push({ id: cat.id, label: cat.name, type: cat.type, indent: false })
    for (const child of cat.children ?? []) {
      result.push({ id: child.id, label: `${cat.name} › ${child.name}`, type: child.type, indent: true })
    }
  }
  return result
})

const isSaveDisabled = computed(() => {
  return isSaving.value || !amount.value || !accountId.value || !effectiveDate.value
})

const resetForm = () => {
  selectedType.value = 'EXPENSE'
  effectiveDate.value = today
  amount.value = ''
  accountId.value = accounts.value[0]?.id ?? null
  paymentMethod.value = ''
  payee.value = ''
  categoryId.value = null
  status.value = 'CLEARED'
  memo.value = ''
  tags.value = ''
  error.value = ''
}

const populateFromTransaction = (t: TransactionDetail) => {
  selectedType.value = t.type
  effectiveDate.value = t.effectiveDate
  amount.value = String(t.amount)
  accountId.value = t.accountId
  paymentMethod.value = t.paymentMethod ?? ''
  payee.value = t.payee ?? ''
  categoryId.value = t.categoryId ?? null
  status.value = t.status
  memo.value = t.memo ?? ''
  tags.value = t.tags ?? ''
}

const loadData = async () => {
  isLoading.value = true
  try {
    const [accountsRes, categoriesRes] = await Promise.all([
      accountsApi.list(),
      api.get<BackendCategory[]>('/users/me/categories'),
    ])
    accounts.value = accountsRes.data
    allCategories.value = categoriesRes.data

    if (props.mode === 'edit' && props.transaction) {
      populateFromTransaction(props.transaction)
    } else {
      resetForm()
      accountId.value = accounts.value[0]?.id ?? null
    }
  } catch {
    error.value = 'Failed to load data. Please try again.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => { if (open) loadData() }
)

watch(selectedType, () => {
  categoryId.value = null
})

const handleClose = () => {
  error.value = ''
  emit('close')
}

const handleSave = async (keepOpen = false) => {
  if (isSaveDisabled.value) return
  isSaving.value = true
  error.value = ''

  const payload: CreateTransactionPayload = {
    accountId: accountId.value!,
    categoryId: categoryId.value ?? undefined,
    type: selectedType.value,
    amount: parseFloat(amount.value),
    effectiveDate: effectiveDate.value,
    payee: payee.value || undefined,
    paymentMethod: paymentMethod.value || undefined,
    memo: memo.value || undefined,
    status: status.value,
    tags: tags.value || undefined,
  }

  try {
    let saved: TransactionDetail
    if (props.mode === 'edit' && props.transaction) {
      const res = await transactionsApi.update(props.transaction.id, payload)
      saved = res.data
    } else {
      const res = await transactionsApi.create(payload)
      saved = res.data
    }
    emit('saved', saved)
    if (keepOpen) {
      resetForm()
      accountId.value = accounts.value[0]?.id ?? null
    } else {
      handleClose()
    }
  } catch {
    error.value = 'Failed to save transaction. Please try again.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div class="w-full max-w-2xl overflow-hidden rounded-3xl border border-white bg-white shadow-2xl shadow-slate-200/50">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-8 py-6">
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-primary/20 p-2">
            <span class="material-symbols-outlined font-bold text-primary">add_circle</span>
          </div>
          <h2 class="text-xl font-black uppercase tracking-tight text-slate-900">
            {{ mode === 'create' ? 'Add Transaction' : 'Edit Transaction' }}
          </h2>
        </div>
        <button class="text-slate-400 transition-colors hover:text-red-500" type="button" @click="handleClose">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Body -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <span class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></span>
      </div>

      <form v-else class="space-y-8 p-8" @submit.prevent="handleSave(false)">
        <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {{ error }}
        </div>

        <!-- Type selector -->
        <div class="flex rounded-2xl border border-slate-100 bg-slate-50 p-1">
          <button
            v-for="t in (['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[])"
            :key="t"
            type="button"
            class="flex-1 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest transition-all"
            :class="selectedType === t
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-400 hover:text-slate-600'"
            @click="selectedType = t"
          >
            {{ t.charAt(0) + t.slice(1).toLowerCase() }}
          </button>
        </div>

        <!-- Transfer placeholder -->
        <div v-if="selectedType === 'TRANSFER'" class="rounded-2xl border border-slate-100 bg-slate-50 py-12 text-center text-slate-400">
          <span class="material-symbols-outlined mb-2 text-4xl">swap_horiz</span>
          <p class="text-sm font-semibold">Transfer support coming soon</p>
        </div>

        <template v-else>
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <!-- Date -->
            <div class="space-y-2">
              <label class="block px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Effective Date</label>
              <div class="group relative">
                <input
                  v-model="effectiveDate"
                  type="date"
                  class="w-full rounded-xl border-none bg-slate-50 py-4 pl-12 pr-4 font-bold text-slate-900 transition-all focus:bg-white"
                  :disabled="isSaving"
                />
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">calendar_today</span>
              </div>
            </div>

            <!-- Amount -->
            <div class="space-y-2">
              <label class="block px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</label>
              <div class="group relative">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">attach_money</span>
                <input
                  v-model="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  class="w-full rounded-xl border-none bg-slate-50 py-4 pl-12 pr-4 text-lg font-black text-slate-900 transition-all focus:bg-white"
                  :disabled="isSaving"
                />
              </div>
            </div>

            <!-- Account -->
            <div class="space-y-2">
              <label class="block px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Source Account</label>
              <select
                v-model="accountId"
                class="w-full appearance-none rounded-xl border-none bg-slate-50 px-4 py-4 font-bold text-slate-900 transition-all focus:bg-white"
                :disabled="isSaving"
              >
                <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
              </select>
            </div>

            <!-- Payment Method -->
            <div class="space-y-2">
              <label class="block px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment Method</label>
              <select
                v-model="paymentMethod"
                class="w-full appearance-none rounded-xl border-none bg-slate-50 px-4 py-4 font-bold text-slate-400 transition-all focus:bg-white"
                :disabled="isSaving"
              >
                <option value="">(none)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
              </select>
            </div>

            <!-- Payee -->
            <div class="space-y-2">
              <label class="block px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Payee / Entity</label>
              <input
                v-model="payee"
                type="text"
                placeholder="Enter name..."
                class="w-full rounded-xl border-none bg-slate-50 px-4 py-4 font-bold text-slate-900 transition-all focus:bg-white"
                :disabled="isSaving"
              />
            </div>

            <!-- Category -->
            <div class="space-y-2">
              <label class="block px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</label>
              <select
                v-model="categoryId"
                class="w-full appearance-none rounded-xl border-none bg-slate-50 px-4 py-4 font-bold text-slate-900 transition-all focus:bg-white"
                :disabled="isSaving"
              >
                <option :value="null">(none)</option>
                <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                  {{ cat.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Status -->
          <div class="space-y-3">
            <label class="block px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ledger Status</label>
            <div class="flex rounded-xl border border-slate-100 bg-slate-50 p-1 w-fit gap-1">
              <button
                v-for="s in (['PENDING', 'CLEARED', 'VOID'] as TransactionStatus[])"
                :key="s"
                type="button"
                class="flex h-12 w-12 items-center justify-center rounded-lg transition-all"
                :class="status === s
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-slate-300 hover:bg-white'"
                :title="s"
                :disabled="isSaving"
                @click="status = s"
              >
                <span
                  class="material-symbols-outlined"
                  :style="status === s ? 'font-variation-settings: \'FILL\' 1' : ''"
                >
                  {{ s === 'PENDING' ? 'pending' : s === 'CLEARED' ? 'check_circle' : 'block' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Memo & Tags -->
          <div class="space-y-6">
            <div class="space-y-2">
              <label class="block px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Memo / Private Notes</label>
              <textarea
                v-model="memo"
                placeholder="Describe this transaction..."
                rows="2"
                class="w-full resize-none rounded-xl border-none bg-slate-50 p-4 font-medium text-slate-900 transition-all focus:bg-white"
                :disabled="isSaving"
              ></textarea>
            </div>
            <div class="space-y-2">
              <label class="block px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tags</label>
              <input
                v-model="tags"
                type="text"
                placeholder="Comma-separated tags..."
                class="w-full rounded-xl border-none bg-slate-50 px-4 py-4 font-bold text-slate-900 transition-all focus:bg-white"
                :disabled="isSaving"
              />
            </div>
          </div>
        </template>

        <!-- Actions -->
        <div class="flex flex-col gap-4 border-t border-slate-50 pt-4 md:flex-row">
          <button
            type="button"
            class="rounded-xl px-8 py-4 text-[12px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-slate-50"
            :disabled="isSaving"
            @click="handleClose"
          >
            Close
          </button>
          <div class="flex-1"></div>
          <button
            v-if="mode === 'create' && selectedType !== 'TRANSFER'"
            type="button"
            class="rounded-xl border-2 border-slate-100 px-8 py-4 text-[12px] font-black uppercase tracking-widest text-slate-600 transition-all hover:border-slate-300 disabled:opacity-50"
            :disabled="isSaveDisabled"
            @click="handleSave(true)"
          >
            Add &amp; Keep
          </button>
          <button
            v-if="selectedType !== 'TRANSFER'"
            type="submit"
            class="rounded-xl bg-primary px-10 py-4 text-[12px] font-black uppercase tracking-widest text-on-primary shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center gap-2"
            :disabled="isSaveDisabled"
          >
            <span v-if="isSaving" class="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></span>
            {{ isSaving ? 'Saving...' : mode === 'create' ? 'Add Transaction' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
