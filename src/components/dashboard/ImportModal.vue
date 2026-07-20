<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppModal } from '../ui'
import { logError } from '../../utils/logError'
import { type ColumnMapping, type ImportRow, transactionsApi } from '../../services/transactions'

const { t } = useI18n()

const props = defineProps<{ isOpen: boolean }>()

const emit = defineEmits<{
  close: []
  imported: []
}>()

type WizardStep = 'upload' | 'preview' | 'done'

const MAPPING_FIELDS: { key: keyof ColumnMapping; required: boolean }[] = [
  { key: 'date', required: true },
  { key: 'account', required: true },
  { key: 'type', required: true },
  { key: 'amount', required: true },
  { key: 'category', required: false },
  { key: 'payee', required: false },
  { key: 'paymentMethod', required: false },
  { key: 'status', required: false },
  { key: 'tags', required: false },
  { key: 'memo', required: false },
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
  } catch (err: unknown) {
    logError('importModal.onFileChange', err)
    error.value = t('importModal.readError')
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
  } catch (err: unknown) {
    logError('importModal.runPreview', err)
    error.value = t('importModal.previewError')
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
  } catch (err: unknown) {
    logError('importModal.confirmImport', err)
    error.value = t('importModal.importError')
  } finally {
    isCommitting.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <AppModal :is-open="isOpen" :title="t('importModal.title')" icon="upload_file" size="lg" @close="handleClose">
    <div class="space-y-6 p-6 lg:p-8">
      <div v-if="error" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
        {{ error }}
      </div>

      <!-- Step 1: Upload + column mapping -->
      <template v-if="step === 'upload'">
        <div>
          <label class="field-label">{{ t('importModal.csvFileLabel') }}</label>
          <input
            type="file"
            accept=".csv,text/csv"
            class="field-input"
            @change="onFileChange"
          />
        </div>

        <div v-if="csvHeaders.length > 0">
          <p class="mb-3 text-sm font-semibold text-content">{{ t('importModal.mapColumns') }}</p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="field in MAPPING_FIELDS" :key="field.key">
              <label class="field-label">{{ t(`importModal.fields.${field.key}`) }}<span v-if="field.required" class="text-danger"> *</span></label>
              <select v-model="mapping[field.key]" class="field-input">
                <option :value="undefined">{{ t('importModal.notMapped') }}</option>
                <option v-for="header in csvHeaders" :key="header" :value="header">{{ header }}</option>
              </select>
            </div>
          </div>
        </div>
      </template>

      <!-- Step 2: Preview -->
      <template v-else-if="step === 'preview'">
        <p class="text-sm text-muted">
          {{ t('importModal.previewSummary', { valid: validRows.length, total: previewRows.length }, previewRows.length) }}
        </p>
        <div class="max-h-96 overflow-auto rounded-xl border border-line">
          <table class="w-full min-w-[720px] text-sm">
            <thead>
              <tr class="border-b border-line bg-surface-2/50">
                <th class="data-th">{{ t('importModal.table.line') }}</th>
                <th class="data-th">{{ t('importModal.table.date') }}</th>
                <th class="data-th">{{ t('importModal.table.account') }}</th>
                <th class="data-th">{{ t('importModal.table.category') }}</th>
                <th class="data-th">{{ t('importModal.table.type') }}</th>
                <th class="data-th text-right">{{ t('importModal.table.amount') }}</th>
                <th class="data-th">{{ t('importModal.table.payee') }}</th>
                <th class="data-th">{{ t('importModal.table.statusErrors') }}</th>
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
                  <span v-if="row.valid" class="text-success">{{ t('importModal.rowValid') }}</span>
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
          <p class="font-semibold text-content">{{ t('importModal.doneSummary', createdCount) }}</p>
        </div>
      </template>
    </div>

    <template #footer>
      <template v-if="step === 'upload'">
        <AppButton variant="ghost" @click="handleClose">{{ t('common.cancel') }}</AppButton>
        <AppButton
          :loading="isLoading"
          :disabled="!selectedFile || !requiredFieldsMapped"
          @click="runPreview"
        >
          {{ t('importModal.preview') }}
        </AppButton>
      </template>
      <template v-else-if="step === 'preview'">
        <AppButton variant="ghost" :disabled="isCommitting" @click="step = 'upload'">{{ t('importModal.back') }}</AppButton>
        <AppButton
          :loading="isCommitting"
          :disabled="validRows.length === 0"
          @click="confirmImport"
        >
          {{ t('importModal.importButton', validRows.length) }}
        </AppButton>
      </template>
      <template v-else>
        <AppButton @click="handleClose">{{ t('common.close') }}</AppButton>
      </template>
    </template>
  </AppModal>
</template>
