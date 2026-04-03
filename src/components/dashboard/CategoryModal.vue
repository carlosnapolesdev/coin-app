<script setup lang="ts">
import { ref } from 'vue'

type FlowType = 'expense' | 'income'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const selectedFlow = ref<FlowType>('expense')
const selectedIcon = ref('label')

const iconOptions = [
  'label',
  'shopping_cart',
  'restaurant',
  'fitness_center',
  'flight',
  'payments',
]

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div class="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div class="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
        <div>
          <h3 class="text-xl font-bold text-slate-900">New category</h3>
          <p class="mt-1 text-sm text-slate-500">Keep your transactions grouped inside the same flow.</p>
        </div>

        <button
          type="button"
          class="flex size-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:text-slate-900"
          @click="handleClose"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="space-y-6 px-6 py-6">
        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <label class="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Name</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">label</span>
              <input
                type="text"
                placeholder="Ex. Entertainment"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Flow type</label>
            <select
              v-model="selectedFlow"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>

        <div class="space-y-3">
          <label class="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Icon</label>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="icon in iconOptions"
              :key="icon"
              type="button"
              class="flex size-12 items-center justify-center rounded-2xl border transition"
              :class="selectedIcon === icon ? 'border-primary bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white'"
              @click="selectedIcon = icon"
            >
              <span class="material-symbols-outlined">{{ icon }}</span>
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-slate-600">
          Top-level categories make reporting clearer. Use subcategories when you need more operational detail inside the same group.
        </div>
      </div>

      <div class="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-primary/20 transition hover:bg-primary/90"
          @click="handleClose"
        >
          Save category
        </button>
      </div>
    </div>
  </div>
</template>
