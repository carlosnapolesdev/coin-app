<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppSidebar from './AppSidebar.vue'
import { AnimatedAmount, AppButton, AppIconButton, AppSpinner, AppTabs, ConfirmDialog, PageContainer, PageHeader } from '../ui'
import api from '../../services/api'
import { accountsApi, type AccountDetail, type AccountType, type AccountTemplate } from '../../services/accounts'
import { ACCOUNT_ICONS } from '../../config/icons'
import { formatDate } from '../../utils/format'
import { logError } from '../../utils/logError'
import { useToast } from '../../composables/useToast'

const { t } = useI18n()
const toast = useToast()

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
const confirmDeleteId = ref<number | null>(null)

const accounts = ref<AccountSummary[]>([])
const userCurrencies = ref<UserCurrency[]>([])
const lastUpdatedAt = ref<string | null>(null)
const currentBalanceDisplay = ref(0)

const baseCurrencyId = computed(() => userCurrencies.value.find(c => c.base)?.currencyId ?? null)

const iconPickerOpen = ref(false)
const iconSearch = ref('')
const visibleIconLimit = ref(60)

const allIcons = [...ACCOUNT_ICONS].sort((a, b) => a.localeCompare(b))

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

const tabs = computed(() => [
  { value: 'general', label: t('accounts.tabs.general') },
  { value: 'behaviour', label: t('accounts.tabs.behaviour') },
  { value: 'misc', label: t('accounts.tabs.misc') },
])

const filteredAccounts = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return accounts.value
  return accounts.value.filter(
    a => a.name.toLowerCase().includes(q) || (a.institution?.toLowerCase().includes(q) ?? false),
  )
})

const formattedLastUpdated = computed(() => {
  if (!lastUpdatedAt.value) return '—'
  return formatDate(lastUpdatedAt.value, { month: 'short', day: 'numeric', year: 'numeric' })
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
  currentBalanceDisplay.value = account.currentBalance
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
  currentBalanceDisplay.value = 0
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
  } catch (err: unknown) {
    logError('accounts.fetchAccounts', err)
    error.value = t('accounts.loadError')
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
  } catch (err: unknown) {
    logError('accounts.fetchUserCurrencies', err)
  }
}

const selectAccount = async (id: number) => {
  activeAccountId.value = id
  isCreating.value = false
  try {
    const { data } = await accountsApi.get(id)
    populateForm(data)
  } catch (err: unknown) {
    logError('accounts.selectAccount', err)
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
    toast.success(t('accounts.saved'))
  } catch (err: unknown) {
    logError('accounts.saveChanges', err)
    toast.error(t('accounts.saveError'))
  } finally {
    isSaving.value = false
  }
}

const requestDeleteAccount = (id: number) => {
  confirmDeleteId.value = id
}

const confirmDeleteAccount = async () => {
  if (confirmDeleteId.value === null) return
  const id = confirmDeleteId.value
  try {
    await accountsApi.remove(id)
    accounts.value = accounts.value.filter(a => a.id !== id)
    if (activeAccountId.value === id) {
      const next = accounts.value[0]
      if (next) selectAccount(next.id)
      else startCreating()
    }
    toast.success(t('accounts.deleted'))
  } catch (err: unknown) {
    logError('accounts.confirmDeleteAccount', err)
    toast.error(t('accounts.deleteError'))
  } finally {
    confirmDeleteId.value = null
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

onMounted(() => {
  fetchAccounts()
  fetchUserCurrencies()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-ambient">
    <AppSidebar />

    <main class="wm-logo-main flex-1 overflow-y-auto">
      <PageHeader :title="t('accounts.pageTitle')" :subtitle="t('accounts.pageSubtitle')" />

      <PageContainer>
        <div class="grid grid-cols-12 gap-6 lg:gap-8">
        <!-- Account list (Master) -->
        <aside class="col-span-12 flex h-fit flex-col gap-6 md:col-span-4 lg:col-span-3">
          <div class="surface-card flex flex-col gap-4 p-6">
            <h2 class="field-label !mb-0">{{ t('accounts.listTitle') }}</h2>

            <!-- Search -->
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">search</span>
              <input
                v-model="searchQuery"
                class="field-input pl-11"
                :placeholder="t('accounts.searchPlaceholder')"
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
                <AppButton variant="secondary" size="sm" @click="fetchAccounts">{{ t('common.retry') }}</AppButton>
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
                      :aria-label="t('accounts.deleteAriaLabel')"
                      @click.stop="requestDeleteAccount(account.id)"
                    />
                    <span v-if="account.id === activeAccountId" class="material-symbols-outlined text-primary">chevron_right</span>
                  </div>
                </div>

                <div v-if="!filteredAccounts.length && !isLoading" class="py-6 text-center">
                  <p class="text-sm text-muted">{{ t('accounts.listEmpty') }}</p>
                </div>
              </template>

              <button
                class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line p-3 text-sm font-semibold text-muted transition-all hover:border-primary hover:text-primary"
                @click="startCreating"
              >
                <span class="material-symbols-outlined text-[20px]">add</span>
                {{ t('accounts.newAccountButton') }}
              </button>
            </div>
          </div>
        </aside>

        <!-- Configuration Panel (Detail) -->
        <div class="col-span-12 flex flex-col gap-6 md:col-span-8 lg:col-span-9">
          <div class="surface-card flex flex-1 flex-col overflow-hidden p-0">
            <!-- Tabs -->
            <div class="border-b border-line p-4 lg:px-8">
              <AppTabs v-model="activeTab" :tabs="tabs" />
            </div>

            <!-- General -->
            <div v-if="activeTab === 'general'" class="flex-1 overflow-y-auto p-6 lg:p-8">
              <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
                <!-- Left -->
                <div class="flex flex-col gap-5">
                  <div>
                    <label class="field-label">{{ t('accounts.fields.nameLabel') }}</label>
                    <input v-model="selectedAccount.name" class="field-input" type="text" :placeholder="t('accounts.fields.namePlaceholder')" />
                  </div>
                  <div>
                    <label class="field-label">{{ t('accounts.fields.typeLabel') }}</label>
                    <select v-model="selectedAccount.type" class="field-input">
                      <option value="NO_TYPE">{{ t('accounts.accountTypes.noType') }}</option>
                      <option value="BANK">{{ t('accounts.accountTypes.bank') }}</option>
                      <option value="CASH">{{ t('accounts.accountTypes.cash') }}</option>
                      <option value="ASSET">{{ t('accounts.accountTypes.asset') }}</option>
                      <option value="CREDIT_CARD">{{ t('accounts.accountTypes.creditCard') }}</option>
                      <option value="LIABILITY">{{ t('accounts.accountTypes.liability') }}</option>
                      <option value="CHECKING">{{ t('accounts.accountTypes.checking') }}</option>
                      <option value="SAVINGS">{{ t('accounts.accountTypes.savings') }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="field-label">{{ t('accounts.fields.institutionLabel') }}</label>
                    <div class="relative">
                      <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">account_balance</span>
                      <input v-model="selectedAccount.institution" class="field-input pl-11" type="text" />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="field-label">{{ t('accounts.fields.accountNumberLabel') }}</label>
                      <input v-model="selectedAccount.accountNumber" class="field-input" :placeholder="t('accounts.fields.accountNumberPlaceholder')" type="text" />
                    </div>
                    <div>
                      <label class="field-label">{{ t('accounts.fields.currencyLabel') }}</label>
                      <select v-model="selectedAccount.currencyId" class="field-input">
                        <option v-for="c in userCurrencies" :key="c.currencyId" :value="c.currencyId">
                          {{ c.code }} ({{ c.symbol }})
                        </option>
                      </select>
                    </div>
                  </div>
                  <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-4">
                    <input v-model="selectedAccount.closed" class="size-5 rounded border-line" type="checkbox" />
                    <span class="text-sm font-semibold text-content">{{ t('accounts.fields.closedLabel') }}</span>
                    <span class="material-symbols-outlined ml-auto cursor-help text-[20px] text-faint">info</span>
                  </label>
                </div>

                <!-- Right -->
                <div class="flex flex-col gap-5">
                  <div>
                    <label class="field-label">{{ t('accounts.fields.groupLabel') }}</label>
                    <input v-model="selectedAccount.groupName" class="field-input" type="text" />
                  </div>
                  <div>
                    <label class="field-label">{{ t('accounts.fields.startBalanceLabel') }}</label>
                    <div class="relative">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-faint">$</span>
                      <input v-model="selectedAccount.startBalance" class="field-input pl-8" type="number" />
                    </div>
                  </div>
                  <div v-if="!isCreating">
                    <label class="field-label">{{ t('accounts.fields.currentBalanceLabel') }}</label>
                    <div class="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5">
                      <AnimatedAmount :value="currentBalanceDisplay" size="md" :show-sign="false" />
                    </div>
                    <p class="mt-1 text-xs text-muted">{{ t('accounts.fields.currentBalanceHint') }}</p>
                  </div>
                  <div>
                    <label class="field-label">{{ t('accounts.fields.iconLabel') }}</label>
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
                          :placeholder="t('accounts.iconPicker.searchPlaceholder')"
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
                            {{ t('accounts.iconPicker.loadMore', { count: filteredIcons.length - displayedIcons.length }) }}
                          </button>
                        </div>
                        <div v-if="filteredIcons.length === 0" class="py-8 text-center text-sm text-muted">
                          {{ t('accounts.iconPicker.noResults', { query: iconSearch }) }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex-1">
                    <label class="field-label">{{ t('accounts.fields.notesLabel') }}</label>
                    <textarea
                      v-model="selectedAccount.notes"
                      class="field-input h-full min-h-[120px] resize-none"
                      :placeholder="t('accounts.fields.notesPlaceholder')"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- Behaviour -->
            <div v-if="activeTab === 'behaviour'" class="flex-1 overflow-y-auto p-6 lg:p-8">
              <div class="flex flex-col gap-8">
                <div>
                  <label class="field-label">{{ t('accounts.behaviour.defaultTemplateLabel') }}</label>
                  <select v-model="selectedAccountBehaviour.defaultTemplate" class="field-input max-w-sm">
                    <option value="NONE">{{ t('accounts.behaviour.templates.none') }}</option>
                    <option value="STANDARD_TRANSACTIONS">{{ t('accounts.behaviour.templates.standard') }}</option>
                    <option value="INCOME_TRACKING">{{ t('accounts.behaviour.templates.income') }}</option>
                    <option value="EXPENSE_TRACKING">{{ t('accounts.behaviour.templates.expense') }}</option>
                  </select>
                  <p class="mt-2 text-xs text-muted">{{ t('accounts.behaviour.templateHint') }}</p>
                </div>

                <div class="flex flex-col gap-4">
                  <label class="field-label">{{ t('accounts.behaviour.reportExclusionLabel') }}</label>
                  <div class="flex max-w-md flex-col gap-3">
                    <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 transition-all hover:bg-surface">
                      <input v-model="selectedAccountBehaviour.excludeFromAccountSummary" class="size-5 rounded border-line" type="checkbox" />
                      <div>
                        <span class="text-sm font-semibold text-content">{{ t('accounts.behaviour.checks.excludeSummary') }}</span>
                        <p class="mt-0.5 text-xs text-muted">{{ t('accounts.behaviour.checks.excludeSummaryHint') }}</p>
                      </div>
                    </label>
                    <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 transition-all hover:bg-surface">
                      <input v-model="selectedAccountBehaviour.outlineIntoSummary" class="size-5 rounded border-line" type="checkbox" />
                      <div>
                        <span class="text-sm font-semibold text-content">{{ t('accounts.behaviour.checks.outlineSummary') }}</span>
                        <p class="mt-0.5 text-xs text-muted">{{ t('accounts.behaviour.checks.outlineSummaryHint') }}</p>
                      </div>
                    </label>
                    <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 transition-all hover:bg-surface">
                      <input v-model="selectedAccountBehaviour.excludeFromBudget" class="size-5 rounded border-line" type="checkbox" />
                      <div>
                        <span class="text-sm font-semibold text-content">{{ t('accounts.behaviour.checks.excludeBudget') }}</span>
                        <p class="mt-0.5 text-xs text-muted">{{ t('accounts.behaviour.checks.excludeBudgetHint') }}</p>
                      </div>
                    </label>
                    <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 transition-all hover:bg-surface">
                      <input v-model="selectedAccountBehaviour.excludeFromAnyReports" class="size-5 rounded border-line" type="checkbox" />
                      <div>
                        <span class="text-sm font-semibold text-content">{{ t('accounts.behaviour.checks.excludeReports') }}</span>
                        <p class="mt-0.5 text-xs text-muted">{{ t('accounts.behaviour.checks.excludeReportsHint') }}</p>
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
                  <label class="field-label">{{ t('accounts.misc.balanceLimitsLabel') }}</label>
                  <div class="grid max-w-md grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">{{ t('accounts.misc.overdraftLabel') }}</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('overdraftAt')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input v-model="selectedAccountMisc.overdraftAt" class="field-input text-center" type="number" step="0.01" />
                        <button @click="increment('overdraftAt')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-muted">{{ t('accounts.misc.overdraftHint') }}</p>
                    </div>
                    <div>
                      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">{{ t('accounts.misc.maximumLabel') }}</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('maximumBalance')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input v-model="selectedAccountMisc.maximumBalance" class="field-input text-center" type="number" step="0.01" />
                        <button @click="increment('maximumBalance')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-muted">{{ t('accounts.misc.maximumHint') }}</p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-4">
                  <label class="field-label">{{ t('accounts.misc.checkNumberLabel') }}</label>
                  <div class="grid max-w-md grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">{{ t('accounts.misc.checkbook1Label') }}</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('checkbook1')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input v-model="selectedAccountMisc.checkbook1" class="field-input text-center" type="number" />
                        <button @click="increment('checkbook1')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-muted">{{ t('accounts.misc.checkbook1Hint') }}</p>
                    </div>
                    <div>
                      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">{{ t('accounts.misc.checkbook2Label') }}</label>
                      <div class="flex items-center gap-2">
                        <button @click="decrement('checkbook2')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input v-model="selectedAccountMisc.checkbook2" class="field-input text-center" type="number" />
                        <button @click="increment('checkbook2')" class="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted transition-all hover:bg-line">
                          <span class="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <p class="mt-1 text-xs text-muted">{{ t('accounts.misc.checkbook2Hint') }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="flex items-center justify-end border-t border-line bg-surface-2/40 p-6 lg:px-8">
              <AppButton :loading="isSaving" trailing-icon="check" @click="saveChanges">
                {{ isCreating ? t('accounts.saveButton.create') : t('accounts.saveButton.update') }}
              </AppButton>
            </div>
          </div>

          <!-- Contextual Insight -->
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div class="flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:col-span-2">
              <span class="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">lightbulb</span>
              <div>
                <h4 class="mb-1 text-sm font-bold text-content">{{ t('accounts.tip.title') }}</h4>
                <i18n-t keypath="accounts.tip.body" tag="p" class="text-sm leading-relaxed text-muted">
                  <template #balance><strong>{{ t('accounts.tip.balanceWord') }}</strong></template>
                </i18n-t>
              </div>
            </div>
            <div class="surface-card flex flex-col items-center justify-center p-6 text-center">
              <p class="field-label !mb-1">{{ t('accounts.lastUpdatedLabel') }}</p>
              <p class="text-lg font-bold text-content">{{ formattedLastUpdated }}</p>
            </div>
          </div>
        </div>
        </div>
      </PageContainer>
    </main>

    <ConfirmDialog
      :is-open="confirmDeleteId !== null"
      :title="t('accounts.deleteDialog.title')"
      :message="t('accounts.deleteDialog.message')"
      @confirm="confirmDeleteAccount"
      @cancel="confirmDeleteId = null"
    />
  </div>
</template>
