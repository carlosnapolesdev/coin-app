<script setup lang="ts">
import axios from 'axios'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import TopHeader from './common/TopHeader.vue'
import CurrencyModal from './dashboard/CurrencyModal.vue'
import LegalFooter from './legal/LegalFooter.vue'
import GoogleSignInButton from './GoogleSignInButton.vue'
import RegisterStepper from './RegisterStepper.vue'
import { AppButton } from './ui'
import api from '../services/api'
import { useLocale } from '../composables/useLocale'
import { LEGAL_ROUTE_PATHS } from '../content/legal'
import { validateRegisterStep1 } from '../utils/registerValidation'
import { logError } from '../utils/logError'
import { isExpectedApiRejection } from '../utils/expectedApiRejection'

const router = useRouter()
const { t } = useI18n()
const { locale: selectedLanguage, setLocale } = useLocale()
const currentStep = ref(1) // 1: Create Account, 2: Choose Currencies, 3: Choose Categories, 4: Finish
const isSubmitting = ref(false)
const isPasswordVisible = ref(false)
const registrationCompleted = ref(false)
const submissionError = ref('')
const acceptedLegal = ref(false)

// Step 2: Currencies
interface Currency {
  id: number
  code: string
  name: string
  symbol: string
}
const setupAdditionalCurrencies = ref(false)
const additionalCurrencies = ref<string[]>([])
const availableCurrencies = ref<Currency[]>([])
const isLoadingCurrencies = ref(false)
const isCurrencyModalOpen = ref(false)

const fetchAvailableCurrencies = async () => {
  isLoadingCurrencies.value = true
  try {
    const response = await api.get<Currency[]>('/currencies')
    availableCurrencies.value = response.data
  } catch (err) {
    logError('register.fetchAvailableCurrencies', err)
  } finally {
    isLoadingCurrencies.value = false
  }
}

const openCurrencyModal = () => {
  isCurrencyModalOpen.value = true
}

const handleCurrencySelect = (currencies: string[]) => {
  additionalCurrencies.value = currencies
  isCurrencyModalOpen.value = false
}

const removeCurrency = (code: string) => {
  additionalCurrencies.value = additionalCurrencies.value.filter(c => c !== code)
}

// Step 3: Categories
type CategoryType = 'EXPENSE' | 'INCOME'

interface Category {
  id: number
  name: string
  type: CategoryType
  icon: string
  parentId: number | null
  children: Category[]
}

const categories = ref<Category[]>([])
const isLoadingCategories = ref(false)
const categoriesError = ref('')
const expandedCategories = ref<number[]>([])
const activeFilter = ref<'EXPENSE' | 'INCOME'>('EXPENSE')
const selectedCategoryIds = ref<Set<number>>(new Set())

const getCategoryState = (category: Category): 'selected' | 'indeterminate' | 'none' => {
  if (category.children.length === 0) {
    return selectedCategoryIds.value.has(category.id) ? 'selected' : 'none'
  }
  const selectedCount = category.children.filter(c => selectedCategoryIds.value.has(c.id)).length
  if (selectedCount === 0) return 'none'
  if (selectedCount === category.children.length) return 'selected'
  return 'indeterminate'
}

const toggleCategory = (category: Category) => {
  const ids = new Set(selectedCategoryIds.value)
  const state = getCategoryState(category)
  if (category.children.length === 0) {
    if (state === 'selected') ids.delete(category.id)
    else ids.add(category.id)
  } else {
    if (state === 'selected') {
      category.children.forEach(child => ids.delete(child.id))
    } else {
      category.children.forEach(child => ids.add(child.id))
    }
  }
  selectedCategoryIds.value = ids
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
]

const fetchCategories = async (language: string) => {
  isLoadingCategories.value = true
  categoriesError.value = ''
  selectedCategoryIds.value = new Set()
  try {
    const response = await api.get<Category[]>('/categories', { params: { language } })
    categories.value = response.data
    // Pre-select all categories by default
    const allLeafIds = new Set<number>()
    for (const category of response.data) {
      if (category.children.length === 0) {
        allLeafIds.add(category.id)
      } else {
        category.children.forEach(child => allLeafIds.add(child.id))
      }
    }
    selectedCategoryIds.value = allLeafIds
    // Expand only the first category by default
    const firstCategory = response.data[0]
    expandedCategories.value = firstCategory ? [firstCategory.id] : []
  } catch (err) {
    logError('register.fetchCategories', err)
    categoriesError.value = t('auth.register.errors.categoriesLoadFailed')
  } finally {
    isLoadingCategories.value = false
  }
}

const toggleExpanded = (categoryId: number) => {
  if (expandedCategories.value.includes(categoryId)) {
    expandedCategories.value = expandedCategories.value.filter(id => id !== categoryId)
  } else {
    expandedCategories.value.push(categoryId)
  }
}

const isExpanded = (categoryId: number) => expandedCategories.value.includes(categoryId)

const handleLanguageChange = (language: 'en' | 'es' | 'pt') => {
  setLocale(language)
  fetchCategories(language)
}

const filteredCategories = computed(() => categories.value.filter(c => c.type === activeFilter.value))

const filteredSelectedCount = computed(() => {
  let count = 0
  for (const category of categories.value) {
    if (category.type !== activeFilter.value) continue
    if (category.children.length === 0) {
      if (selectedCategoryIds.value.has(category.id)) count++
    } else {
      for (const child of category.children) {
        if (selectedCategoryIds.value.has(child.id)) count++
      }
    }
  }
  return count
})

// Load categories when entering step 3
watch(currentStep, (step) => {
  if (step === 3 && categories.value.length === 0) {
    fetchCategories(selectedLanguage.value)
  }
  if (step === 2 && availableCurrencies.value.length === 0) {
    fetchAvailableCurrencies()
  }
}, { immediate: true })

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

const clearFieldError = (field: 'fullName' | 'email' | 'password' | 'acceptedLegal') => {
  delete fieldErrors[field]
  submissionError.value = ''
}

const registerAccount = () => {
  resetFieldErrors()

  const errors = validateRegisterStep1(
    { fullName: form.fullName, email: form.email, password: form.password, acceptedLegal: acceptedLegal.value },
    {
      fullNameRequired: t('auth.register.errors.fullNameRequired'),
      emailRequired: t('auth.register.errors.emailRequired'),
      passwordTooShort: t('auth.register.errors.passwordTooShort'),
      consentRequired: t('auth.register.errors.consentRequired'),
    },
  )
  Object.assign(fieldErrors, errors)
  if (Object.keys(errors).length > 0) return false

  registrationCompleted.value = true
  currentStep.value = 2
  return true
}

const completeRegistration = async () => {
  resetFieldErrors()
  submissionError.value = ''
  isSubmitting.value = true

  try {
    // Build currencies payload
    const currenciesPayload: { currencyId: number; base: boolean; exchangeRate: number }[] = []

    // Add base currency (USD)
    const usdCurrency = availableCurrencies.value.find(c => c.code === 'USD')
    if (usdCurrency) {
      currenciesPayload.push({
        currencyId: usdCurrency.id,
        base: true,
        exchangeRate: 1.0,
      })
    }

    // Add additional currencies (skip duplicates like USD if selected in modal)
    const addedIds = new Set<number>(currenciesPayload.map(c => c.currencyId))
    for (const code of additionalCurrencies.value) {
      const currency = availableCurrencies.value.find(c => c.code === code)
      if (currency && !addedIds.has(currency.id)) {
        currenciesPayload.push({
          currencyId: currency.id,
          base: false,
          exchangeRate: 1.0,
        })
        addedIds.add(currency.id)
      }
    }

    // Build active category IDs: selected leaf nodes + parent nodes with at least one selected child
    const activeCategoryIds: number[] = []
    for (const category of categories.value) {
      if (getCategoryState(category) !== 'none') {
        activeCategoryIds.push(category.id)
      }
      for (const child of category.children) {
        if (selectedCategoryIds.value.has(child.id)) {
          activeCategoryIds.push(child.id)
        }
      }
    }

    await api.post('/auth/register', {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      language: selectedLanguage.value,
      currencies: currenciesPayload,
      categoryIds: activeCategoryIds,
    })

    currentStep.value = 4
  } catch (err) {
    // An already-registered email comes back as a 409 and is shown on the form.
    if (!isExpectedApiRejection(err)) logError('register.completeRegistration', err)

    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as {
        message?: string
        validationErrors?: Record<string, string>
      } | undefined

      if (responseData?.validationErrors) {
        Object.assign(fieldErrors, responseData.validationErrors)
      }

      submissionError.value = responseData?.message ?? t('auth.register.errors.genericSubmit')
      return
    }

    submissionError.value = t('auth.register.errors.unexpected')
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

const steps = computed(() => [
  { n: 1, label: t('auth.register.steps.createAccount'), icon: 'person_add' },
  { n: 2, label: t('auth.register.steps.chooseCurrencies'), icon: 'payments' },
  { n: 3, label: t('auth.register.steps.chooseCategories'), icon: 'category' },
  { n: 4, label: t('auth.register.steps.finish'), icon: 'flag' },
])

const cardMaxWidth = computed(() => {
  switch (currentStep.value) {
    case 1: return 'max-w-md'
    case 3: return 'max-w-3xl'
    default: return 'max-w-2xl'
  }
})

const stepperCurrentLabel = computed(() => {
  const active = steps.value.find(s => s.n === currentStep.value)
  return `${t('auth.register.stepOf', { current: currentStep.value })}${active ? ` · ${active.label}` : ''}`
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ambient bg-ambient--strong font-display">
    <TopHeader />

    <main class="wm-pattern flex flex-1 flex-col items-center overflow-y-auto px-4 py-8 sm:px-6 lg:py-12">
      <RegisterStepper
        v-if="currentStep < 4"
        class="mb-8 lg:mb-10"
        :steps="steps"
        :current-step="currentStep"
        :current-label="stepperCurrentLabel"
      />

      <div class="w-full" :class="cardMaxWidth">
        <template v-if="currentStep === 1">
          <div class="surface-glass rounded-2xl p-8 lg:p-10">
            <div class="mb-8 text-center">
              <h2 class="text-3xl font-bold text-content">{{ t('auth.register.step1.title') }}</h2>
              <p class="mt-2 text-muted">{{ t('auth.register.step1.subtitle') }}</p>
            </div>

            <form class="space-y-5" @submit.prevent="handleNext">
              <div>
                <label class="mb-2 block text-sm font-semibold text-content" for="full_name">{{ t('auth.register.step1.fullNameLabel') }}</label>
                <div class="relative">
                  <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">badge</span>
                  <input id="full_name" v-model.trim="form.fullName" class="field-input pl-11" :placeholder="t('auth.register.step1.fullNamePlaceholder')" type="text" @input="clearFieldError('fullName')" />
                </div>
                <p v-if="fieldErrors.fullName" class="mt-1.5 text-sm text-danger">{{ fieldErrors.fullName }}</p>
              </div>

              <div>
                <label class="mb-2 block text-sm font-semibold text-content" for="email">{{ t('auth.common.emailAddressLabel') }}</label>
                <div class="relative">
                  <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">mail</span>
                  <input id="email" v-model.trim="form.email" class="field-input pl-11" :placeholder="t('auth.register.step1.emailPlaceholder')" type="email" @input="clearFieldError('email')" />
                </div>
                <p v-if="fieldErrors.email" class="mt-1.5 text-sm text-danger">{{ fieldErrors.email }}</p>
              </div>

              <div>
                <label class="mb-2 block text-sm font-semibold text-content" for="password">{{ t('auth.register.step1.passwordLabel') }}</label>
                <div class="relative">
                  <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">lock</span>
                  <input id="password" v-model="form.password" class="field-input pl-11 pr-12" placeholder="••••••••" :type="isPasswordVisible ? 'text' : 'password'" @input="clearFieldError('password')" />
                  <button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-content" @click="togglePasswordVisibility">
                    <span class="material-symbols-outlined">{{ isPasswordVisible ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                <p class="mt-2 text-xs italic text-muted">{{ t('auth.register.step1.passwordHint') }}</p>
                <p v-if="fieldErrors.password" class="mt-1.5 text-sm text-danger">{{ fieldErrors.password }}</p>
              </div>

              <div>
                <label class="flex cursor-pointer items-start gap-3">
                  <input v-model="acceptedLegal" type="checkbox" class="mt-0.5 size-5 rounded border-line" @change="clearFieldError('acceptedLegal')" />
                  <span class="text-sm text-muted">
                    {{ t('auth.register.consent.prefix') }}
                    <RouterLink :to="LEGAL_ROUTE_PATHS.terms" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary hover:underline">{{ t('auth.register.consent.terms') }}</RouterLink>
                    {{ t('auth.register.consent.and') }}
                    <RouterLink :to="LEGAL_ROUTE_PATHS.privacy" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary hover:underline">{{ t('auth.register.consent.privacy') }}</RouterLink>.
                  </span>
                </label>
                <p v-if="fieldErrors.acceptedLegal" class="mt-1.5 text-sm text-danger">{{ fieldErrors.acceptedLegal }}</p>
              </div>

              <p v-if="submissionError" class="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                {{ submissionError }}
              </p>

              <AppButton type="submit" block size="lg" trailing-icon="arrow_forward">
                {{ t('auth.register.nav.nextStep') }}
              </AppButton>

              <div class="flex items-center gap-3 pt-2">
                <span class="h-px flex-1 bg-line" aria-hidden="true"></span>
                <span class="text-xs font-medium text-faint">{{ t('auth.google.divider') }}</span>
                <span class="h-px flex-1 bg-line" aria-hidden="true"></span>
              </div>
              <GoogleSignInButton />
            </form>

            <div class="mt-8 flex justify-center">
              <AppButton variant="ghost" icon="arrow_back" :disabled="isSubmitting" @click="handleBack">
                {{ t('auth.register.nav.back') }}
              </AppButton>
            </div>
          </div>
        </template>

        <template v-else-if="currentStep === 2">
          <div class="surface-glass rounded-2xl p-8 lg:p-10">
            <div class="mb-8 text-center">
              <h2 class="text-3xl font-bold text-content">{{ t('auth.register.step2.title') }}</h2>
              <p class="mt-2 text-muted">{{ t('auth.register.step2.subtitle') }}</p>
            </div>

            <div class="mb-8">
              <h3 class="field-label">{{ t('auth.register.step2.baseCurrencyLabel') }}</h3>
              <div class="surface-card flex items-center justify-between gap-4 p-5">
                <div class="flex min-w-0 items-center gap-4">
                  <div class="icon-tile size-12 shrink-0 bg-surface-2 text-muted">
                    <span class="material-symbols-outlined text-2xl">attach_money</span>
                  </div>
                  <div class="min-w-0 text-left">
                    <h4 class="text-lg font-bold text-content">{{ t('auth.register.step2.usdName') }}</h4>
                    <p class="truncate text-sm text-muted">{{ t('auth.register.step2.baseCurrencyDesc') }}</p>
                  </div>
                </div>
                <AppButton variant="secondary" size="sm">{{ t('auth.register.step2.changeButton') }}</AppButton>
              </div>
            </div>

            <div class="text-left">
              <label class="mb-4 flex cursor-pointer items-center gap-3">
                <input v-model="setupAdditionalCurrencies" class="size-5 rounded border-line" type="checkbox" />
                <span class="font-semibold text-content">{{ t('auth.register.step2.setupAdditional') }}</span>
              </label>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2" :class="{ 'pointer-events-none opacity-50': !setupAdditionalCurrencies }">
                <div v-for="currency in additionalCurrencies" :key="currency" class="surface-card group flex items-center justify-between p-4">
                  <div class="flex items-center gap-3">
                    <div class="icon-tile size-10 bg-primary/10 text-primary">
                      <span class="material-symbols-outlined">payments</span>
                    </div>
                    <div>
                      <p class="font-bold text-content">{{ currency }}</p>
                      <p class="text-xs text-muted">{{ t('auth.register.step2.currencyWord') }}</p>
                    </div>
                  </div>
                  <button type="button" class="text-faint opacity-0 transition-colors hover:text-danger group-hover:opacity-100" @click="removeCurrency(currency)">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
                <button type="button" class="group flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line p-4 text-muted transition hover:border-primary hover:bg-primary/5 hover:text-primary" @click="openCurrencyModal">
                  <span class="material-symbols-outlined transition-transform group-hover:scale-110">add</span>
                  <span class="font-semibold">{{ t('auth.register.step2.addCurrency') }}</span>
                </button>
              </div>
            </div>

            <div class="mt-8 flex items-center gap-3">
              <AppButton variant="secondary" icon="arrow_back" block :disabled="isSubmitting" @click="handleBack">{{ t('auth.register.nav.previous') }}</AppButton>
              <AppButton trailing-icon="arrow_forward" block :loading="isSubmitting || isLoadingCurrencies" :disabled="isSubmitting || isLoadingCurrencies" @click="handleNext">{{ isLoadingCurrencies ? t('auth.register.nav.loadingCurrencies') : t('auth.register.nav.nextStep') }}</AppButton>
            </div>
          </div>
        </template>

        <template v-else-if="currentStep === 3">
          <div class="surface-glass rounded-2xl p-6 sm:p-8">
            <div class="mb-8 text-center">
              <h2 class="text-3xl font-bold text-content">{{ t('auth.register.step3.title') }}</h2>
              <p class="mt-2 text-muted">{{ t('auth.register.step3.subtitle') }}</p>
            </div>

            <div class="surface-card mb-6 flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div class="flex items-center gap-4">
                <div class="icon-tile size-11 bg-primary/10 text-primary">
                  <span class="material-symbols-outlined">translate</span>
                </div>
                <div class="text-left">
                  <p class="font-bold text-content">{{ t('auth.register.step3.selectLanguage') }}</p>
                  <p class="text-sm text-muted">{{ t('auth.register.step3.languageHint') }}</p>
                </div>
              </div>
              <div class="flex min-w-0 flex-col gap-1 text-left sm:min-w-[200px]">
                <label class="field-label !mb-0 ml-1">{{ t('auth.register.step3.languageFieldLabel') }}</label>
                <div class="relative">
                  <select v-model="selectedLanguage" class="field-input appearance-none pr-10" @change="handleLanguageChange(selectedLanguage)">
                    <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
                  </select>
                  <span class="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-faint">unfold_more</span>
                </div>
              </div>
            </div>

            <div class="surface-card overflow-hidden">
              <div v-if="isLoadingCategories" class="flex items-center justify-center py-16 text-primary">
                <span class="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"></span>
              </div>

              <div v-else-if="categoriesError" class="flex flex-col items-center justify-center py-16 text-center">
                <span class="material-symbols-outlined mb-2 text-4xl text-danger">error</span>
                <p class="font-medium text-danger">{{ categoriesError }}</p>
                <AppButton class="mt-4" variant="secondary" size="sm" @click="fetchCategories(selectedLanguage)">{{ t('common.retry') }}</AppButton>
              </div>

              <div v-else-if="categories.length" class="flex flex-col">
                <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2/50 px-4 py-4 sm:px-6">
                  <div class="inline-flex rounded-lg border border-line bg-surface-2 p-1">
                    <button
                      v-for="opt in (['EXPENSE', 'INCOME'] as const)"
                      :key="opt"
                      type="button"
                      class="rounded-md px-4 py-2 text-sm font-semibold transition sm:px-5"
                      :class="activeFilter === opt ? 'bg-surface text-content shadow-sm' : 'text-muted hover:text-content'"
                      @click="activeFilter = opt"
                    >{{ opt === 'EXPENSE' ? t('auth.register.step3.expensesLabel') : t('auth.register.step3.incomeLabel') }}</button>
                  </div>
                  <p class="text-sm text-muted">
                    {{ t('auth.register.step3.resultCount', filteredCategories.length) }}
                    <span v-if="filteredSelectedCount > 0" class="font-semibold text-primary">· {{ t('auth.register.step3.selectedCount', { count: filteredSelectedCount }) }}</span>
                  </p>
                </div>

                <div class="max-h-[420px] divide-y divide-line overflow-y-auto">
                  <div v-for="category in filteredCategories" :key="category.id" class="group">
                    <div class="grid grid-cols-12 items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-2 sm:gap-4 sm:px-6">
                      <div class="col-span-12 flex min-w-0 items-center gap-3 sm:col-span-10 sm:gap-4">
                        <button
                          type="button"
                          class="flex size-5 flex-shrink-0 items-center justify-center rounded border-2 transition duration-200 focus:outline-none"
                          :class="{
                            'border-primary bg-primary': getCategoryState(category) === 'selected',
                            'border-primary bg-primary/15': getCategoryState(category) === 'indeterminate',
                            'border-line-strong hover:border-primary/60': getCategoryState(category) === 'none',
                          }"
                          @click.stop="toggleCategory(category)"
                        >
                          <span v-if="getCategoryState(category) === 'selected'" class="material-symbols-outlined text-primary-fg" style="font-size: 12px">check</span>
                          <span v-else-if="getCategoryState(category) === 'indeterminate'" class="block h-0.5 w-2 rounded-full bg-primary"></span>
                        </button>

                        <button
                          type="button"
                          class="flex size-8 items-center justify-center rounded-full text-faint transition hover:bg-surface-2 hover:text-content"
                          :class="category.children.length === 0 ? 'invisible' : ''"
                          @click="toggleExpanded(category.id)"
                        >
                          <span class="material-symbols-outlined text-xl">{{ isExpanded(category.id) ? 'expand_more' : 'chevron_right' }}</span>
                        </button>

                        <div class="icon-tile size-11" :class="activeFilter === 'EXPENSE' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'">
                          <span class="material-symbols-outlined">{{ category.icon }}</span>
                        </div>

                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold text-content">{{ category.name }}</p>
                          <p class="text-xs text-muted">{{ t('auth.register.step3.subcategoriesCount', { count: category.children.length }) }}</p>
                        </div>
                      </div>

                      <div class="col-span-2 hidden justify-center sm:flex">
                        <span class="badge" :class="activeFilter === 'EXPENSE' ? 'badge-danger' : 'badge-success'">{{ activeFilter === 'EXPENSE' ? t('auth.register.step3.expenseSingular') : t('auth.register.step3.incomeSingular') }}</span>
                      </div>
                    </div>

                    <div v-if="category.children.length > 0 && isExpanded(category.id)" class="bg-surface-2/50">
                      <div v-for="child in category.children" :key="child.id" class="grid grid-cols-12 items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:gap-4 sm:px-6">
                        <div class="col-span-12 flex items-center gap-3 pl-8 sm:col-span-10 sm:pl-14">
                          <button
                            type="button"
                            class="flex size-4 flex-shrink-0 items-center justify-center rounded border-2 transition duration-200 focus:outline-none"
                            :class="{
                              'border-primary bg-primary': selectedCategoryIds.has(child.id),
                              'border-line-strong hover:border-primary/60': !selectedCategoryIds.has(child.id),
                            }"
                            @click.stop="toggleCategory(child)"
                          >
                            <span v-if="selectedCategoryIds.has(child.id)" class="material-symbols-outlined text-primary-fg" style="font-size: 10px">check</span>
                          </button>
                          <span class="size-1.5 flex-shrink-0 rounded-full bg-line-strong"></span>
                          <span class="text-sm text-muted">{{ child.name }}</span>
                        </div>
                        <div class="col-span-2 hidden sm:block"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="px-6 py-16 text-center">
                <div class="icon-tile mx-auto size-14 bg-surface-2 text-faint">
                  <span class="material-symbols-outlined">folder_open</span>
                </div>
                <h3 class="mt-4 text-lg font-semibold text-content">{{ t('auth.register.step3.emptyTitle') }}</h3>
                <p class="mt-2 text-sm text-muted">{{ t('auth.register.step3.emptyHint') }}</p>
              </div>
            </div>

            <div class="mt-8 flex items-center gap-3">
              <AppButton variant="secondary" icon="arrow_back" block :disabled="isSubmitting" @click="handleBack">{{ t('auth.register.nav.previous') }}</AppButton>
              <AppButton trailing-icon="arrow_forward" block :loading="isSubmitting" :disabled="isSubmitting" @click="handleNext">{{ t('auth.register.nav.nextStep') }}</AppButton>
            </div>
          </div>
        </template>

        <template v-else-if="currentStep === 4">
          <div class="flex flex-col items-center text-center">
            <div class="mb-8 flex size-24 items-center justify-center rounded-full bg-primary text-primary-fg shadow-elevated">
              <span class="material-symbols-outlined text-5xl">task_alt</span>
            </div>

            <h2 class="mb-4 text-4xl font-black tracking-tight text-content sm:text-5xl">{{ t('auth.register.step4.title') }}</h2>
            <p class="mb-10 text-lg leading-relaxed text-muted sm:text-xl">{{ t('auth.register.step4.subtitle') }}</p>

            <div class="mb-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              <div class="surface-card p-6">
                <span class="material-symbols-outlined mb-3 text-primary">verified_user</span>
                <p class="font-bold text-content">{{ t('auth.register.step4.accountActive') }}</p>
                <p class="mt-1 text-xs text-muted">{{ t('auth.register.step4.accountActiveDesc') }}</p>
              </div>
              <div class="surface-card p-6">
                <span class="material-symbols-outlined mb-3 text-primary">currency_exchange</span>
                <p class="font-bold text-content">{{ t('auth.register.step4.multiCurrency') }}</p>
                <p class="mt-1 text-xs text-muted">{{ t('auth.register.step4.multiCurrencyDesc') }}</p>
              </div>
              <div class="surface-card p-6">
                <span class="material-symbols-outlined mb-3 text-primary">dashboard_customize</span>
                <p class="font-bold text-content">{{ t('auth.register.step4.smartCategories') }}</p>
                <p class="mt-1 text-xs text-muted">{{ t('auth.register.step4.smartCategoriesDesc') }}</p>
              </div>
            </div>

            <p v-if="submissionError" class="mb-4 w-full rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {{ submissionError }}
            </p>

            <AppButton size="lg" :loading="isSubmitting" trailing-icon="rocket_launch" @click="handleNext">
              {{ isSubmitting ? t('auth.register.step4.creating') : t('auth.register.step4.createAccount') }}
            </AppButton>

            <p class="mt-8 text-sm text-muted">
              {{ t('auth.register.step4.needHelpPrefix') }} <a href="#" class="font-semibold text-primary hover:underline">{{ t('auth.register.step4.gettingStartedLink') }}</a>.
            </p>
          </div>
        </template>
      </div>
    </main>

    <LegalFooter />

    <CurrencyModal
      :is-open="isCurrencyModalOpen"
      @close="isCurrencyModalOpen = false"
      @select="handleCurrencySelect"
    />
  </div>
</template>
