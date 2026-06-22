<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from './Sidebar.vue'
import EditCategoryModal from './EditCategoryModal.vue'
import api from '../../services/api'

type FlowType = 'expense' | 'income'
type FilterType = FlowType | 'deleted'

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

type DeletedSubcategory = {
  id: number
  name: string
  type: FlowType
  icon: string
}

type DeletedCategory = {
  id: number
  name: string
  type: FlowType
  icon: string
  iconClass: string
  children: DeletedSubcategory[]
  orphan: boolean
}

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

interface EditingItem {
  id: number
  name: string
  icon: string
  isSubcategory: boolean
}

const activeFilter = ref<FilterType>('expense')
const searchQuery = ref('')
const categoryFormOpen = ref(false)
const categoryFormMode = ref<'create' | 'edit'>('create')
const isLoading = ref(false)
const isLoadingDeleted = ref(false)
const error = ref('')
const errorDeleted = ref('')
const editingItem = ref<EditingItem | null>(null)
const expandedCategories = ref<number[]>([])
const expandedDeletedCategories = ref<number[]>([])

const categories = ref<Category[]>([])
const deletedCategories = ref<DeletedCategory[]>([])

const getIconClass = (type: 'EXPENSE' | 'INCOME') =>
  type === 'EXPENSE' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'

const mapBackendCategories = (backendCategories: BackendCategory[]): Category[] =>
  backendCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    type: cat.type.toLowerCase() as FlowType,
    icon: cat.icon,
    iconClass: getIconClass(cat.type),
    children: cat.children.map(child => ({
      id: child.id,
      name: child.name,
      type: child.type.toLowerCase() as FlowType,
      icon: child.icon,
    })),
  }))

const fetchCategories = async (silent = false) => {
  if (!silent) isLoading.value = true
  error.value = ''
  try {
    const response = await api.get<BackendCategory[]>('/users/me/categories')
    categories.value = mapBackendCategories(response.data)
    if (expandedCategories.value.length === 0) {
      const first = categories.value[0]
      if (first) expandedCategories.value = [first.id]
    } else {
      const existingIds = new Set(categories.value.map(c => c.id))
      expandedCategories.value = expandedCategories.value.filter(id => existingIds.has(id))
    }
  } catch (e) {
    error.value = 'Failed to load categories'
    console.error(e)
  } finally {
    if (!silent) isLoading.value = false
  }
}

const fetchDeletedCategories = async (silent = false) => {
  if (!silent) isLoadingDeleted.value = true
  errorDeleted.value = ''
  try {
    const response = await api.get<BackendCategory[]>('/users/me/categories', { params: { includeInactive: true } })
    const deleted: DeletedCategory[] = []

    for (const root of response.data) {
      if (!root.active) {
        deleted.push({
          id: root.id,
          name: root.name,
          type: root.type.toLowerCase() as FlowType,
          icon: root.icon,
          iconClass: getIconClass(root.type),
          orphan: false,
          children: root.children
            .filter(c => !c.active)
            .map(c => ({ id: c.id, name: c.name, type: c.type.toLowerCase() as FlowType, icon: c.icon })),
        })
      } else {
        for (const child of root.children) {
          if (!child.active) {
            deleted.push({
              id: child.id,
              name: child.name,
              type: child.type.toLowerCase() as FlowType,
              icon: child.icon,
              iconClass: getIconClass(child.type),
              orphan: true,
              children: [],
            })
          }
        }
      }
    }

    deletedCategories.value = deleted
  } catch (e) {
    errorDeleted.value = 'Failed to load deleted categories'
    console.error(e)
  } finally {
    if (!silent) isLoadingDeleted.value = false
  }
}

const restoreCategory = async (id: number) => {
  try {
    await api.patch(`/users/me/categories/${id}`, { active: true })
    await Promise.all([fetchCategories(true), fetchDeletedCategories(true)])
  } catch (e) {
    console.error('Failed to restore category', e)
  }
}

const deleteCategory = async (id: number) => {
  try {
    await api.delete(`/users/me/categories/${id}`)
    await Promise.all([fetchCategories(true), fetchDeletedCategories(true)])
  } catch (e) {
    console.error('Failed to delete category', e)
  }
}

const filteredCategories = computed(() => {
  if (activeFilter.value === 'deleted') return []
  const filter = activeFilter.value
  const query = searchQuery.value.trim().toLowerCase()
  return categories.value.filter(category => {
    const matchesFilter = category.type === filter
    const matchesQuery =
      query.length === 0 ||
      category.name.toLowerCase().includes(query) ||
      category.children.some(child => child.name.toLowerCase().includes(query))
    return matchesFilter && matchesQuery
  })
})

const filteredDeletedCategories = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return deletedCategories.value
  return deletedCategories.value.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.children.some(ch => ch.name.toLowerCase().includes(query))
  )
})

const toggleExpanded = (categoryId: number) => {
  if (expandedCategories.value.includes(categoryId)) {
    expandedCategories.value = expandedCategories.value.filter(id => id !== categoryId)
  } else {
    expandedCategories.value = [...expandedCategories.value, categoryId]
  }
}

const isExpanded = (categoryId: number) => expandedCategories.value.includes(categoryId)

const toggleDeletedExpanded = (categoryId: number) => {
  if (expandedDeletedCategories.value.includes(categoryId)) {
    expandedDeletedCategories.value = expandedDeletedCategories.value.filter(id => id !== categoryId)
  } else {
    expandedDeletedCategories.value = [...expandedDeletedCategories.value, categoryId]
  }
}

const isDeletedExpanded = (categoryId: number) => expandedDeletedCategories.value.includes(categoryId)

const openCreateModal = () => {
  categoryFormMode.value = 'create'
  editingItem.value = null
  categoryFormOpen.value = true
}

const openEditModal = (id: number, name: string, icon: string, isSubcategory = false) => {
  categoryFormMode.value = 'edit'
  editingItem.value = { id, name, icon, isSubcategory }
  categoryFormOpen.value = true
}

const handleCategoryFormClose = () => {
  categoryFormOpen.value = false
  editingItem.value = null
}

const handleCategorySaved = (updatedData: { mode: 'create' | 'edit'; id?: number; name: string; icon: string; type: FlowType }) => {
  if (updatedData.mode === 'create') {
    categoryFormOpen.value = false
    editingItem.value = null
    activeFilter.value = updatedData.type
    fetchCategories()
    return
  }

  if (!updatedData.id) {
    categoryFormOpen.value = false
    editingItem.value = null
    return
  }

  const categoryIndex = categories.value.findIndex(cat => cat.id === updatedData.id)
  if (categoryIndex !== -1) {
    const cat = categories.value[categoryIndex]
    if (cat) { cat.name = updatedData.name; cat.icon = updatedData.icon }
  } else {
    for (const category of categories.value) {
      const subIndex = category.children.findIndex(sub => sub.id === updatedData.id)
      if (subIndex !== -1) {
        const sub = category.children[subIndex]
        if (sub) { sub.name = updatedData.name; sub.icon = updatedData.icon }
        break
      }
    }
  }
  categoryFormOpen.value = false
  editingItem.value = null
}

onMounted(() => {
  fetchCategories()
  fetchDeletedCategories()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background-light">
    <Sidebar />

    <main class="flex-1 flex flex-col overflow-hidden">

      <!-- Header -->
      <header class="shrink-0 bg-background-light/90 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Manage Categories</h2>
          <p class="text-sm text-slate-500">Organize categories and subcategories without leaving the main dashboard.</p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label class="relative block min-w-0 sm:w-72">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
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
            @click="openCreateModal"
          >
            <span class="material-symbols-outlined text-xl">add_circle</span>
            <span>New category</span>
          </button>
        </div>
      </header>

      <!-- Scrollable content -->
      <div class="flex-1 min-h-0 flex flex-col">
        <div class="flex-1 min-h-0 max-w-6xl w-full mx-auto px-8 py-8 flex flex-col gap-8">

          <!-- Stats cards -->
          <section class="shrink-0 grid gap-4 md:grid-cols-3">
            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Categories</p>
              <p class="mt-3 text-3xl font-bold text-slate-900">
                {{ activeFilter === 'deleted' ? filteredDeletedCategories.length : filteredCategories.length }}
              </p>
              <p class="mt-2 text-sm text-slate-500">Visible under the current filter.</p>
            </article>

            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Subcategories</p>
              <p class="mt-3 text-3xl font-bold text-slate-900">
                {{ activeFilter === 'deleted'
                  ? filteredDeletedCategories.reduce((t, c) => t + c.children.length, 0)
                  : filteredCategories.reduce((total, cat) => total + cat.children.length, 0) }}
              </p>
              <p class="mt-2 text-sm text-slate-500">Available breakdown for reporting and budgeting.</p>
            </article>

            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Active flow</p>
              <p class="mt-3 text-3xl font-bold text-slate-900">
                {{ activeFilter === 'expense' ? 'Expenses' : activeFilter === 'income' ? 'Income' : 'Deleted' }}
              </p>
              <p class="mt-2 text-sm text-slate-500">Switch the view using the selector below.</p>
            </article>
          </section>

          <!-- Table section -->
          <section class="flex-1 min-h-0 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">

            <!-- Filter bar -->
            <div class="shrink-0 border-b border-slate-200 bg-slate-50 px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div class="inline-flex rounded-2xl bg-white p-1 border border-slate-200 shadow-sm">
                <button
                  type="button"
                  class="rounded-xl px-5 py-2.5 text-sm font-semibold transition"
                  :class="activeFilter === 'expense' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'"
                  @click="activeFilter = 'expense'"
                >Expenses</button>
                <button
                  type="button"
                  class="rounded-xl px-5 py-2.5 text-sm font-semibold transition"
                  :class="activeFilter === 'income' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'"
                  @click="activeFilter = 'income'"
                >Income</button>
                <button
                  type="button"
                  class="rounded-xl px-5 py-2.5 text-sm font-semibold transition"
                  :class="activeFilter === 'deleted' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'"
                  @click="activeFilter = 'deleted'"
                >Deleted</button>
              </div>

              <p class="text-sm text-slate-500">
                {{ activeFilter === 'deleted' ? filteredDeletedCategories.length : filteredCategories.length }}
                result<span v-if="(activeFilter === 'deleted' ? filteredDeletedCategories.length : filteredCategories.length) !== 1">s</span>
              </p>
            </div>

            <!-- Column headers -->
            <div class="shrink-0 px-6 py-4 border-b border-slate-100">
              <div class="grid grid-cols-12 gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <div class="col-span-7 md:col-span-8">Category / Subcategory</div>
                <div class="col-span-2 text-center">Type</div>
                <div class="col-span-3 md:col-span-2 text-right">Actions</div>
              </div>
            </div>

            <!-- ── Expenses / Income rows ── -->
            <template v-if="activeFilter !== 'deleted'">
              <div v-if="isLoading" class="flex items-center justify-center py-16">
                <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>

              <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-center">
                <span class="material-symbols-outlined text-red-400 text-4xl mb-2">error</span>
                <p class="text-red-500 font-medium">{{ error }}</p>
                <button @click="() => fetchCategories()" class="mt-4 px-4 py-2 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary/90">
                  Retry
                </button>
              </div>

              <div v-else-if="filteredCategories.length" class="flex-1 overflow-y-auto divide-y divide-slate-100">
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
                      <button type="button" class="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-900" @click="openEditModal(category.id, category.name, category.icon, false)">
                        <span class="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button type="button" class="rounded-lg p-2 transition hover:bg-slate-100 hover:text-rose-600" @click="deleteCategory(category.id)">
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
                        <button type="button" class="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-900" @click="openEditModal(child.id, child.name, child.icon, true)">
                          <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button type="button" class="rounded-lg p-2 transition hover:bg-slate-100 hover:text-rose-600" @click="deleteCategory(child.id)">
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
            </template>

            <!-- ── Deleted rows ── -->
            <template v-else>
              <div v-if="isLoadingDeleted" class="flex items-center justify-center py-16">
                <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>

              <div v-else-if="errorDeleted" class="flex flex-col items-center justify-center py-16 text-center">
                <span class="material-symbols-outlined text-red-400 text-4xl mb-2">error</span>
                <p class="text-red-500 font-medium">{{ errorDeleted }}</p>
                <button @click="() => fetchDeletedCategories()" class="mt-4 px-4 py-2 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary/90">
                  Retry
                </button>
              </div>

              <div v-else-if="filteredDeletedCategories.length" class="flex-1 overflow-y-auto divide-y divide-slate-100">
                <div v-for="category in filteredDeletedCategories" :key="category.id" class="group">
                  <!-- Parent / orphan row -->
                  <div class="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div class="col-span-7 md:col-span-8 flex items-center gap-4 min-w-0">
                      <button
                        v-if="!category.orphan && category.children.length > 0"
                        type="button"
                        class="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                        @click="toggleDeletedExpanded(category.id)"
                      >
                        <span class="material-symbols-outlined text-xl">
                          {{ isDeletedExpanded(category.id) ? 'expand_more' : 'chevron_right' }}
                        </span>
                      </button>
                      <div v-else class="flex size-8 items-center justify-center invisible"></div>

                      <div :class="['flex size-11 items-center justify-center rounded-2xl opacity-50', category.iconClass]">
                        <span class="material-symbols-outlined">{{ category.icon }}</span>
                      </div>

                      <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-slate-500 line-through">{{ category.name }}</p>
                        <p class="text-xs text-slate-400">
                          {{ category.orphan ? 'Deleted subcategory' : `${category.children.length} subcategories` }}
                        </p>
                      </div>
                    </div>

                    <div class="col-span-2 flex justify-center">
                      <span
                        class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide opacity-60"
                        :class="category.type === 'expense' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
                      >
                        {{ category.type === 'expense' ? 'Expense' : 'Income' }}
                      </span>
                    </div>

                    <div class="col-span-3 md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                        @click="restoreCategory(category.id)"
                      >
                        <span class="material-symbols-outlined text-[16px]">restore</span>
                        Restore
                      </button>
                    </div>
                  </div>

                  <!-- Children rows (only for deleted parents) -->
                  <div v-if="!category.orphan && category.children.length > 0 && isDeletedExpanded(category.id)" class="bg-slate-50/80">
                    <div
                      v-for="child in category.children"
                      :key="child.id"
                      class="grid grid-cols-12 gap-4 items-center px-6 py-3 hover:bg-white transition-colors"
                    >
                      <div class="col-span-7 md:col-span-8 flex items-center gap-4 pl-14">
                        <span class="size-2 rounded-full bg-slate-300"></span>
                        <span class="text-sm text-slate-500 line-through">{{ child.name }}</span>
                      </div>

                      <div class="col-span-2"></div>
                      <div class="col-span-3 md:col-span-2"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="px-6 py-16 text-center">
                <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <span class="material-symbols-outlined">delete_sweep</span>
                </div>
                <h3 class="mt-4 text-lg font-semibold text-slate-900">No deleted categories</h3>
                <p class="mt-2 text-sm text-slate-500">Categories you delete will appear here for recovery.</p>
              </div>
            </template>

          </section>
        </div>
      </div>
    </main>

    <EditCategoryModal
      :is-open="categoryFormOpen"
      :mode="categoryFormMode"
      :category-id="editingItem?.id"
      :initial-name="editingItem?.name"
      :initial-icon="editingItem?.icon"
      :initial-type="activeFilter === 'deleted' ? 'expense' : activeFilter"
      :is-subcategory="editingItem?.isSubcategory ?? false"
      @close="handleCategoryFormClose"
      @saved="handleCategorySaved"
    />
  </div>
</template>
