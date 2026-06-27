<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import { AppButton, AppIconButton, AppSpinner, PageHeader } from '../ui'
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
  <div class="flex h-screen overflow-hidden bg-bg">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <PageHeader title="Accounts" subtitle="Manage your financial accounts from one place." />

      <div class="mx-auto grid max-w-[1400px] grid-cols-12 gap-6 p-6 lg:gap-8 lg:p-8">
        <!-- Account list (Master) -->
        <aside class="col-span-12 flex h-fit flex-col gap-6 md:col-span-4 lg:col-span-3">
          <div class="surface-card flex flex-col gap-4 p-6">
            <h2 class="field-label !mb-0">Your accounts</h2>

            <!-- Search -->
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">search</span>
              <input
                v-model="searchQuery"
                class="field-input pl-11"
                placeholder="Search accounts..."
                type="text"
              />
            </div>

            <!-- Account List -->
            <div class="flex max-h-[500px] flex-col gap-1.5 overflow-y-auto pr-1">
              <div v-if="isLoading" class="flex justify-center py-8 text-primary">
                <AppSpinner size="md" />
              </div>

              <div v-else-if="error" class="flex flex-col items-center gap-2 py-6 text-center">
                <span class="material-symbols-outlined text-3xl text-danger">error</span>
                <p class="text-sm text-danger">{{ error }}</p>
                <AppButton variant="secondary" size="sm" @click="fetchAccounts">Retry</AppButton>
              </div>

              <template v-else>
                <div
                  v-for="account in filteredAccounts"
                  :key="account.id"
                  class="flex cursor-pointer items-center justify-between rounded-xl p-3 transition-colors"
                  :class="account.id === activeAccountId ? 'bg-primary/10' : 'hover:bg-surface-2'"
                  @click="selectAccount(account.id)"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <div
                      class="icon-tile size-10 shrink-0"
                      :class="account.id === activeAccountId ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-muted'"
                    >
                      <span class="material-symbols-outlined text-[20px]">{{ account.icon ?? 'account_balance' }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-content">{{ account.name }}</p>
                      <p class="truncate text-xs text-muted">{{ account.institution ?? '—' }}</p>
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center">
                    <AppIconButton
                      icon="delete"
                      variant="danger"
                      size="sm"
                      aria-label="Delete account"
                      @click.stop="deleteAccount(account.id)"
                    />
                    <span v-if="account.id === activeAccountId" class="material-symbols-outlined text-primary">chevron_right</span>
                  </div>
                </div>

                <div v-if="!filteredAccounts.length && !isLoading" class="py-6 text-center">
                  <p class="text-sm text-muted">No accounts found.</p>
                </div>
              </template>

              <button
                class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line p-3 text-sm font-semibold text-muted transition-all hover:border-primary hover:text-primary"
                @click="startCreating"
              >
                <span class="material-symbols-outlined text-[20px]">add</span>
                New Account
              </button>
            </div>
          </div>
        </aside>

        <!-- Configuration Panel (Detail) -->
        <div class="col-span-12 flex flex-col gap-6 md:col-span-8 lg:col-span-9">
          <div class="surface-card flex flex-1 flex-col overflow-hidden p-0">
            <!-- Tabs -->
            <div class="flex items-center border-b border-line px-6 pt-4 lg:px-8">
              <button
                v-for="tab in tabs"
                :key="tab"
                class="border-b-2 px-5 py-3 text-sm font-semibold transition-colors"
                :class="activeTab === tab.toLowerCase() ? 'border-primary text-content' : 'border-transparent text-muted hover:text-content'"
                @click="handleTabChange(tab)"
              >
                {{ tab }}
              </button>
            </div>

            <!-- General -->
            <div v-if="activeTab === 'general'" class="flex-1 overflow-y-auto p-6 lg:p-8">
              <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
                <!-- Left -->
                <div class="flex flex-col gap-5">
                  <div>
                    <label class="field-label">Account Name</label>
                    <input v-model="selectedAccount.name" class="field-input" type="text" placeholder="e.g. Main Savings" />
                  </div>
                  <div>
                    <label class="field-label">Account Type</label>
                    <select v-model="selectedAccount.type" class="field-input">
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
                  <div>
                    <label class="field-label">Institution</label>
                    <div class="relative">
                      <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">account_balance</span>
                      <input v-model="selectedAccount.institution" class="field-input pl-11" type="text" />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="field-label">Account Number</label>
                      <input v-model="selectedAccount.accountNumber" class="field-input" placeholder="**** 4829" type="text" />
                    </div>
                    <div>
                      <label class="field-label">Currency</label>
                      <select v-model="selectedAccount.currencyId" class="field-input">
                        <option v-for="c in userCurrencies" :key="c.currencyId" :value="c.currencyId">
                          {{ c.code }} ({{ c.symbol }})
                        </option>
                      </select>
                    </div>
                  </div>
                  <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-4">
                    <input v-model="selectedAccount.closed" class="size-5 rounded border-line" type="checkbox" />
                    <span class="text-sm font-semibold text-content">Account was closed</span>
                    <span class="material-symbols-outlined ml-auto cursor-help text-[20px] text-faint">info</span>
                  </label>
                </div>

                <!-- Right -->
                <div class="flex flex-col gap-5">
                  <div>
                    <label class="field-label">Account Group</label>
                    <input v-model="selectedAccount.groupName" class="field-input" type="text" />
                  </div>
                  <div>
                    <label class="field-label">Start Balance</label>
                    <div class="relative">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-faint">$</span>
                      <input v-model="selectedAccount.startBalance" class="field-input pl-8" type="number" />
                    </div>
                  </div>
                  <div>
                    <label class="field-label">Icon</label>
                    <!-- Preview / Toggle -->
                    <button
                      type="button"
                      class="flex w-full items-center gap-3 rounded-lg border border-line bg-surface-2 p-2.5 text-left transition-all hover:bg-surface"
                      @click="iconPickerOpen = !iconPickerOpen; iconSearch = ''; visibleIconLimit = 60"
                    >
                      <div class="icon-tile size-9 shrink-0 bg-primary/10 text-primary">
                        <span class="material-symbols-outlined">{{ selectedAccount.icon || 'account_balance' }}</span>
                      </div>
                      <span class="flex-1 truncate text-sm font-medium text-content">{{ selectedAccount.icon || 'account_balance' }}</span>
                      <span class="material-symbols-outlined text-[20px] text-faint">{{ iconPickerOpen ? 'expand_less' : 'expand_more' }}</span>
                    </button>

                    <!-- Picker -->
                    <div v-if="iconPickerOpen" class="mt-2 flex flex-col gap-2">
                      <div class="relative">
                        <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">search</span>
                        <input
                          v-model="iconSearch"
                          type="text"
                          placeholder="Search icon..."
                          class="field-input pl-11"
                          @input="visibleIconLimit = 60"
                        />
                      </div>
                      <div class="max-h-52 overflow-y-auto rounded-xl border border-line bg-surface-2 p-2">
                        <div class="grid grid-cols-6 gap-1.5">
                          <button
                            v-for="icon in displayedIcons"
                            :key="icon"
                            type="button"
                            :title="icon"
                            class="flex h-10 items-center justify-center rounded-lg border transition"
                            :class="selectedAccount.icon === icon
                              ? 'border-primary bg-primary text-primary-fg shadow-sm'
                              : 'border-line bg-surface text-muted hover:border-line-strong'"
                            @click="selectIcon(icon)"
                          >
                            <span class="material-symbols-outlined text-[20px]">{{ icon }}</span>
                          </button>
                        </div>
                        <div v-if="hasMoreIcons" class="mt-3 flex justify-center">
                          <button type="button" class="text-xs font-semibold text-primary hover:underline" @click="visibleIconLimit += 60">
                            Load more ({{ filteredIcons.length - displayedIcons.length }} remaining)
                          </button>
                        </div>
                        <div v-if="filteredIcons.length === 0" class="py-8 text-center text-sm text-muted">
                          No icons found for "{{ iconSearch }}"
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex-1">
                    <label class="field-label">Notes</label>
                    <textarea
                      v-model="selectedAccount.notes"
                      class="field-input h-full min-h-[120px] resize-none"
                      placeholder="Add account details, emergency contacts, or internal references..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- Behaviour -->
            <div v-if="activeTab === 'behaviour'" class="flex-1 overflow-y-auto p-6 lg:p-8">
              <div class="flex flex-col gap-8">
                <div>
                  <label class="field-label">Default Template</label>
                  <select v-model="selectedAccountBehaviour.defaultTemplate" class="field-input max-w-sm">
                    <option value="NONE">(none)</option>
                    <option value="STANDARD_TRANSACTIONS">Standard Transactions</option>
                    <option value="INCOME_TRACKING">Income Tracking</option>
                    <option value="EXPENSE_TRACKING">Expense Tracking</option>
                  </select>
                  <p class="mt-2 text-xs text-muted">Select a template to automate operations associated with this account.</p>
                </div>

                <div class="flex flex-col gap-4">
                  <label class="field-label">Report Exclusion</label>
                  <div class="flex max-w-md flex-col gap-3">
                    <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 transition-all hover:bg-surface">
                      <input v-model="selectedAccountBehaviour.excludeFromAccountSummary" class="size-5 rounded border-line" type="checkbox" />
                      <div>
                        <span class="text-sm font-semibold text-content">Exclude from account summary</span>
                        <p class="mt-0.5 text-xs text-muted">Prevents the account from appearing in the general summary.</p>
                      </div>
                    </label>
                    <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 transition-all hover:bg-surface">
                      <input v-model="selectedAccountBehaviour.outlineIntoSummary" class="size-5 rounded border-line" type="checkbox" />
                      <div>
                        <span class="text-sm font-semibold text-content">Outline into summary</span>
                        <p class="mt-0.5 text-xs text-muted">Show as reference only without including values.</p>
                      </div>
                    </label>
                    <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 transition-all hover:bg-surface">
                      <input v-model="selectedAccountBehaviour.excludeFromBudget" class="size-5 rounded border-line" type="checkbox" />
                      <div>
                        <span class="text-sm font-semibold text-content">Exclude from the budget</span>
                        <p class="mt-0.5 text-xs text-muted">Removes the account from budget calculations.</p>
                      </div>
                    </label>
                    <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 transition-all hover:bg-surface">
                      <input v-model="selectedAccountBehaviour.excludeFromAnyReports" class="size-5 rounded border-line" type="checkbox" />
                      <div>
                        <span class="text-sm font-semibold text-content">Exclude from any reports</span>
                        <p class="mt-0.5 text-xs text-muted">Removes the account from all generated reports.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Misc -->
            <div v-if="activeTab === 'misc'" class="flex-1 overflow-y-auto p-6 lg:p-8">
              <div class="flex flex-col gap-8">
                <div class="flex flex-col gap-4">
                  <label class="field-label">Balance Limits</label>
                  <div class="grid max-w-md grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Overdraft at</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('overdraftAt')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input v-model="selectedAccountMisc.overdraftAt" class="field-input text-center" type="number" step="0.01" />
                        <button @click="increment('overdraftAt')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-muted">Maximum allowed negative balance.</p>
                    </div>
                    <div>
                      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Maximum</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('maximumBalance')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input v-model="selectedAccountMisc.maximumBalance" class="field-input text-center" type="number" step="0.01" />
                        <button @click="increment('maximumBalance')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-muted">Maximum allowed balance.</p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-4">
                  <label class="field-label">Current Check Number</label>
                  <div class="grid max-w-md grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Checkbook 1</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('checkbook1')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input v-model="selectedAccountMisc.checkbook1" class="field-input text-center" type="number" />
                        <button @click="increment('checkbook1')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-muted">Current check number for checkbook 1.</p>
                    </div>
                    <div>
                      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Checkbook 2</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('checkbook2')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input v-model="selectedAccountMisc.checkbook2" class="field-input text-center" type="number" />
                        <button @click="increment('checkbook2')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-muted">Current check number for checkbook 2.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="flex items-center justify-end border-t border-line bg-surface-2/40 p-6 lg:px-8">
              <AppButton :loading="isSaving" trailing-icon="check" @click="saveChanges">
                {{ isCreating ? 'Create Account' : 'Save Changes' }}
              </AppButton>
            </div>
          </div>

          <!-- Contextual Insight -->
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div class="flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:col-span-2">
              <span class="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">lightbulb</span>
              <div>
                <h4 class="mb-1 text-sm font-bold text-content">Tip: Keep balances current</h4>
                <p class="text-sm leading-relaxed text-muted">Set an accurate <strong>start balance</strong> when you create an account. Every transaction is calculated from it, so your running balance and reports stay correct.</p>
              </div>
            </div>
            <div class="surface-card flex flex-col items-center justify-center p-6 text-center">
              <p class="field-label !mb-1">Last Updated</p>
              <p class="text-lg font-bold text-content">{{ formattedLastUpdated }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
