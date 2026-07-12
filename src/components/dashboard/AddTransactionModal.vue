<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../services/api'
import { type CreateTransactionPayload, type SplitDetail, type SplitInput, type TransactionDetail, type TransactionStatus, type TransactionType, transactionsApi } from '../../services/transactions'
import { type AccountDetail, accountsApi } from '../../services/accounts'
import { currenciesApi } from '../../services/currencies'
import TransactionAttachmentsPanel from './TransactionAttachmentsPanel.vue'
import { formatCurrency } from '../../utils/format'
import { AppButton, AppIconButton, AppModal, AppSpinner } from '../ui'

const { t } = useI18n()

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

interface SplitRow {
  uid: number
  categoryId: number | null
  amount: string
  memo: string
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
const destinationAccountId = ref<number | null>(null)
const paymentMethod = ref('')
const payee = ref('')
const categoryId = ref<number | null>(null)
const status = ref<TransactionStatus>('CLEARED')
const memo = ref('')
const tags = ref('')
const exchangeRate = ref('')

const splitsEnabled = ref(false)
const splits = ref<SplitRow[]>([])
// Split count as persisted on the server; when > 0 the backend blocks PATCHes
// touching amount/category/type, so saving must clear splits before updating.
const serverSplitCount = ref(0)
let nextSplitUid = 1

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

const destinationAccounts = computed(() => accounts.value.filter((acc) => acc.id !== accountId.value))

const sourceCurrencyId = computed(() => accounts.value.find((a) => a.id === accountId.value)?.currencyId ?? null)
const destinationCurrencyId = computed(() => accounts.value.find((a) => a.id === destinationAccountId.value)?.currencyId ?? null)
const sourceCurrencyCode = computed(() => accounts.value.find((a) => a.id === accountId.value)?.currencyCode ?? '')
const destinationCurrencyCode = computed(() => accounts.value.find((a) => a.id === destinationAccountId.value)?.currencyCode ?? '')
const needsExchangeRate = computed(() =>
  selectedType.value === 'TRANSFER' &&
  sourceCurrencyId.value !== null &&
  destinationCurrencyId.value !== null &&
  sourceCurrencyId.value !== destinationCurrencyId.value
)

const splitsTotal = computed(() =>
  splits.value.reduce((s, row) => s + (parseFloat(row.amount) || 0), 0)
)

const splitsRemaining = computed(() => {
  const total = parseFloat(amount.value) || 0
  return Math.round((total - splitsTotal.value) * 100) / 100
})

const splitsValid = computed(() => {
  if (splits.value.length < 2) return false
  if (splits.value.some((s) => !s.categoryId || !(parseFloat(s.amount) > 0))) return false
  return splitsRemaining.value === 0
})

const splitsStatus = computed<{ tone: 'success' | 'warning' | 'danger'; message: string }>(() => {
  const remaining = splitsRemaining.value
  if (remaining === 0) {
    return { tone: 'success', message: t('transactionSplits.remainingMatch') }
  }
  const formatted = formatCurrency(Math.abs(remaining))
  if (remaining > 0) {
    return { tone: 'warning', message: t('transactionSplits.remaining', { amount: formatted }) }
  }
  return { tone: 'danger', message: t('transactionSplits.overflow', { amount: formatted }) }
})

const isSaveDisabled = computed(() => {
  if (isSaving.value || !amount.value || !accountId.value || !effectiveDate.value) return true
  if (selectedType.value === 'TRANSFER' && !destinationAccountId.value) return true
  if (needsExchangeRate.value && !exchangeRate.value) return true
  if (splitsEnabled.value && !splitsValid.value) return true
  return false
})

const resetForm = () => {
  selectedType.value = 'EXPENSE'
  effectiveDate.value = today
  amount.value = ''
  accountId.value = accounts.value[0]?.id ?? null
  destinationAccountId.value = null
  paymentMethod.value = ''
  payee.value = ''
  categoryId.value = null
  status.value = 'CLEARED'
  memo.value = ''
  tags.value = ''
  exchangeRate.value = ''
  splitsEnabled.value = false
  splits.value = []
  serverSplitCount.value = 0
  error.value = ''
}

const newSplitRow = (): SplitRow => ({
  uid: nextSplitUid++,
  categoryId: null,
  amount: '',
  memo: '',
})

const populateSplits = (details: SplitDetail[]) => {
  splits.value = details.map((d) => ({
    uid: nextSplitUid++,
    categoryId: d.categoryId,
    amount: String(d.amount),
    memo: d.memo ?? '',
  }))
}

const populateFromTransaction = (t: TransactionDetail) => {
  selectedType.value = t.type
  effectiveDate.value = t.effectiveDate
  amount.value = String(t.amount)
  accountId.value = t.accountId
  destinationAccountId.value = t.type === 'TRANSFER' && t.transferIn === false ? t.transferAccountId : null
  paymentMethod.value = t.paymentMethod ?? ''
  payee.value = t.payee ?? ''
  categoryId.value = t.categoryId ?? null
  status.value = t.status
  memo.value = t.memo ?? ''
  tags.value = t.tags ?? ''
  exchangeRate.value = t.exchangeRate !== null ? String(t.exchangeRate) : ''
}

let suppressAutoRate = false

const localTransactionId = ref<number | null>(props.transaction?.id ?? null)

const loadData = async () => {
  isLoading.value = true
  try {
    const [accountsRes, categoriesRes] = await Promise.all([
      accountsApi.list(),
      api.get<BackendCategory[]>('/users/me/categories'),
    ])
    accounts.value = accountsRes.data
    allCategories.value = categoriesRes.data

    suppressAutoRate = true
    if (props.mode === 'edit' && props.transaction) {
      populateFromTransaction(props.transaction)
      localTransactionId.value = props.transaction.id
      serverSplitCount.value = props.transaction.splitCount
      if (props.transaction.splitCount > 0) {
        try {
          const res = await transactionsApi.getSplits(props.transaction.id)
          populateSplits(res.data)
          splitsEnabled.value = true
        } catch {
          error.value = t('transactionSplits.loadError')
        }
      }
    } else {
      resetForm()
      accountId.value = accounts.value[0]?.id ?? null
      localTransactionId.value = null
    }
    await nextTick()
    suppressAutoRate = false
  } catch {
    error.value = t('transactionModal.loadError')
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => { if (open) loadData() }
)

watch(selectedType, (type) => {
  categoryId.value = null
  if (type === 'TRANSFER') {
    splitsEnabled.value = false
    splits.value = []
  } else {
    // Split categories belong to the previous type; keep the rows but force
    // re-picking. Skipped during loadData so loaded splits survive populate.
    if (!isLoading.value) {
      for (const row of splits.value) row.categoryId = null
    }
    destinationAccountId.value = null
  }
})

watch([accountId, destinationAccountId, selectedType], async () => {
  if (suppressAutoRate) return
  if (!needsExchangeRate.value) {
    exchangeRate.value = ''
    return
  }
  try {
    const res = await currenciesApi.suggestRate(sourceCurrencyId.value!, destinationCurrencyId.value!)
    exchangeRate.value = res.data.rate !== null ? String(res.data.rate) : ''
  } catch {
    exchangeRate.value = ''
  }
})

const handleClose = () => {
  error.value = ''
  emit('close')
}

const addSplitRow = () => {
  splits.value.push(newSplitRow())
}

const removeSplitRow = (uid: number) => {
  splits.value = splits.value.filter((s) => s.uid !== uid)
}

const buildSplitsPayload = (): SplitInput[] =>
  splits.value.map((s) => ({
    categoryId: s.categoryId!,
    amount: parseFloat(s.amount),
    memo: s.memo || undefined,
  }))

const handleSave = async (keepOpen = false) => {
  if (isSaveDisabled.value) return
  isSaving.value = true
  error.value = ''

  const isTransfer = selectedType.value === 'TRANSFER'
  const wantSplits = splitsEnabled.value && !isTransfer
  const payload: CreateTransactionPayload = {
    accountId: accountId.value!,
    categoryId: isTransfer || wantSplits
      ? undefined
      : (categoryId.value ?? undefined),
    destinationAccountId: isTransfer ? destinationAccountId.value! : undefined,
    type: selectedType.value,
    amount: parseFloat(amount.value),
    exchangeRate: isTransfer && needsExchangeRate.value ? parseFloat(exchangeRate.value) : undefined,
    effectiveDate: effectiveDate.value,
    payee: payee.value || undefined,
    paymentMethod: paymentMethod.value || undefined,
    memo: memo.value || undefined,
    status: status.value,
    tags: tags.value || undefined,
  }

  try {
    let saved: TransactionDetail
    const targetId =
      props.mode === 'edit' && props.transaction
        ? props.transaction.id
        : localTransactionId.value
    if (targetId !== null) {
      // The backend rejects PATCHes touching amount/category/type while splits
      // exist, and the payload always carries them — clear splits first.
      if (serverSplitCount.value > 0) {
        await transactionsApi.setSplits(targetId, [])
        serverSplitCount.value = 0
      }
      const res = await transactionsApi.update(targetId, payload)
      saved = res.data
    } else {
      const res = await transactionsApi.create(payload)
      saved = res.data
    }

    if (wantSplits) {
      const splitsRes = await transactionsApi.setSplits(saved.id, buildSplitsPayload())
      saved = splitsRes.data
    }
    serverSplitCount.value = saved.splitCount

    emit('saved', saved)
    localTransactionId.value = saved.id
    if (props.mode === 'edit') {
      if (!keepOpen) handleClose()
    } else if (keepOpen) {
      resetForm()
      accountId.value = accounts.value[0]?.id ?? null
      localTransactionId.value = null
    }
  } catch {
    error.value = t('transactionModal.saveError')
  } finally {
    isSaving.value = false
  }
}

</script>

<template>
  <AppModal
    :is-open="isOpen"
    :title="mode === 'create' ? t('transactionModal.titleCreate') : t('transactionModal.titleEdit')"
    icon="receipt_long"
    size="md"
    @close="handleClose"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20 text-primary">
      <AppSpinner size="lg" />
    </div>

    <form v-else id="transaction-form" class="space-y-6 p-6 lg:p-8" @submit.prevent="handleSave(false)">
      <div v-if="error" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
        {{ error }}
      </div>

      <!-- Type selector -->
      <div class="flex gap-1 rounded-lg border border-line bg-surface-2 p-1">
        <button
          v-for="txType in (['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[])"
          :key="txType"
          type="button"
          class="flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all"
          :class="selectedType === txType ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-content'"
          @click="selectedType = txType"
        >
          {{ txType === 'EXPENSE' ? t('transactions.types.expense') : txType === 'INCOME' ? t('transactions.types.income') : t('transactions.types.transfer') }}
        </button>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <!-- Date -->
        <div>
          <label class="field-label">{{ t('transactionModal.dateLabel') }}</label>
          <div class="relative">
            <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">calendar_today</span>
            <input v-model="effectiveDate" type="date" class="field-input pl-11" :disabled="isSaving" />
          </div>
        </div>

        <!-- Amount -->
        <div>
          <label class="field-label">{{ t('transactionModal.amountLabel') }}</label>
          <div class="relative">
            <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">attach_money</span>
            <input
              v-model="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              class="field-input pl-11 text-base font-bold"
              :disabled="isSaving || splitsEnabled"
            />
          </div>
        </div>

        <!-- Account -->
        <div>
          <label class="field-label">{{ selectedType === 'TRANSFER' ? t('transactionModal.fromAccountLabel') : t('transactionModal.sourceAccountLabel') }}</label>
          <select v-model="accountId" class="field-input" :disabled="isSaving">
            <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
          </select>
        </div>

        <!-- To Account (transfer only) -->
        <div v-if="selectedType === 'TRANSFER'">
          <label class="field-label">{{ t('transactionModal.toAccountLabel') }}</label>
          <select v-model="destinationAccountId" class="field-input" :disabled="isSaving">
            <option :value="null" disabled>{{ t('transactionModal.selectDestination') }}</option>
            <option v-for="acc in destinationAccounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
          </select>
        </div>

        <!-- Exchange Rate (cross-currency transfer only) -->
        <div v-if="needsExchangeRate">
          <label class="field-label">Exchange Rate</label>
          <input v-model="exchangeRate" type="number" step="0.000001" min="0.000001" placeholder="0.00" class="field-input" :disabled="isSaving" />
          <p class="mt-1 text-xs text-faint">1 {{ sourceCurrencyCode }} = ___ {{ destinationCurrencyCode }}</p>
        </div>

        <!-- Payment Method -->
        <div>
          <label class="field-label">{{ t('transactionModal.paymentMethodLabel') }}</label>
          <select v-model="paymentMethod" class="field-input" :disabled="isSaving">
            <option value="">{{ t('transactionModal.paymentMethods.none') }}</option>
            <option value="Credit Card">{{ t('transactionModal.paymentMethods.creditCard') }}</option>
            <option value="Bank Transfer">{{ t('transactionModal.paymentMethods.bankTransfer') }}</option>
            <option value="Cash">{{ t('transactionModal.paymentMethods.cash') }}</option>
            <option value="Check">{{ t('transactionModal.paymentMethods.check') }}</option>
          </select>
        </div>

        <!-- Payee -->
        <div>
          <label class="field-label">{{ t('transactionModal.payeeLabel') }}</label>
          <input v-model="payee" type="text" :placeholder="t('transactionModal.payeePlaceholder')" class="field-input" :disabled="isSaving" />
        </div>

        <!-- Category -->
        <div v-if="selectedType !== 'TRANSFER'">
          <label class="field-label">{{ t('transactionModal.categoryLabel') }}</label>
          <select v-model="categoryId" class="field-input" :disabled="isSaving || splitsEnabled">
            <option :value="null">{{ t('transactionModal.noneOption') }}</option>
            <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
          </select>
        </div>
      </div>

      <!-- Status -->
      <div>
        <label class="field-label">{{ t('transactionModal.statusLabel') }}</label>
        <div class="flex w-fit gap-1 rounded-lg border border-line bg-surface-2 p-1">
          <button
            v-for="s in (['PENDING', 'CLEARED', 'VOID'] as TransactionStatus[])"
            :key="s"
            type="button"
            class="flex size-11 items-center justify-center rounded-md transition-all"
            :class="status === s ? 'bg-surface text-primary shadow-sm' : 'text-faint hover:text-content'"
            :title="s"
            :disabled="isSaving"
            @click="status = s"
          >
            <span class="material-symbols-outlined" :class="status === s ? 'is-filled' : ''">
              {{ s === 'PENDING' ? 'pending' : s === 'CLEARED' ? 'check_circle' : 'block' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Memo & Tags -->
      <div>
        <label class="field-label">{{ t('transactionModal.memoLabel') }}</label>
        <textarea v-model="memo" :placeholder="t('transactionModal.memoPlaceholder')" rows="2" class="field-input resize-none" :disabled="isSaving"></textarea>
      </div>
      <div>
        <label class="field-label">{{ t('transactionModal.tagsLabel') }}</label>
        <input v-model="tags" type="text" :placeholder="t('transactionModal.tagsPlaceholder')" class="field-input" :disabled="isSaving" />
      </div>

      <!-- Splits (not for transfers) -->
      <div v-if="selectedType !== 'TRANSFER'" class="rounded-xl border border-line bg-surface-2/40 p-4">
        <label class="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            :checked="splitsEnabled"
            :disabled="isSaving"
            class="size-4 accent-primary"
            @change="(e) => {
              const enabled = (e.target as HTMLInputElement).checked
              splitsEnabled = enabled
              if (enabled && splits.length === 0) {
                splits.push(newSplitRow())
                splits.push(newSplitRow())
              } else if (!enabled) {
                splits = []
              }
            }"
          />
          <span class="material-symbols-outlined text-base text-faint">call_split</span>
          <span class="text-sm font-semibold text-content">{{ t('transactionSplits.toggle') }}</span>
        </label>
        <p class="mt-1 pl-7 text-xs text-faint">{{ t('transactionSplits.intro') }}</p>

        <div v-if="splitsEnabled" class="mt-4 space-y-3">
          <div
            v-for="row in splits"
            :key="row.uid"
            class="grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_1fr_auto]"
          >
            <select v-model="row.categoryId" class="field-input" :disabled="isSaving">
              <option :value="null" disabled>{{ t('transactionSplits.splitCategoryLabel') }}</option>
              <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
            </select>
            <input
              v-model="row.amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              class="field-input"
              :disabled="isSaving"
            />
            <input
              v-model="row.memo"
              type="text"
              :placeholder="t('transactionSplits.splitMemoLabel')"
              class="field-input"
              :disabled="isSaving"
            />
            <AppIconButton
              icon="close"
              :aria-label="t('transactionSplits.removeRow')"
              :disabled="isSaving || splits.length <= 2"
              @click="removeSplitRow(row.uid)"
            />
          </div>

          <div class="flex items-center justify-between gap-3">
            <AppButton variant="ghost" size="sm" icon="add" :disabled="isSaving" @click="addSplitRow">
              {{ t('transactionSplits.addRow') }}
            </AppButton>
            <span
              class="text-xs font-semibold"
              :class="{
                'text-success': splitsStatus.tone === 'success',
                'text-warning': splitsStatus.tone === 'warning',
                'text-danger': splitsStatus.tone === 'danger',
              }"
            >
              {{ splitsStatus.message }}
            </span>
          </div>
        </div>
      </div>
    </form>

    <TransactionAttachmentsPanel
      v-if="localTransactionId !== null"
      :key="localTransactionId"
      :transaction-id="localTransactionId"
    />

    <template #footer>
      <AppButton variant="ghost" :disabled="isSaving" @click="handleClose">{{ t('common.close') }}</AppButton>
      <AppButton
        v-if="mode === 'create' && localTransactionId === null"
        variant="secondary"
        :disabled="isSaveDisabled"
        @click="handleSave(true)"
      >
        {{ t('transactionModal.addAndKeep') }}
      </AppButton>
      <AppButton
        type="submit"
        form="transaction-form"
        :loading="isSaving"
        :disabled="isSaveDisabled"
      >
        {{ (mode === 'edit' || localTransactionId !== null) ? t('accounts.saveButton.update') : t('transactions.actions.add') }}
      </AppButton>
    </template>
  </AppModal>
</template>
