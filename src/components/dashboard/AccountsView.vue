<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import api from '../../services/api'
import { accountsApi, type AccountDetail, type AccountType, type AccountTemplate } from '../../services/accounts'
import iconVersions from '@material-symbols/metadata/versions.json'

interface AccountSummary {
  id: number
  name: string
  institution: string | null
  icon: string | null
}

interface UserCurrency {
  currencyId: number
  code: string
  symbol: string
  active: boolean
  base: boolean
}

const searchQuery = ref('')
const activeTab = ref<'general' | 'behaviour' | 'misc'>('general')
const activeAccountId = ref<number | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isCreating = ref(false)
const error = ref('')

const accounts = ref<AccountSummary[]>([])
const userCurrencies = ref<UserCurrency[]>([])
const lastUpdatedAt = ref<string | null>(null)

const baseCurrencyId = computed(() => userCurrencies.value.find(c => c.base)?.currencyId ?? null)

const iconPickerOpen = ref(false)
const iconSearch = ref('')
const visibleIconLimit = ref(60)

const allIcons = Object.keys(iconVersions as Record<string, number>).sort((a, b) => a.localeCompare(b))

const filteredIcons = computed(() => {
  const q = iconSearch.value.trim().toLowerCase()
  return q ? allIcons.filter(i => i.includes(q)) : allIcons
})

const displayedIcons = computed(() => filteredIcons.value.slice(0, visibleIconLimit.value))
const hasMoreIcons = computed(() => displayedIcons.value.length < filteredIcons.value.length)

const selectIcon = (icon: string) => {
  selectedAccount.value.icon = icon
  iconPickerOpen.value = false
}

const selectedAccount = ref({
  name: '',
  type: 'NO_TYPE' as AccountType,
  institution: '',
  accountNumber: '',
  currencyId: null as number | null,
  groupName: '',
  startBalance: '0.00',
  notes: '',
  icon: 'account_balance',
  closed: false,
})

const selectedAccountBehaviour = ref({
  defaultTemplate: 'NONE' as AccountTemplate,
  excludeFromAccountSummary: false,
  outlineIntoSummary: false,
  excludeFromBudget: false,
  excludeFromAnyReports: false,
})

const selectedAccountMisc = ref({
  overdraftAt: 0.00,
  maximumBalance: 0.00,
  checkbook1: 0,
  checkbook2: 0,
})

const tabs = ['General', 'Behaviour', 'Misc'] as const

const filteredAccounts = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return accounts.value
  return accounts.value.filter(
    a => a.name.toLowerCase().includes(q) || (a.institution?.toLowerCase().includes(q) ?? false),
  )
})

const formattedLastUpdated = computed(() => {
  if (!lastUpdatedAt.value) return '—'
  return new Date(lastUpdatedAt.value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})

const populateForm = (account: AccountDetail) => {
  selectedAccount.value = {
    name: account.name,
    type: account.type,
    institution: account.institution ?? '',
    accountNumber: account.accountNumber ?? '',
    currencyId: account.currencyId,
    groupName: account.groupName ?? '',
    startBalance: String(account.startBalance ?? 0),
    notes: account.notes ?? '',
    icon: account.icon ?? 'account_balance',
    closed: account.closed,
  }
  selectedAccountBehaviour.value = {
    defaultTemplate: account.defaultTemplate,
    excludeFromAccountSummary: account.excludeFromAccountSummary,
    outlineIntoSummary: account.outlineIntoSummary,
    excludeFromBudget: account.excludeFromBudget,
    excludeFromAnyReports: account.excludeFromAnyReports,
  }
  selectedAccountMisc.value = {
    overdraftAt: Number(account.overdraftAt),
    maximumBalance: Number(account.maximumBalance),
    checkbook1: account.checkbook1,
    checkbook2: account.checkbook2,
  }
  lastUpdatedAt.value = account.updatedAt
  iconPickerOpen.value = false
  iconSearch.value = ''
  visibleIconLimit.value = 60
}

const resetForm = () => {
  selectedAccount.value = {
    name: '', type: 'NO_TYPE', institution: '', accountNumber: '',
    currencyId: baseCurrencyId.value, groupName: '', startBalance: '0.00', notes: '',
    icon: 'account_balance', closed: false,
  }
  selectedAccountBehaviour.value = {
    defaultTemplate: 'NONE', excludeFromAccountSummary: false,
    outlineIntoSummary: false, excludeFromBudget: false, excludeFromAnyReports: false,
  }
  selectedAccountMisc.value = { overdraftAt: 0, maximumBalance: 0, checkbook1: 0, checkbook2: 0 }
  lastUpdatedAt.value = null
  iconPickerOpen.value = false
  iconSearch.value = ''
  visibleIconLimit.value = 60
}

const fetchAccounts = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const { data } = await accountsApi.list()
    accounts.value = data.map(a => ({ id: a.id, name: a.name, institution: a.institution, icon: a.icon }))
    if (data.length > 0) {
      await selectAccount(data[0]!.id)
    } else {
      startCreating()
    }
  } catch (e) {
    error.value = 'Failed to load accounts'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const fetchUserCurrencies = async () => {
  try {
    const { data } = await api.get<UserCurrency[]>('/users/me/currencies')
    userCurrencies.value = data.filter(c => c.active)
    if (isCreating.value && selectedAccount.value.currencyId === null) {
      selectedAccount.value.currencyId = baseCurrencyId.value
    }
  } catch (e) {
    console.error('Failed to load currencies', e)
  }
}

const selectAccount = async (id: number) => {
  activeAccountId.value = id
  isCreating.value = false
  try {
    const { data } = await accountsApi.get(id)
    populateForm(data)
  } catch (e) {
    console.error('Failed to load account details', e)
  }
}

const startCreating = () => {
  activeAccountId.value = null
  isCreating.value = true
  activeTab.value = 'general'
  resetForm()
}

const buildPayload = () => ({
  name: selectedAccount.value.name,
  institution: selectedAccount.value.institution || undefined,
  type: selectedAccount.value.type,
  accountNumber: selectedAccount.value.accountNumber || undefined,
  currencyId: selectedAccount.value.currencyId ?? undefined,
  groupName: selectedAccount.value.groupName || undefined,
  startBalance: parseFloat(selectedAccount.value.startBalance) || 0,
  notes: selectedAccount.value.notes || undefined,
  icon: selectedAccount.value.icon || undefined,
  closed: selectedAccount.value.closed,
  defaultTemplate: selectedAccountBehaviour.value.defaultTemplate,
  excludeFromAccountSummary: selectedAccountBehaviour.value.excludeFromAccountSummary,
  outlineIntoSummary: selectedAccountBehaviour.value.outlineIntoSummary,
  excludeFromBudget: selectedAccountBehaviour.value.excludeFromBudget,
  excludeFromAnyReports: selectedAccountBehaviour.value.excludeFromAnyReports,
  overdraftAt: selectedAccountMisc.value.overdraftAt,
  maximumBalance: selectedAccountMisc.value.maximumBalance,
  checkbook1: selectedAccountMisc.value.checkbook1,
  checkbook2: selectedAccountMisc.value.checkbook2,
})

const saveChanges = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const payload = buildPayload()
    if (isCreating.value) {
      const { data } = await accountsApi.create(payload)
      accounts.value.push({ id: data.id, name: data.name, institution: data.institution, icon: data.icon })
      activeAccountId.value = data.id
      isCreating.value = false
      lastUpdatedAt.value = data.updatedAt
    } else if (activeAccountId.value !== null) {
      const { data } = await accountsApi.update(activeAccountId.value, payload)
      const idx = accounts.value.findIndex(a => a.id === data.id)
      if (idx !== -1) {
        accounts.value[idx] = { id: data.id, name: data.name, institution: data.institution, icon: data.icon }
      }
      lastUpdatedAt.value = data.updatedAt
    }
  } catch (e) {
    console.error('Failed to save account', e)
  } finally {
    isSaving.value = false
  }
}

const deleteAccount = async (id: number) => {
  try {
    await accountsApi.remove(id)
    accounts.value = accounts.value.filter(a => a.id !== id)
    if (activeAccountId.value === id) {
      const next = accounts.value[0]
      if (next) selectAccount(next.id)
      else startCreating()
    }
  } catch (e) {
    console.error('Failed to delete account', e)
  }
}

const decrement = (field: 'overdraftAt' | 'maximumBalance' | 'checkbook1' | 'checkbook2') => {
  if (field === 'overdraftAt' || field === 'maximumBalance') {
    selectedAccountMisc.value[field] = Math.max(0, parseFloat(String(selectedAccountMisc.value[field])) - 0.01)
  } else {
    selectedAccountMisc.value[field] = Math.max(0, selectedAccountMisc.value[field] - 1)
  }
}

const increment = (field: 'overdraftAt' | 'maximumBalance' | 'checkbook1' | 'checkbook2') => {
  if (field === 'overdraftAt' || field === 'maximumBalance') {
    selectedAccountMisc.value[field] = parseFloat(String(selectedAccountMisc.value[field])) + 0.01
  } else {
    selectedAccountMisc.value[field] = selectedAccountMisc.value[field] + 1
  }
}

const handleTabChange = (tab: string) => {
  if (tab === 'General') activeTab.value = 'general'
  else if (tab === 'Behaviour') activeTab.value = 'behaviour'
  else activeTab.value = 'misc'
}

onMounted(() => {
  fetchAccounts()
  fetchUserCurrencies()
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
          <h2 class="text-2xl font-bold text-slate-900">Manage Accounts</h2>
          <p class="text-sm text-slate-500">Manage your financial accounts from one place.</p>
        </div>

        <label class="relative block min-w-0 sm:w-72">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
            search
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search accounts..."
            class="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </header>

      <div class="max-w-[1400px] mx-auto p-8 grid grid-cols-12 gap-8">
        <!-- Account Sidebar (Master) -->
        <aside class="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col gap-6 h-fit">
          <div class="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4 border border-slate-200">
            <h2 class="text-xs font-black uppercase tracking-widest text-slate-400">Manage Accounts</h2>
            <!-- Search -->
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                v-model="searchQuery"
                class="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                placeholder="Search accounts..."
                type="text"
              />
            </div>

            <!-- Account List -->
            <div class="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-2">
              <!-- Loading -->
              <div v-if="isLoading" class="flex justify-center py-8">
                <div class="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>

              <!-- Error -->
              <div v-else-if="error" class="flex flex-col items-center gap-2 py-6 text-center">
                <span class="material-symbols-outlined text-red-400 text-3xl">error</span>
                <p class="text-sm text-red-500">{{ error }}</p>
                <button @click="fetchAccounts" class="text-xs text-primary font-bold hover:underline">Retry</button>
              </div>

              <!-- List -->
              <template v-else>
                <div
                  v-for="account in filteredAccounts"
                  :key="account.id"
                  class="flex items-center justify-between w-full p-4 rounded-xl transition-all cursor-pointer"
                  :class="account.id === activeAccountId ? 'bg-primary/10 border-r-4 border-primary' : 'hover:bg-slate-100'"
                  @click="selectAccount(account.id)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center"
                      :class="account.id === activeAccountId ? 'bg-primary text-black' : 'bg-slate-100 text-slate-500'"
                    >
                      <span class="material-symbols-outlined">{{ account.icon ?? 'account_balance' }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900">{{ account.name }}</p>
                      <p class="text-[10px] uppercase font-black tracking-wider text-slate-400">{{ account.institution ?? '—' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      @click.stop="deleteAccount(account.id)"
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <span v-if="account.id === activeAccountId" class="material-symbols-outlined text-primary">chevron_right</span>
                  </div>
                </div>

                <!-- Empty filtered results -->
                <div v-if="!filteredAccounts.length && !isLoading" class="text-center py-6">
                  <p class="text-sm text-slate-400">No accounts found.</p>
                </div>
              </template>

              <button
                @click="startCreating"
                class="mt-4 flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-all text-sm font-bold"
              >
                <span class="material-symbols-outlined">add</span>
                New Account
              </button>
            </div>
          </div>
        </aside>

        <!-- Configuration Panel (Detail) -->
        <div class="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-6">
          <div class="bg-white rounded-xl shadow-lg shadow-slate-200/40 border border-slate-200 flex flex-col flex-1 overflow-hidden">
            <!-- Tab Header -->
            <div class="flex items-center border-b border-slate-200 px-8 pt-6">
              <button
                v-for="tab in tabs"
                :key="tab"
                class="px-6 py-4 border-b-2 transition-all text-sm font-black tracking-widest uppercase"
                :class="activeTab === tab.toLowerCase() ? 'border-primary text-slate-900' : 'border-transparent text-slate-400 hover:text-primary'"
                @click="handleTabChange(tab)"
              >
                {{ tab }}
              </button>
            </div>

            <!-- Tab Content: General -->
            <div v-if="activeTab === 'general'" class="flex-1 overflow-y-auto p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Form Section Left -->
                <div class="flex flex-col gap-6">
                  <div class="group">
                    <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Account Name</label>
                    <input
                      v-model="selectedAccount.name"
                      class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all"
                      type="text"
                      placeholder="e.g. Main Savings"
                    />
                  </div>
                  <div class="group">
                    <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Account Type</label>
                    <select v-model="selectedAccount.type" class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all">
                      <option value="NO_TYPE">(no type)</option>
                      <option value="BANK">Bank</option>
                      <option value="CASH">Cash</option>
                      <option value="ASSET">Asset</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="LIABILITY">Liability</option>
                      <option value="CHECKING">Checking</option>
                      <option value="SAVINGS">Savings</option>
                    </select>
                  </div>
                  <div class="group">
                    <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Institution</label>
                    <div class="relative">
                      <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">account_balance</span>
                      <input
                        v-model="selectedAccount.institution"
                        class="w-full bg-slate-100 border-none rounded-xl py-3 pl-12 pr-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all"
                        type="text"
                      />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="group">
                      <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Account Number</label>
                      <input
                        v-model="selectedAccount.accountNumber"
                        class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all"
                        placeholder="**** 4829"
                        type="text"
                      />
                    </div>
                    <div class="group">
                      <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Currency</label>
                      <select v-model="selectedAccount.currencyId" class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all">
                        <option v-for="c in userCurrencies" :key="c.currencyId" :value="c.currencyId">
                          {{ c.code }} ({{ c.symbol }})
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <input v-model="selectedAccount.closed" class="w-5 h-5 rounded border-slate-200 text-primary focus:ring-primary cursor-pointer" type="checkbox" />
                    <label class="text-sm font-bold text-slate-900">Account was closed</label>
                    <span class="material-symbols-outlined text-slate-400 text-lg ml-auto cursor-help">info</span>
                  </div>
                </div>
                <!-- Form Section Right -->
                <div class="flex flex-col gap-6">
                  <div class="group">
                    <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Account Group</label>
                    <input
                      v-model="selectedAccount.groupName"
                      class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all"
                      type="text"
                    />
                  </div>
                  <div class="group">
                    <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Start Balance</label>
                    <div class="relative">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        v-model="selectedAccount.startBalance"
                        class="w-full bg-slate-100 border-none rounded-xl py-3 pl-8 pr-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all"
                        type="number"
                      />
                    </div>
                  </div>
                  <div class="group">
                    <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Icon</label>

                    <!-- Preview / Toggle -->
                    <button
                      type="button"
                      class="flex items-center gap-3 w-full p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all text-left"
                      @click="iconPickerOpen = !iconPickerOpen; iconSearch = ''; visibleIconLimit = 60"
                    >
                      <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-primary">{{ selectedAccount.icon || 'account_balance' }}</span>
                      </div>
                      <span class="text-sm font-medium text-slate-700 flex-1 truncate">{{ selectedAccount.icon || 'account_balance' }}</span>
                      <span class="material-symbols-outlined text-slate-400 text-base">{{ iconPickerOpen ? 'expand_less' : 'expand_more' }}</span>
                    </button>

                    <!-- Picker (collapsible) -->
                    <div v-if="iconPickerOpen" class="mt-2 flex flex-col gap-2">
                      <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                          v-model="iconSearch"
                          type="text"
                          placeholder="Search icon..."
                          class="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary transition-all"
                          @input="visibleIconLimit = 60"
                        />
                      </div>
                      <div class="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                        <div class="grid grid-cols-6 gap-1.5">
                          <button
                            v-for="icon in displayedIcons"
                            :key="icon"
                            type="button"
                            :title="icon"
                            class="flex h-10 items-center justify-center rounded-lg border transition"
                            :class="selectedAccount.icon === icon
                              ? 'border-primary bg-primary text-slate-900 shadow-md shadow-primary/20'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                            @click="selectIcon(icon)"
                          >
                            <span class="material-symbols-outlined text-[20px]">{{ icon }}</span>
                          </button>
                        </div>
                        <div v-if="hasMoreIcons" class="mt-3 flex justify-center">
                          <button
                            type="button"
                            class="text-xs text-primary font-bold hover:underline"
                            @click="visibleIconLimit += 60"
                          >
                            Load more ({{ filteredIcons.length - displayedIcons.length }} remaining)
                          </button>
                        </div>
                        <div v-if="filteredIcons.length === 0" class="py-8 text-center text-sm text-slate-400">
                          No icons found for "{{ iconSearch }}"
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="group flex-1">
                    <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Notes</label>
                    <textarea
                      v-model="selectedAccount.notes"
                      class="w-full h-full min-h-[120px] bg-slate-100 border-none rounded-xl py-4 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all resize-none"
                      placeholder="Add account details, emergency contacts, or internal references..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab Content: Behaviour -->
            <div v-if="activeTab === 'behaviour'" class="flex-1 overflow-y-auto p-8">
              <div class="flex flex-col gap-8">
                <!-- Automation Section -->
                <div class="group">
                  <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Default Template</label>
                  <select v-model="selectedAccountBehaviour.defaultTemplate" class="w-full max-w-sm bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all">
                    <option value="NONE">(none)</option>
                    <option value="STANDARD_TRANSACTIONS">Standard Transactions</option>
                    <option value="INCOME_TRACKING">Income Tracking</option>
                    <option value="EXPENSE_TRACKING">Expense Tracking</option>
                  </select>
                  <p class="mt-2 text-xs text-slate-400">Select a template to automate operations associated with this account.</p>
                </div>

                <!-- Report Exclusion Section -->
                <div class="flex flex-col gap-4">
                  <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Report Exclusion</label>
                  <div class="flex flex-col gap-3 max-w-md">
                    <label class="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                      <input v-model="selectedAccountBehaviour.excludeFromAccountSummary" class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" type="checkbox" />
                      <div>
                        <span class="text-sm font-bold text-slate-900">Exclude from account summary</span>
                        <p class="text-xs text-slate-500 mt-0.5">Prevents the account from appearing in the general summary.</p>
                      </div>
                    </label>
                    <label class="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                      <input v-model="selectedAccountBehaviour.outlineIntoSummary" class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" type="checkbox" />
                      <div>
                        <span class="text-sm font-bold text-slate-900">Outline into summary</span>
                        <p class="text-xs text-slate-500 mt-0.5">Show as reference only without including values.</p>
                      </div>
                    </label>
                    <label class="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                      <input v-model="selectedAccountBehaviour.excludeFromBudget" class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" type="checkbox" />
                      <div>
                        <span class="text-sm font-bold text-slate-900">Exclude from the budget</span>
                        <p class="text-xs text-slate-500 mt-0.5">Removes the account from budget calculations.</p>
                      </div>
                    </label>
                    <label class="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                      <input v-model="selectedAccountBehaviour.excludeFromAnyReports" class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" type="checkbox" />
                      <div>
                        <span class="text-sm font-bold text-slate-900">Exclude from any reports</span>
                        <p class="text-xs text-slate-500 mt-0.5">Removes the account from all generated reports.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab Content: Misc -->
            <div v-if="activeTab === 'misc'" class="flex-1 overflow-y-auto p-8">
              <div class="flex flex-col gap-8">
                <!-- Balance Limits Section -->
                <div class="flex flex-col gap-4">
                  <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Balance Limits</label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
                    <div class="group">
                      <label class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Overdraft at</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('overdraftAt')" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input
                          v-model="selectedAccountMisc.overdraftAt"
                          class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium text-center focus:ring-2 focus:ring-primary transition-all"
                          type="number"
                          step="0.01"
                        />
                        <button @click="increment('overdraftAt')" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-slate-400">Maximum allowed negative balance.</p>
                    </div>
                    <div class="group">
                      <label class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Maximum</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('maximumBalance')" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input
                          v-model="selectedAccountMisc.maximumBalance"
                          class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium text-center focus:ring-2 focus:ring-primary transition-all"
                          type="number"
                          step="0.01"
                        />
                        <button @click="increment('maximumBalance')" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-slate-400">Maximum allowed balance.</p>
                    </div>
                  </div>
                </div>

                <!-- Current Check Number Section -->
                <div class="flex flex-col gap-4">
                  <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Current Check Number</label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
                    <div class="group">
                      <label class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Checkbook 1</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('checkbook1')" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input
                          v-model="selectedAccountMisc.checkbook1"
                          class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium text-center focus:ring-2 focus:ring-primary transition-all"
                          type="number"
                        />
                        <button @click="increment('checkbook1')" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-slate-400">Current check number for checkbook 1.</p>
                    </div>
                    <div class="group">
                      <label class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Checkbook 2</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('checkbook2')" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input
                          v-model="selectedAccountMisc.checkbook2"
                          class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium text-center focus:ring-2 focus:ring-primary transition-all"
                          type="number"
                        />
                        <button @click="increment('checkbook2')" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-slate-400">Current check number for checkbook 2.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="p-8 bg-slate-50 flex items-center justify-end">
              <button
                @click="saveChanges"
                :disabled="isSaving"
                class="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-[12px] shadow-lg shadow-primary/20 hover:scale-95 active:scale-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                <span v-if="isSaving" class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <template v-else>
                  {{ isCreating ? 'Create Account' : 'Save Changes' }}
                  <span class="material-symbols-outlined text-lg">check</span>
                </template>
              </button>
            </div>
          </div>

          <!-- Contextual Insight Card (Bento Style) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 bg-primary/5 rounded-xl p-6 border border-primary/20 flex gap-4 items-start">
              <span class="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">lightbulb</span>
              <div>
                <h4 class="font-black text-sm uppercase tracking-wide text-slate-900 mb-1">Pro Tip: Balance Sync</h4>
                <p class="text-sm text-slate-500 leading-relaxed">Connecting your institution via <strong>Orbit Link</strong> will automatically populate transaction numbers and start balances, saving you manual entry time.</p>
              </div>
            </div>
            <div class="bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-center items-center text-center">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Updated</p>
              <p class="text-lg font-black text-slate-900">{{ formattedLastUpdated }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
