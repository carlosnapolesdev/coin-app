<script setup lang="ts">
import axios from 'axios'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import TopHeader from './common/TopHeader.vue'
import api from '../services/api'

const router = useRouter()
const currentStep = ref(1) // 1: Create Account, 2: Choose Currencies, 3: Choose Categories, 4: Finish
const isSubmitting = ref(false)
const isPasswordVisible = ref(false)
const registrationCompleted = ref(false)
const submissionError = ref('')
const form = reactive({
  fullName: '',
  email: '',
  password: '',
})
const fieldErrors = reactive<Record<string, string>>({})

const resetFieldErrors = () => {
  for (const key of Object.keys(fieldErrors)) {
    delete fieldErrors[key]
  }
}

const clearFieldError = (field: 'fullName' | 'email' | 'password') => {
  delete fieldErrors[field]
  submissionError.value = ''
}

const registerAccount = () => {
  // Validates form data before proceeding to step 2
  // Actual API call happens in completeRegistration() after all steps are completed
  resetFieldErrors()

  // Basic validation
  if (!form.fullName) {
    fieldErrors.fullName = 'Full name is required'
    return false
  }
  if (!form.email) {
    fieldErrors.email = 'Email is required'
    return false
  }
  if (!form.password || form.password.length < 8) {
    fieldErrors.password = 'Password must be at least 8 characters'
    return false
  }

  registrationCompleted.value = true
  currentStep.value = 2
  return true
}

const completeRegistration = async () => {
  resetFieldErrors()
  submissionError.value = ''
  isSubmitting.value = true

  try {
    await api.post('/auth/register', {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      language: navigator.language,
    })

    currentStep.value = 4
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as {
        message?: string
        validationErrors?: Record<string, string>
      } | undefined

      if (responseData?.validationErrors) {
        Object.assign(fieldErrors, responseData.validationErrors)
      }

      submissionError.value = responseData?.message ?? 'Unable to create your account right now.'
      return
    }

    submissionError.value = 'Unexpected error while creating your account.'
  } finally {
    isSubmitting.value = false
  }
}

const handleBack = () => {
  if (isSubmitting.value) {
    return
  }

  if (currentStep.value > 1) {
    currentStep.value--
  } else {
    router.push('/login')
  }
}

const handleNext = async () => {
  if (currentStep.value === 1) {
    if (registrationCompleted.value) {
      currentStep.value = 2
      return
    }

    registerAccount()
    return
  }

  if (currentStep.value < 4) {
    currentStep.value++
  } else {
    // Final step - complete the full registration
    await completeRegistration()
    if (!submissionError.value) {
      router.push({
        path: '/login',
        query: {
          email: form.email,
          registered: '1',
        },
      })
    }
  }
}

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
    <TopHeader />
    
    <div class="flex flex-1 relative overflow-hidden">
      <!-- Sidebar Navigation -->
      <aside class="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-8 hidden lg:flex z-40">
        <!-- Progress Header -->
        <div class="mb-12">
          <p class="text-xs text-primary font-bold uppercase tracking-widest mb-2">Registration Progress</p>
          <div class="flex items-center gap-2 mb-4">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              {{ currentStep === 4 ? 'All steps completed!' : `Step ${currentStep} of 4` }}
            </h2>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              class="bg-primary h-full rounded-full transition-all duration-500"
              :style="{ width: `${(currentStep / 4) * 100}%` }"
            ></div>
          </div>
        </div>

        <nav class="space-y-6">
          <!-- Step 1: Create Account -->
          <div class="flex items-center gap-4">
            <div :class="[
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
              currentStep > 1 ? 'bg-primary/20 text-primary border-2 border-primary' : (currentStep === 1 ? 'bg-primary text-slate-900 shadow-lg shadow-primary/30' : 'border-2 border-slate-200 dark:border-slate-700 text-slate-400')
            ]">
              <span class="material-symbols-outlined text-sm">{{ currentStep > 1 ? 'check' : 'person_add' }}</span>
            </div>
            <span :class="['font-medium transition-colors', currentStep === 1 ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400']">Create Account</span>
          </div>

          <!-- Step 2: Choose Currencies -->
          <div class="flex items-center gap-4">
            <div :class="[
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
              currentStep > 2 ? 'bg-primary/20 text-primary border-2 border-primary' : (currentStep === 2 ? 'bg-primary text-slate-900 shadow-lg shadow-primary/30' : 'border-2 border-slate-200 dark:border-slate-700 text-slate-400')
            ]">
              <span class="material-symbols-outlined text-sm">{{ currentStep > 2 ? 'check' : 'payments' }}</span>
            </div>
            <span :class="['font-medium transition-colors', currentStep === 2 ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400']">Choose Currencies</span>
          </div>

          <!-- Step 3: Choose Categories -->
          <div class="flex items-center gap-4">
            <div :class="[
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
              currentStep > 3 ? 'bg-primary/20 text-primary border-2 border-primary' : (currentStep === 3 ? 'bg-primary text-slate-900 shadow-lg shadow-primary/30' : 'border-2 border-slate-200 dark:border-slate-700 text-slate-400')
            ]">
              <span class="material-symbols-outlined text-sm">{{ currentStep > 3 ? 'check' : 'category' }}</span>
            </div>
            <span :class="['font-medium transition-colors', currentStep === 3 ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400']">Choose Categories</span>
          </div>

          <!-- Step 4: Finish -->
          <div class="flex items-center gap-4">
            <div :class="[
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
              currentStep === 4 ? 'bg-primary text-slate-900 shadow-lg shadow-primary/30' : 'border-2 border-slate-200 dark:border-slate-700 text-slate-400'
            ]">
              <span class="material-symbols-outlined text-sm">flag</span>
            </div>
            <span :class="['font-medium transition-colors', currentStep === 4 ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400']">Finish</span>
          </div>
        </nav>

        <div class="mt-auto p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p class="text-xs text-primary font-bold mb-1">PRO TIP</p>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            {{ 
              currentStep === 1 ? 'You can always update your personal information later in your account settings.' : 
              currentStep === 2 ? 'You can always add more currencies later in your account settings.' :
              currentStep === 3 ? 'You can customize your categories anytime to better track your spending.' :
              'Explore the dashboard to see your financial health in real-time!'
            }}
          </p>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col relative min-h-screen overflow-y-auto">
        <!-- Step 1: Create Account Content -->
        <template v-if="currentStep === 1">
          <header class="p-8 lg:px-16 pt-12 mx-auto w-full max-w-4xl text-center lg:text-left">
            <div class="max-w-3xl mx-auto lg:mx-0">
              <h2 class="text-4xl font-black text-slate-900 dark:text-white mb-4">Create Your Account</h2>
              <p class="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                Please enter your personal information to get started. This helps us personalize your experience.
              </p>
            </div>
          </header>

          <section class="px-8 lg:px-16 pb-32 w-full max-w-4xl mx-auto space-y-8">
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm max-w-2xl mx-auto lg:mx-0">
              <form class="space-y-6" @submit.prevent="handleNext">
                <!-- Full Name -->
                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide" for="full_name">Full Name</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <span class="material-symbols-outlined">badge</span>
                    </div>
                    <input v-model.trim="form.fullName" @input="clearFieldError('fullName')" class="block w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100" id="full_name" placeholder="John Doe" type="text"/>
                  </div>
                  <p v-if="fieldErrors.fullName" class="mt-2 text-sm text-red-500">{{ fieldErrors.fullName }}</p>
                </div>
                <!-- Email Address -->
                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide" for="email">Email Address</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <span class="material-symbols-outlined">mail</span>
                    </div>
                    <input v-model.trim="form.email" @input="clearFieldError('email')" class="block w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100" id="email" placeholder="john@example.com" type="email"/>
                  </div>
                  <p v-if="fieldErrors.email" class="mt-2 text-sm text-red-500">{{ fieldErrors.email }}</p>
                </div>
                <!-- Password -->
                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide" for="password">Password</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <span class="material-symbols-outlined">lock</span>
                    </div>
                    <input v-model="form.password" @input="clearFieldError('password')" class="block w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100" id="password" placeholder="••••••••" :type="isPasswordVisible ? 'text' : 'password'"/>
                    <button @click="togglePasswordVisibility" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600" type="button">
                      <span class="material-symbols-outlined">{{ isPasswordVisible ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                  </div>
                  <p class="mt-3 text-xs text-slate-500 italic">Must be at least 8 characters with a mix of letters and numbers.</p>
                  <p v-if="fieldErrors.password" class="mt-2 text-sm text-red-500">{{ fieldErrors.password }}</p>
                </div>
                <p v-if="submissionError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                  {{ submissionError }}
                </p>
                <button class="hidden" type="submit">Create account</button>
              </form>
            </div>

            <!-- Helper Visual Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto lg:mx-0">
              <div class="bg-primary/5 border border-primary/10 p-5 rounded-xl flex items-center gap-4">
                <div class="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-primary shadow-sm">
                  <span class="material-symbols-outlined">shield</span>
                </div>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Secure, encrypted data storage</p>
              </div>
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 shadow-sm">
                <div class="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                  <span class="material-symbols-outlined">speed</span>
                </div>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-300">30 second quick setup</p>
              </div>
            </div>
          </section>
        </template>

        <!-- Step 2: Choose Currencies Content -->
        <template v-else-if="currentStep === 2">
          <header class="p-8 lg:px-16 pt-12 mx-auto w-full max-w-4xl text-center lg:text-left">
            <div class="max-w-3xl mx-auto lg:mx-0">
              <h2 class="text-4xl font-black text-slate-900 dark:text-white mb-4">Choose Currencies</h2>
              <p class="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                CoinFlow supports multiple currencies. Set your primary base currency and add any additional currencies you'll be using.
              </p>
            </div>
          </header>

          <section class="px-8 lg:px-16 pb-32 w-full max-w-4xl mx-auto space-y-10">
            <!-- Base Currency Section -->
            <div class="max-w-2xl mx-auto lg:mx-0">
              <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Base Currency</h3>
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <span class="material-symbols-outlined text-3xl">attach_money</span>
                  </div>
                  <div class="text-left">
                    <h4 class="text-xl font-bold text-slate-900 dark:text-white">USD (US Dollar)</h4>
                    <p class="text-slate-500">Primary base currency for all transactions</p>
                  </div>
                </div>
                <button class="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors">
                  Change
                </button>
              </div>
            </div>

            <!-- Additional Currencies Section -->
            <div class="max-w-2xl mx-auto lg:mx-0 text-left">
              <div class="flex items-center gap-3 mb-6">
                <label class="relative flex items-center cursor-pointer">
                  <input checked class="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-700 text-primary focus:ring-primary focus:ring-offset-0 bg-transparent transition-all" type="checkbox"/>
                  <span class="ml-3 text-lg font-semibold text-slate-800 dark:text-slate-200">Setup additional currencies</span>
                </label>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Currency Card 1 -->
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between group">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <span class="material-symbols-outlined">payments</span>
                    </div>
                    <div>
                      <p class="font-bold text-slate-900 dark:text-white">UYU</p>
                      <p class="text-xs text-slate-500">Peso Uruguayo</p>
                    </div>
                  </div>
                  <button class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
                <!-- Add Button -->
                <button class="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 p-5 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-primary transition-all group">
                  <span class="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
                  <span class="font-semibold">Add Currency</span>
                </button>
              </div>
            </div>

            <!-- Illustration or Helper Card -->
            <div class="bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-2xl border border-primary/20 flex items-start gap-4 max-w-2xl mx-auto lg:mx-0 text-left">
              <span class="material-symbols-outlined text-primary mt-1">info</span>
              <div>
                <p class="text-slate-700 dark:text-slate-300 font-medium">Multiple currencies allow you to track offshore accounts and international investments with live exchange rates updated daily.</p>
              </div>
            </div>
          </section>
        </template>

        <!-- Step 3: Choose Categories Content -->
        <template v-else-if="currentStep === 3">
          <header class="p-8 lg:px-16 pt-12 mx-auto w-full max-w-4xl text-center lg:text-left">
            <div class="max-w-3xl mx-auto lg:mx-0">
              <h2 class="text-4xl font-black text-slate-900 dark:text-white mb-4">Choose Categories</h2>
              <p class="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                CoinFlow can prefill your file with a standard set of categories based on your preferred language.
              </p>
            </div>
          </header>

          <section class="px-8 lg:px-16 pb-32 w-full max-w-4xl mx-auto space-y-8">
            <!-- Configuration Section -->
            <div class="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-3xl">
              <div class="flex items-center gap-4">
                <div class="bg-primary/10 p-3 rounded-xl">
                  <span class="material-symbols-outlined text-primary">translate</span>
                </div>
                <div class="text-left">
                  <p class="font-bold text-slate-900 dark:text-white">Setup categories for my language</p>
                  <p class="text-sm text-slate-500">Automatically populate common categories</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer ml-4">
                  <input checked class="sr-only peer" type="checkbox" value=""/>
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              <div class="flex flex-col gap-1 min-w-[200px] text-left">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Preset file</label>
                <div class="relative">
                  <select class="appearance-none w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white">
                    <option>English (Standard)</option>
                    <option>Spanish (Estandar)</option>
                    <option>French (Standard)</option>
                    <option>German (Standard)</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">unfold_more</span>
                </div>
              </div>
            </div>

            <!-- Categories Grid -->
            <div class="flex flex-col gap-6 max-w-3xl">
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">Included Categories</h3>
                <span class="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">8 Categories selected</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Category Card: Automobile -->
                <div class="p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all bg-white dark:bg-slate-900 text-left">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="size-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined">directions_car</span>
                      </div>
                      <h4 class="font-bold text-lg text-slate-900 dark:text-white">Automobile</h4>
                    </div>
                    <input checked class="rounded-full w-5 h-5 text-primary border-slate-300 focus:ring-primary/30" type="checkbox"/>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <span class="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-500">Fuel</span>
                    <span class="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-500">Maintenance</span>
                    <span class="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-500">Parking</span>
                  </div>
                </div>
                <!-- Category Card: Bank Charges -->
                <div class="p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all bg-white dark:bg-slate-900 text-left">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="size-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined">account_balance</span>
                      </div>
                      <h4 class="font-bold text-lg text-slate-900 dark:text-white">Bank Charges</h4>
                    </div>
                    <input checked class="rounded-full w-5 h-5 text-primary border-slate-300 focus:ring-primary/30" type="checkbox"/>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <span class="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-500">Fees</span>
                    <span class="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-500">Interest</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>

        <!-- Step 4: Finish Content -->
        <template v-else-if="currentStep === 4">
          <section class="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 text-center max-w-3xl mx-auto">
            <div class="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-slate-900 mb-8 shadow-2xl shadow-primary/40 animate-bounce">
              <span class="material-symbols-outlined text-5xl font-bold">task_alt</span>
            </div>
            
            <h2 class="text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">You're All Set!</h2>
            
            <p class="text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-12">
              Welcome to the family. Your account has been successfully created and your personal financial workspace is ready for you.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
              <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span class="material-symbols-outlined text-primary mb-3">verified_user</span>
                <p class="font-bold text-slate-900 dark:text-white">Account Active</p>
                <p class="text-xs text-slate-500 mt-1">Security & Encryption On</p>
              </div>
              <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span class="material-symbols-outlined text-primary mb-3">currency_exchange</span>
                <p class="font-bold text-slate-900 dark:text-white">Multi-Currency</p>
                <p class="text-xs text-slate-500 mt-1">Real-time Rates Loaded</p>
              </div>
              <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span class="material-symbols-outlined text-primary mb-3">dashboard_customize</span>
                <p class="font-bold text-slate-900 dark:text-white">Smart Categories</p>
                <p class="text-xs text-slate-500 mt-1">Personalized Tracking</p>
              </div>
            </div>

            <button 
              @click="handleNext"
              class="group relative px-12 py-5 bg-primary text-slate-900 font-black text-xl rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center gap-4"
            >
              Create Account
              <span class="material-symbols-outlined group-hover:translate-x-2 transition-transform font-bold">rocket_launch</span>
            </button>
            
            <p class="mt-8 text-sm text-slate-400 font-medium">
              Need help? Check out our <a href="#" class="text-primary hover:underline">Getting Started guide</a>.
            </p>
          </section>
        </template>

        <!-- Bottom Navigation Bar (Hidden on last step as we have a main CTA) -->
        <footer 
          v-if="currentStep < 4"
          class="fixed bottom-0 right-0 left-0 lg:left-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-6 z-30"
        >
          <div class="max-w-4xl mx-auto flex items-center justify-between">
            <button @click="handleBack" :disabled="isSubmitting" class="px-6 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60">
              Cancel
            </button>
            <div class="flex items-center gap-4">
              <button @click="handleBack" :disabled="isSubmitting" class="px-8 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
                <span class="material-symbols-outlined text-sm">arrow_back</span>
                {{ currentStep === 1 ? 'Back' : 'Previous' }}
              </button>
              <button @click="handleNext" :disabled="isSubmitting" class="px-10 py-3 bg-primary text-slate-900 font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
                {{ isSubmitting ? 'Creating account...' : 'Next Step' }}
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>

    <!-- Mobile Navigation Toggle -->
    <div class="lg:hidden fixed bottom-24 right-4 z-50">
      <button class="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-lg">
        <span class="material-symbols-outlined">menu</span>
      </button>
    </div>
  </div>
</template>
