<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import api from '../../services/api'

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
    error.value = 'Failed to load currencies'
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
    // Reset state when modal closes
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
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[921px] flex flex-col">
      <div class="px-8 pt-8 pb-4">
        <h2 class="text-2xl font-black tracking-tighter text-slate-900 mb-6 uppercase">Select Currency</h2>
        <div class="relative flex items-center">
          <span class="material-symbols-outlined absolute left-4 text-slate-400">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="SEARCH CURRENCY..."
            class="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl text-sm font-bold tracking-widest placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-2 mx-6 my-2">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex flex-col items-center justify-center py-12 text-center">
          <span class="material-symbols-outlined text-red-400 text-4xl mb-2">error</span>
          <p class="text-red-500 font-medium">{{ error }}</p>
          <button @click="fetchCurrencies" class="mt-4 px-4 py-2 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary/90">
            Retry
          </button>
        </div>

        <!-- Currency List -->
        <div v-else class="space-y-1">
          <div
            v-for="currency in filteredCurrencies"
            :key="currency.code"
            class="flex items-center justify-between p-4 rounded-xl cursor-pointer group transition-all"
            :class="isSelected(currency.code)
              ? 'bg-emerald-50 border border-emerald-200'
              : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'"
            @click="toggleCurrency(currency.code)"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                :class="isSelected(currency.code) ? 'bg-emerald-100' : 'bg-slate-100 group-hover:bg-emerald-50'"
              >
                <span
                  class="material-symbols-outlined transition-colors"
                  :class="isSelected(currency.code) ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'"
                >payments</span>
              </div>
              <div>
                <p class="font-bold text-slate-900 leading-tight">{{ currency.name }}</p>
                <p class="text-xs font-bold text-slate-500 tracking-wider uppercase">{{ currency.code }} ({{ currency.symbol }})</p>
              </div>
            </div>
            <div
              v-if="isSelected(currency.code)"
              class="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <span class="material-symbols-outlined text-black text-sm font-bold">check</span>
            </div>
            <span
              v-else
              class="material-symbols-outlined text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >radio_button_unchecked</span>
          </div>
        </div>
      </div>

      <div class="p-8 border-t border-slate-200 bg-slate-50 flex justify-end gap-4">
        <button
          type="button"
          class="px-6 py-3 rounded-xl text-sm font-bold tracking-widest text-slate-600 hover:bg-slate-200 transition-colors"
          @click="emit('close')"
        >
          CANCEL
        </button>
        <button
          type="button"
          class="px-8 py-3 bg-primary rounded-xl text-sm font-bold tracking-widest text-black shadow-lg shadow-primary/30 hover:brightness-105 transition-all"
          @click="handleOk"
        >
          OK
        </button>
      </div>
    </div>
  </div>
</template>
