<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AppButton, AppModal } from '../ui'
import { type ColumnMapping, type ImportRow, transactionsApi } from '../../services/transactions'

const props = defineProps<{ isOpen: boolean }>()

const emit = defineEmits<{
  close: []
  imported: []
}>()

type WizardStep = 'upload' | 'preview' | 'done'

const MAPPING_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: 'date', label: 'Date', required: true },
  { key: 'account', label: 'Account', required: true },
  { key: 'type', label: 'Type', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'category', label: 'Category', required: false },
  { key: 'payee', label: 'Payee', required: false },
  { key: 'paymentMethod', label: 'Payment Method', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'tags', label: 'Tags', required: false },
  { key: 'memo', label: 'Memo', required: false },
]

const step = ref<WizardStep>('upload')
const selectedFile = ref<File | null>(null)
const csvHeaders = ref<string[]>([])
const mapping = ref<ColumnMapping>({})
const previewRows = ref<ImportRow[]>([])
const isLoading = ref(false)
const isCommitting = ref(false)
const error = ref('')
const createdCount = ref(0)

const validRows = computed(() => previewRows.value.filter((r) => r.valid))
const requiredFieldsMapped = computed(() =>
  MAPPING_FIELDS.every((f) => !f.required || Boolean(mapping.value[f.key])),
)

const reset = () => {
  step.value = 'upload'
  selectedFile.value = null
  csvHeaders.value = []
  mapping.value = {}
  previewRows.value = []
  error.value = ''
  createdCount.value = 0
}

watch(
  () => props.isOpen,
  (open) => { if (open) reset() },
)

const readHeaders = (file: File): Promise<string[]> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
      resolve(firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, '')))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })

const autodetectMapping = (headers: string[]): ColumnMapping => {
  const lower = headers.map((h) => h.toLowerCase())
  const find = (name: string) => {
    const idx = lower.indexOf(name.toLowerCase())
    return idx >= 0 ? headers[idx] : undefined
  }
  const result: ColumnMapping = {}
  for (const field of MAPPING_FIELDS) {
    const match = find(field.key)
    if (match) result[field.key] = match
  }
  return result
}

const onFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  error.value = ''
  selectedFile.value = file
  try {
    csvHeaders.value = await readHeaders(file)
    mapping.value = autodetectMapping(csvHeaders.value)
  } catch {
    error.value = 'Could not read the selected file.'
  }
}

const runPreview = async () => {
  if (!selectedFile.value || !requiredFieldsMapped.value) return
  isLoading.value = true
  error.value = ''
  try {
    const res = await transactionsApi.importPreview(selectedFile.value, mapping.value)
    previewRows.value = res.data.rows
    step.value = 'preview'
  } catch {
    error.value = 'Could not preview this file. Check the column mapping and try again.'
  } finally {
    isLoading.value = false
  }
}

const confirmImport = async () => {
  if (validRows.value.length === 0) return
  isCommitting.value = true
  error.value = ''
  try {
    const res = await transactionsApi.importCommit(validRows.value)
    createdCount.value = res.data.created
    step.value = 'done'
    emit('imported')
  } catch {
    error.value = 'Could not import the transactions. Please try again.'
  } finally {
    isCommitting.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <AppModal :is-open="isOpen" title="Import Transactions" icon="upload_file" size="lg" @close="handleClose">
    <div class="space-y-6 p-6 lg:p-8">
      <div v-if="error" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
        {{ error }}
      </div>

      <!-- Step 1: Upload + column mapping -->
      <template v-if="step === 'upload'">
        <div>
          <label class="field-label">CSV file</label>
          <input
            type="file"
            accept=".csv,text/csv"
            class="field-input"
            @change="onFileChange"
          />
        </div>

        <div v-if="csvHeaders.length > 0">
          <p class="mb-3 text-sm font-semibold text-content">Map columns</p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="field in MAPPING_FIELDS" :key="field.key">
              <label class="field-label">{{ field.label }}<span v-if="field.required" class="text-danger"> *</span></label>
              <select v-model="mapping[field.key]" class="field-input">
                <option :value="undefined">(not mapped)</option>
                <option v-for="header in csvHeaders" :key="header" :value="header">{{ header }}</option>
              </select>
            </div>
          </div>
        </div>
      </template>

      <!-- Step 2: Preview -->
      <template v-else-if="step === 'preview'">
        <p class="text-sm text-muted">
          {{ validRows.length }} of {{ previewRows.length }} row{{ previewRows.length === 1 ? '' : 's' }} are valid and will be imported.
        </p>
        <div class="max-h-96 overflow-auto rounded-xl border border-line">
          <table class="w-full min-w-[720px] text-sm">
            <thead>
              <tr class="border-b border-line bg-surface-2/50">
                <th class="data-th">Line</th>
                <th class="data-th">Date</th>
                <th class="data-th">Account</th>
                <th class="data-th">Category</th>
                <th class="data-th">Type</th>
                <th class="data-th text-right">Amount</th>
                <th class="data-th">Payee</th>
                <th class="data-th">Status / Errors</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="row in previewRows" :key="row.line" :class="row.valid ? '' : 'bg-danger/5'">
                <td class="px-3 py-2 text-faint">{{ row.line }}</td>
                <td class="px-3 py-2">{{ row.effectiveDate ?? '—' }}</td>
                <td class="px-3 py-2">{{ row.accountName ?? '—' }}</td>
                <td class="px-3 py-2">{{ row.categoryName ?? '—' }}</td>
                <td class="px-3 py-2">{{ row.type ?? '—' }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ row.amount ?? '—' }}</td>
                <td class="px-3 py-2">{{ row.payee ?? '—' }}</td>
                <td class="px-3 py-2">
                  <span v-if="row.valid" class="text-success">Valid</span>
                  <span v-else class="text-danger">{{ row.errors.join('; ') }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Step 3: Done -->
      <template v-else-if="step === 'done'">
        <div class="flex flex-col items-center justify-center py-10 text-center">
          <span class="material-symbols-outlined mb-4 text-5xl text-success">check_circle</span>
          <p class="font-semibold text-content">{{ createdCount }} transaction{{ createdCount === 1 ? '' : 's' }} imported</p>
        </div>
      </template>
    </div>

    <template #footer>
      <template v-if="step === 'upload'">
        <AppButton variant="ghost" @click="handleClose">Cancel</AppButton>
        <AppButton
          :loading="isLoading"
          :disabled="!selectedFile || !requiredFieldsMapped"
          @click="runPreview"
        >
          Preview
        </AppButton>
      </template>
      <template v-else-if="step === 'preview'">
        <AppButton variant="ghost" :disabled="isCommitting" @click="step = 'upload'">Back</AppButton>
        <AppButton
          :loading="isCommitting"
          :disabled="validRows.length === 0"
          @click="confirmImport"
        >
          Import {{ validRows.length }} row{{ validRows.length === 1 ? '' : 's' }}
        </AppButton>
      </template>
      <template v-else>
        <AppButton @click="handleClose">Close</AppButton>
      </template>
    </template>
  </AppModal>
</template>
