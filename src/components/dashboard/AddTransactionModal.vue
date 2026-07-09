<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../services/api'
import { type CreateTransactionPayload, type TransactionDetail, type TransactionStatus, type TransactionType, transactionsApi } from '../../services/transactions'
import { type AccountDetail, accountsApi } from '../../services/accounts'
import { currenciesApi } from '../../services/currencies'
import { attachmentsApi } from '../../services/attachments'
import { useAttachments } from '../../composables/useAttachments'
import AttachmentLightbox from '../common/AttachmentLightbox.vue'
import { lightboxIndexFor } from '../common/lightboxIndex'
import { AppButton, AppModal, AppSpinner, ConfirmDialog } from '../ui'

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

const isSaveDisabled = computed(() => {
  if (isSaving.value || !amount.value || !accountId.value || !effectiveDate.value) return true
  if (selectedType.value === 'TRANSFER' && !destinationAccountId.value) return true
  if (needsExchangeRate.value && !exchangeRate.value) return true
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
  error.value = ''
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

const attach = useAttachments()
const localTransactionId = ref<number | null>(props.transaction?.id ?? null)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const filePicker = ref<HTMLInputElement | null>(null)
const confirmDialogOpen = ref(false)
const attachmentToRemove = ref<number | null>(null)
const isDragOver = ref(false)
const pendingFiles = new Map<string, File>()

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
      await attach.load(props.transaction.id)
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
  if (type !== 'TRANSFER') destinationAccountId.value = null
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

const handleSave = async (keepOpen = false) => {
  if (isSaveDisabled.value) return
  isSaving.value = true
  error.value = ''

  const isTransfer = selectedType.value === 'TRANSFER'
  const payload: CreateTransactionPayload = {
    accountId: accountId.value!,
    categoryId: isTransfer ? undefined : (categoryId.value ?? undefined),
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
    if (props.mode === 'edit' && props.transaction) {
      const res = await transactionsApi.update(props.transaction.id, payload)
      saved = res.data
    } else if (localTransactionId.value !== null) {
      const res = await transactionsApi.update(localTransactionId.value, payload)
      saved = res.data
    } else {
      const res = await transactionsApi.create(payload)
      saved = res.data
    }
    emit('saved', saved)
    localTransactionId.value = saved.id
    if (props.mode === 'create' && localTransactionId.value !== null) {
      await attach.load(saved.id)
    }
    if (props.mode === 'edit') {
      if (!keepOpen) handleClose()
    } else if (keepOpen) {
      resetForm()
      accountId.value = accounts.value[0]?.id ?? null
      localTransactionId.value = null
      pendingFiles.clear()
    }
  } catch {
    error.value = t('transactionModal.saveError')
  } finally {
    isSaving.value = false
  }
}

function openFilePicker() {
  filePicker.value?.click()
}
function onFilePickerChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) handleFiles(Array.from(files))
  ;(e.target as HTMLInputElement).value = ''
}
function onDrop(e: DragEvent) {
  isDragOver.value = false
  if (!e.dataTransfer?.files) return
  handleFiles(Array.from(e.dataTransfer.files))
}
async function handleFiles(files: File[]) {
  if (localTransactionId.value === null) return
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
  const maxBytes = 5 * 1024 * 1024
  for (const f of files) {
    if (!allowed.includes(f.type)) {
      const next = new Map(attach.errorByFile.value)
      next.set(f.name, t('transactionAttachments.mimeError'))
      attach.errorByFile.value = next
    } else if (f.size > maxBytes) {
      const next = new Map(attach.errorByFile.value)
      next.set(f.name, t('transactionAttachments.sizeError'))
      attach.errorByFile.value = next
    }
  }
  const filtered = files.filter((f) => allowed.includes(f.type) && f.size <= maxBytes)
  if (!filtered.length) return
  filtered.forEach((f) => pendingFiles.set(f.name, f))
  if (localTransactionId.value !== null) {
    await attach.addFiles(localTransactionId.value, filtered)
  }
}
function retryUpload(name: string) {
  const f = pendingFiles.get(name)
  if (f && localTransactionId.value !== null) {
    void attach.retry(localTransactionId.value, f)
  }
}
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
function askRemove(id: number) {
  attachmentToRemove.value = id
  confirmDialogOpen.value = true
}
async function confirmRemove() {
  if (attachmentToRemove.value !== null) {
    await attach.remove(attachmentToRemove.value)
    attachmentToRemove.value = null
  }
  confirmDialogOpen.value = false
}
function openLightboxFor(id: number) {
  // El lightbox recibe lightboxImages (sólo imágenes, PDFs excluidos), por eso el
  // índice debe calcularse sobre esa lista filtrada — usar attach.attachments.value
  // abre la imagen siguiente cuando hay un PDF antes del adjunto clickeado.
  const i = lightboxIndexFor(lightboxImages.value, id)
  if (i >= 0) {
    lightboxIndex.value = i
    lightboxOpen.value = true
  }
}
const lightboxImages = computed(() =>
  attach.attachments.value
    .filter((a) => a.mimeType.startsWith('image/'))
    .map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      url: attachmentsApi.downloadUrl(a.id, 'inline'),
    })),
)
const attachmentCount = computed(() => attach.attachments.value.length)
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
            <input v-model="amount" type="number" step="0.01" min="0.01" placeholder="0.00" class="field-input pl-11 text-base font-bold" :disabled="isSaving" />
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
          <select v-model="categoryId" class="field-input" :disabled="isSaving">
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
    </form>

    <section v-if="localTransactionId" class="border-t border-line bg-surface-2/30 px-6 py-5 lg:px-8">
      <h3 class="text-sm font-semibold text-content">{{ t('transactionAttachments.panel') }}</h3>
      <p class="mt-1 text-xs text-muted">{{ t('transactionAttachments.dropzoneHint') }}</p>

      <div
        class="mt-3 rounded-lg border-2 border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted transition-colors"
        :class="{ 'border-accent bg-surface-hover': isDragOver }"
        role="button"
        tabindex="0"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="onDrop"
        @click="openFilePicker"
        @keydown.enter.prevent="openFilePicker"
        @keydown.space.prevent="openFilePicker"
      >
        {{ t('transactionAttachments.dropzone') }}
        <input
          ref="filePicker"
          type="file"
          multiple
          class="hidden"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          @change="onFilePickerChange"
        />
      </div>

      <p class="mt-3 text-xs text-muted">
        {{ t('transactionAttachments.ofAttachments', { count: attachmentCount, max: 5 }) }}
      </p>

      <ul v-if="attach.attachments.value.length" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        <li
          v-for="a in attach.attachments.value"
          :key="a.id"
          class="rounded-lg border border-border bg-surface p-2"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate text-xs text-content">{{ a.fileName }}</p>
              <p class="text-[11px] text-muted">{{ formatSize(a.sizeBytes) }}</p>
            </div>
            <button
              type="button"
              class="text-muted hover:text-danger"
              :aria-label="t('transactionAttachments.remove')"
              @click="askRemove(a.id)"
            >&times;</button>
          </div>

          <div
            v-if="a.mimeType.startsWith('image/')"
            class="mt-2 aspect-square w-full overflow-hidden rounded-md bg-surface-2"
          >
            <img
              :src="attachmentsApi.downloadUrl(a.id, 'inline')"
              :alt="a.fileName"
              class="h-full w-full cursor-zoom-in object-cover"
              @click="openLightboxFor(a.id)"
            />
          </div>
          <div v-else class="mt-2 flex h-full min-h-[2.5rem] items-center justify-center">
            <a
              :href="attachmentsApi.downloadUrl(a.id, 'inline')"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-md border border-border px-3 py-1 text-xs text-content hover:bg-surface-hover"
            >
              {{ t('transactionAttachments.openPdf') }}
            </a>
          </div>
        </li>
      </ul>

      <ul
        v-if="attach.progressByFile.value.size || attach.errorByFile.value.size"
        class="mt-3 space-y-1"
      >
        <li
          v-for="[name, pct] in attach.progressByFile.value"
          :key="`p-${name}`"
          class="flex items-center gap-2 text-[11px] text-muted"
        >
          <span class="truncate">{{ name }}</span>
          <span class="ml-auto">{{ t('transactionAttachments.uploading') }} {{ pct }}%</span>
        </li>
        <li
          v-for="[name, msg] in attach.errorByFile.value"
          :key="`e-${name}`"
          class="flex items-center gap-2 text-[11px] text-danger"
        >
          <span class="truncate">{{ name }} — {{ msg }}</span>
          <button type="button" class="ml-auto underline" @click="retryUpload(name)">
            {{ t('transactionAttachments.retry') }}
          </button>
        </li>
      </ul>

      <ConfirmDialog
        :is-open="confirmDialogOpen"
        :title="t('transactionAttachments.remove')"
        :message="t('transactionAttachments.removeConfirm')"
        @cancel="confirmDialogOpen = false"
        @confirm="confirmRemove"
      />
    </section>

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

    <AttachmentLightbox
      :images="lightboxImages"
      :start-index="lightboxIndex"
      :open="lightboxOpen"
      @close="lightboxOpen = false"
    />
  </AppModal>
</template>
