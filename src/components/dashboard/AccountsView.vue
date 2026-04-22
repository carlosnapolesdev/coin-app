<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'

const searchQuery = ref('')
const activeTab = ref<'general' | 'behaviour' | 'misc'>('general')
const activeAccountId = ref<number | null>(1)

interface Account {
  id: number
  name: string
  institution: string
  type: string
  icon: string
  isActive: boolean
}

const accounts = ref<Account[]>([
  { id: 1, name: 'Main Savings', institution: 'Chase Bank', type: 'checking', icon: 'account_balance', isActive: true },
  { id: 2, name: 'Daily Credit', institution: 'Amex Gold', type: 'credit', icon: 'credit_card', isActive: false },
  { id: 3, name: 'Emergency Fund', institution: 'Ally Savings', type: 'savings', icon: 'savings', isActive: false },
])

const selectedAccount = ref({
  name: 'Main Savings',
  type: '(no type)',
  institution: 'Chase Bank',
  accountNumber: '**** 4829',
  currency: 'USD ($)',
  group: 'Personal Finances',
  startBalance: '12500.00',
  notes: '',
  closed: false,
})

// Behaviour tab
const selectedAccountBehaviour = ref({
  defaultTemplate: '(none)',
  excludeFromAccountSummary: false,
  outlineIntoSummary: false,
  excludeFromBudget: false,
  excludeFromAnyReports: false,
})

// Misc tab
const selectedAccountMisc = ref({
  overdraftAt: 0.00,
  maximum: 0.00,
  checkbook1: 0,
  checkbook2: 0,
})

const tabs = ['General', 'Behaviour', 'Misc'] as const

const decrement = (field: 'overdraftAt' | 'maximum' | 'checkbook1' | 'checkbook2') => {
  if (field === 'overdraftAt' || field === 'maximum') {
    selectedAccountMisc.value[field] = Math.max(0, parseFloat(String(selectedAccountMisc.value[field])) - 0.01)
  } else {
    selectedAccountMisc.value[field] = Math.max(0, selectedAccountMisc.value[field] - 1)
  }
}

const increment = (field: 'overdraftAt' | 'maximum' | 'checkbook1' | 'checkbook2') => {
  if (field === 'overdraftAt' || field === 'maximum') {
    selectedAccountMisc.value[field] = parseFloat(String(selectedAccountMisc.value[field])) + 0.01
  } else {
    selectedAccountMisc.value[field] = selectedAccountMisc.value[field] + 1
  }
}

const selectAccount = (id: number) => {
  activeAccountId.value = id
}

const deleteAccount = (id: number) => {
  accounts.value = accounts.value.filter(a => a.id !== id)
  if (activeAccountId.value === id) activeAccountId.value = accounts.value[0]?.id ?? null
}

const handleTabChange = (tab: string) => {
  if (tab === 'General') activeTab.value = 'general'
  else if (tab === 'Behaviour') activeTab.value = 'behaviour'
  else activeTab.value = 'misc'
}
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
              <div
                v-for="account in accounts"
                :key="account.id"
                class="flex items-center justify-between w-full p-4 rounded-xl transition-all cursor-pointer"
                :class="account.isActive ? 'bg-primary/10 border-r-4 border-primary' : 'hover:bg-slate-100'"
                @click="selectAccount(account.id)"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center"
                    :class="account.isActive ? 'bg-primary text-black' : 'bg-slate-100 text-slate-500'"
                  >
                    <span class="material-symbols-outlined">{{ account.icon }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ account.name }}</p>
                    <p class="text-[10px] uppercase font-black tracking-wider text-slate-400">{{ account.institution }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    @click.stop="deleteAccount(account.id)"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                  <span v-if="account.isActive" class="material-symbols-outlined text-primary">chevron_right</span>
                </div>
              </div>
              <button class="mt-4 flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-all text-sm font-bold">
                <span class="material-symbols-outlined">add</span>
                New Account
              </button>
            </div>
          </div>
          <!-- Profile Overview Card (hidden temporarily)
          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
            <img
              class="w-12 h-12 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcGBlBVmxs2unQWlNWQHHpHNWXPe7Y5fpBSPUYOPuMWSPx1WIwcVYP0JQdKhQall_QyBwBju2W42hQxCBxTBMFJi6GWyWcMv7cmWPjgWBm726rAgtFa0BqwnP4ruucelxL92EcWtU3B8yli7vl2Re0Mbsqm11j5L0xnIoETA8dVvggXqMc5n70f_octssYXvJjL9fs-84iTXFD8sCspEINA2uAb_s0IWk4fVA7GegM9STH1-2iwtDBpzsTipgqxsOPtRlhRWj5fiww"
              alt="User profile"
            />
            <div>
              <p class="text-sm font-black text-slate-900">Alex Sterling</p>
              <p class="text-[10px] uppercase tracking-widest text-slate-400">Premium Member</p>
            </div>
            <button class="ml-auto material-symbols-outlined text-slate-400 hover:text-slate-600">logout</button>
          </div> -->
        </aside>

        <!-- Configuration Panel (Detail) -->
        <div class="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-6">
          <div class="bg-white rounded-xl shadow-lg shadow-slate-200/40 border border-slate-200 flex flex-col flex-1 overflow-hidden">
            <!-- Tab Header -->
            <div class="flex items-center border-b border-slate-200 px-8 pt-6">
              <button
                v-for="(tab, index) in tabs"
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
                      <option>(no type)</option>
                      <option>Bank</option>
                      <option>Cash</option>
                      <option>Asset</option>
                      <option>Credit Card</option>
                      <option>Liability</option>
                      <option>Checking</option>
                      <option>Savings</option>
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
                      <select v-model="selectedAccount.currency" class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all">
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
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
                      v-model="selectedAccount.group"
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
                  <div class="group flex-1">
                    <label class="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Notes</label>
                    <textarea
                      v-model="selectedAccount.notes"
                      class="w-full h-full min-h-[150px] bg-slate-100 border-none rounded-xl py-4 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary transition-all resize-none"
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
                    <option>(none)</option>
                    <option>Standard Transactions</option>
                    <option>Income Tracking</option>
                    <option>Expense Tracking</option>
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
                        <button @click="decrement('maximum')" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
                          <span class="material-symbols-outlined">remove</span>
                        </button>
                        <input
                          v-model="selectedAccountMisc.maximum"
                          class="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-slate-900 font-medium text-center focus:ring-2 focus:ring-primary transition-all"
                          type="number"
                          step="0.01"
                        />
                        <button @click="increment('maximum')" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
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
              <button class="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-[12px] shadow-lg shadow-primary/20 hover:scale-95 active:scale-90 transition-all">
                Save Changes
                <span class="material-symbols-outlined text-lg">check</span>
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
              <p class="text-lg font-black text-slate-900">Oct 24, 2023</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>