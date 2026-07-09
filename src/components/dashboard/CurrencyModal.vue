<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../services/api'
import { AppButton, AppModal, AppSpinner } from '../ui'

const { t } = useI18n()

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  select: [currencies: string[]]
}>()

interface Currency {
  id: number
  code: string
  name: string
  symbol: string
}

const searchQuery = ref('')
const selectedCurrencies = ref<string[]>([])
const currencies = ref<Currency[]>([])
const isLoading = ref(false)
const error = ref('')

const fetchCurrencies = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const response = await api.get<Currency[]>('/currencies')
    currencies.value = response.data
  } catch (e) {
    error.value = t('currencyModal.loadError')
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen && currencies.value.length === 0) {
    fetchCurrencies()
  }
  if (!isOpen) {
    searchQuery.value = ''
  }
}, { immediate: true })

const filteredCurrencies = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return currencies.value.filter(c =>
    c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
  )
})

const toggleCurrency = (code: string) => {
  const index = selectedCurrencies.value.indexOf(code)
  if (index === -1) {
    selectedCurrencies.value.push(code)
  } else {
    selectedCurrencies.value.splice(index, 1)
  }
}

const isSelected = (code: string) => selectedCurrencies.value.includes(code)

const handleOk = () => {
  emit('select', [...selectedCurrencies.value])
  emit('close')
}
</script>

<template>
  <AppModal :is-open="isOpen" :title="t('currencyModal.title')" icon="payments" size="sm" @close="emit('close')">
    <div class="space-y-4 p-6">
      <!-- Search -->
      <div class="relative">
        <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">search</span>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('currencyModal.searchPlaceholder')"
          class="field-input pl-11"
        />
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-12 text-primary">
        <AppSpinner size="md" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-12 text-center">
        <span class="material-symbols-outlined mb-2 text-4xl text-danger">error</span>
        <p class="font-medium text-danger">{{ error }}</p>
        <AppButton class="mt-4" variant="secondary" size="sm" @click="fetchCurrencies">{{ t('common.retry') }}</AppButton>
      </div>

      <!-- Currency List -->
      <div v-else class="max-h-[50vh] space-y-1 overflow-y-auto">
        <div
          v-for="currency in filteredCurrencies"
          :key="currency.code"
          class="group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all"
          :class="isSelected(currency.code)
            ? 'border-primary/30 bg-primary/10'
            : 'border-transparent hover:border-line hover:bg-surface-2'"
          @click="toggleCurrency(currency.code)"
        >
          <div class="flex items-center gap-3">
            <div
              class="icon-tile size-10 transition-colors"
              :class="isSelected(currency.code) ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-faint'"
            >
              <span class="material-symbols-outlined">payments</span>
            </div>
            <div>
              <p class="font-semibold leading-tight text-content">{{ currency.name }}</p>
              <p class="text-xs font-medium text-muted">{{ currency.code }} ({{ currency.symbol }})</p>
            </div>
          </div>
          <div v-if="isSelected(currency.code)" class="flex size-6 items-center justify-center rounded-full bg-primary text-primary-fg">
            <span class="material-symbols-outlined" style="font-size: 16px">check</span>
          </div>
          <span v-else class="material-symbols-outlined text-faint opacity-0 transition-opacity group-hover:opacity-100">radio_button_unchecked</span>
        </div>
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ t('common.cancel') }}</AppButton>
      <AppButton @click="handleOk">{{ t('currencyModal.done') }}</AppButton>
    </template>
  </AppModal>
</template>
