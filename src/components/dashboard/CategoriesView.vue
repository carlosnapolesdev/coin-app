<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from './Sidebar.vue'
import CategoryModal from './CategoryModal.vue'
import api from '../../services/api'

type FlowType = 'expense' | 'income'

type Subcategory = {
  id: number
  name: string
  type: FlowType
  icon: string
}

type Category = {
  id: number
  name: string
  type: FlowType
  icon: string
  iconClass: string
  children: Subcategory[]
}

const activeFilter = ref<FlowType>('expense')
const searchQuery = ref('')
const isModalOpen = ref(false)
const isLoading = ref(false)
const error = ref('')

interface BackendCategory {
  id: number
  name: string
  type: 'EXPENSE' | 'INCOME'
  icon: string
  parentId: number | null
  active: boolean
  custom: boolean | null
  children: BackendCategory[]
}

const categories = ref<Category[]>([])

const fetchCategories = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const response = await api.get<BackendCategory[]>('/users/me/categories')
    categories.value = mapBackendCategories(response.data)
    // Expand first category by default
    if (categories.value.length > 0) {
      expandedCategories.value = [categories.value[0].id]
    }
  } catch (e) {
    error.value = 'Failed to load categories'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const mapBackendCategories = (backendCategories: BackendCategory[]): Category[] => {
  const getIconClass = (type: 'EXPENSE' | 'INCOME'): string => {
    return type === 'EXPENSE'
      ? 'bg-rose-100 text-rose-700'
      : 'bg-emerald-100 text-emerald-700'
  }

  const mapCategory = (cat: BackendCategory): Category => ({
    id: cat.id,
    name: cat.name,
    type: cat.type.toLowerCase() as FlowType,
    icon: cat.icon,
    iconClass: getIconClass(cat.type),
    children: cat.children.map((child) => ({
      id: child.id,
      name: child.name,
      type: child.type.toLowerCase() as FlowType,
      icon: child.icon,
    })),
  })

  return backendCategories.map(mapCategory)
}

const expandedCategories = ref<number[]>([])

const filteredCategories = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return categories.value.filter((category) => {
    const matchesFilter = category.type === activeFilter.value
    const matchesQuery =
      query.length === 0 ||
      category.name.toLowerCase().includes(query) ||
      category.children.some((child) => child.name.toLowerCase().includes(query))

    return matchesFilter && matchesQuery
  })
})

const toggleExpanded = (categoryId: number) => {
  if (expandedCategories.value.includes(categoryId)) {
    expandedCategories.value = expandedCategories.value.filter((id) => id !== categoryId)
    return
  }

  expandedCategories.value = [...expandedCategories.value, categoryId]
}

const isExpanded = (categoryId: number) => expandedCategories.value.includes(categoryId)

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background-light">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <header
        class="sticky top-0 z-10 bg-background-light/90 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Manage Categories</h2>
          <p class="text-sm text-slate-500">Organize categories and subcategories without leaving the main dashboard.</p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label class="relative block min-w-0 sm:w-72">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search category or subcategory"
              class="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            @click="isModalOpen = true"
          >
            <span class="material-symbols-outlined text-xl">add_circle</span>
            <span>New category</span>
          </button>
        </div>
      </header>

      <div class="max-w-6xl mx-auto p-8 space-y-8">
        <section class="grid gap-4 md:grid-cols-3">
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Categories</p>
            <p class="mt-3 text-3xl font-bold text-slate-900">{{ filteredCategories.length }}</p>
            <p class="mt-2 text-sm text-slate-500">Visible under the current filter.</p>
          </article>

          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Subcategories</p>
            <p class="mt-3 text-3xl font-bold text-slate-900">
              {{ filteredCategories.reduce((total, category) => total + category.children.length, 0) }}
            </p>
            <p class="mt-2 text-sm text-slate-500">Available breakdown for reporting and budgeting.</p>
          </article>

          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Active flow</p>
            <p class="mt-3 text-3xl font-bold text-slate-900">
              {{ activeFilter === 'expense' ? 'Expenses' : 'Income' }}
            </p>
            <p class="mt-2 text-sm text-slate-500">Switch the view using the selector below.</p>
          </article>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="border-b border-slate-200 bg-slate-50 px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div class="inline-flex rounded-2xl bg-white p-1 border border-slate-200 shadow-sm">
              <button
                type="button"
                class="rounded-xl px-5 py-2.5 text-sm font-semibold transition"
                :class="activeFilter === 'expense' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'"
                @click="activeFilter = 'expense'"
              >
                Expenses
              </button>
              <button
                type="button"
                class="rounded-xl px-5 py-2.5 text-sm font-semibold transition"
                :class="activeFilter === 'income' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'"
                @click="activeFilter = 'income'"
              >
                Income
              </button>
            </div>

            <p class="text-sm text-slate-500">
              {{ filteredCategories.length }} result<span v-if="filteredCategories.length !== 1">s</span>
            </p>
          </div>

          <div class="px-6 py-4 border-b border-slate-100">
            <div class="grid grid-cols-12 gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <div class="col-span-7 md:col-span-8">Category / Subcategory</div>
              <div class="col-span-2 text-center">Type</div>
              <div class="col-span-3 md:col-span-2 text-right">Actions</div>
            </div>
          </div>

          <div v-if="isLoading" class="flex items-center justify-center py-16">
            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-center">
            <span class="material-symbols-outlined text-red-400 text-4xl mb-2">error</span>
            <p class="text-red-500 font-medium">{{ error }}</p>
            <button @click="fetchCategories" class="mt-4 px-4 py-2 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary/90">
              Retry
            </button>
          </div>

          <div v-else-if="filteredCategories.length" class="divide-y divide-slate-100">
            <div v-for="category in filteredCategories" :key="category.id" class="group">
              <div class="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                <div class="col-span-7 md:col-span-8 flex items-center gap-4 min-w-0">
                  <button
                    type="button"
                    class="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                    :class="category.children.length === 0 ? 'invisible' : ''"
                    @click="toggleExpanded(category.id)"
                  >
                    <span class="material-symbols-outlined text-xl">
                      {{ isExpanded(category.id) ? 'expand_more' : 'chevron_right' }}
                    </span>
                  </button>

                  <div :class="['flex size-11 items-center justify-center rounded-2xl', category.iconClass]">
                    <span class="material-symbols-outlined">{{ category.icon }}</span>
                  </div>

                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-900">{{ category.name }}</p>
                    <p class="text-xs text-slate-500">{{ category.children.length }} subcategories</p>
                  </div>
                </div>

                <div class="col-span-2 flex justify-center">
                  <span
                    class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                    :class="category.type === 'expense' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
                  >
                    {{ category.type === 'expense' ? 'Expense' : 'Income' }}
                  </span>
                </div>

                <div class="col-span-3 md:col-span-2 flex justify-end gap-1 text-slate-400">
                  <button type="button" class="rounded-lg p-2 transition hover:bg-slate-100 hover:text-primary">
                    <span class="material-symbols-outlined text-[20px]">add_box</span>
                  </button>
                  <button type="button" class="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-900">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button type="button" class="rounded-lg p-2 transition hover:bg-slate-100 hover:text-rose-600">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>

              <div v-if="category.children.length > 0 && isExpanded(category.id)" class="bg-slate-50/80">
                <div
                  v-for="child in category.children"
                  :key="child.id"
                  class="grid grid-cols-12 gap-4 items-center px-6 py-3 hover:bg-white transition-colors"
                >
                  <div class="col-span-7 md:col-span-8 flex items-center gap-4 pl-14">
                    <span class="size-2 rounded-full bg-slate-300"></span>
                    <span class="text-sm text-slate-600">{{ child.name }}</span>
                  </div>

                  <div class="col-span-2"></div>

                  <div class="col-span-3 md:col-span-2 flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-slate-400">
                    <button type="button" class="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-900">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button type="button" class="rounded-lg p-2 transition hover:bg-slate-100 hover:text-rose-600">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="px-6 py-16 text-center">
            <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <span class="material-symbols-outlined">folder_open</span>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-slate-900">No categories yet</h3>
            <p class="mt-2 text-sm text-slate-500">Create your first category to get started.</p>
          </div>
        </section>
      </div>
    </main>

    <CategoryModal :is-open="isModalOpen" @close="isModalOpen = false" />
  </div>
</template>