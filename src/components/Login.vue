<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TopHeader from './common/TopHeader.vue'
import LegalFooter from './legal/LegalFooter.vue'
import { AppButton } from './ui'
import { getApiErrorMessage, login } from '../services/auth'
import { getSavedIdentifier } from '../services/auth-session'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const isSubmitting = ref(false)
const isPasswordVisible = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const fieldErrors = reactive<Record<string, string>>({})
const form = reactive({
  identifier: '',
  password: '',
  remember: true,
})

const identifierLabel = computed(() => {
  return form.identifier.includes('@') ? t('auth.login.emailAddressLabel') : t('auth.login.emailOrUsernameLabel')
})

const clearFieldErrors = () => {
  for (const key of Object.keys(fieldErrors)) {
    delete fieldErrors[key]
  }
}

const clearError = (field?: 'identifier' | 'password') => {
  if (field) {
    delete fieldErrors[field]
  }
  errorMessage.value = ''
}

const handleLogin = async () => {
  clearFieldErrors()
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    await login(
      {
        identifier: form.identifier.trim(),
        password: form.password,
      },
      form.remember,
    )

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.replace(redirect)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as {
        message?: string
        validationErrors?: Record<string, string>
      } | undefined

      if (responseData?.validationErrors) {
        Object.assign(fieldErrors, responseData.validationErrors)
      }
    }

    errorMessage.value = getApiErrorMessage(error, t('auth.login.genericError'))
  } finally {
    isSubmitting.value = false
  }
}

const handleCreateAccount = () => {
  router.push('/register')
}

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

const highlights = computed(() => [
  { icon: 'account_balance_wallet', title: t('auth.login.highlights.accounts.title'), text: t('auth.login.highlights.accounts.text') },
  { icon: 'category', title: t('auth.login.highlights.categories.title'), text: t('auth.login.highlights.categories.text') },
  { icon: 'currency_exchange', title: t('auth.login.highlights.currency.title'), text: t('auth.login.highlights.currency.text') },
])

onMounted(() => {
  const savedIdentifier = getSavedIdentifier()
  if (savedIdentifier) {
    form.identifier = savedIdentifier
  }

  if (typeof route.query.email === 'string') {
    form.identifier = route.query.email
  }

  if (route.query.registered === '1') {
    successMessage.value = t('auth.login.accountCreatedMessage')
  }

  if (route.query.reset === '1') {
    successMessage.value = t('auth.login.passwordResetMessage')
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg font-display">
    <TopHeader />

    <main class="flex flex-1 items-center justify-center p-6 lg:p-12">
      <div class="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
        <!-- Left: context -->
        <div class="hidden flex-col gap-8 lg:flex">
          <div class="space-y-4">
            <h1 class="text-5xl font-black leading-[1.1] text-content">
              {{ t('auth.login.heroTitlePrefix') }} <span class="text-primary">{{ t('auth.login.heroTitleHighlight') }}</span>
            </h1>
            <p class="max-w-md text-lg text-muted">
              {{ t('auth.login.heroSubtitle') }}
            </p>
          </div>

          <div class="surface-card space-y-5 p-8">
            <div v-for="item in highlights" :key="item.title" class="flex items-start gap-4">
              <div class="icon-tile size-11 shrink-0 bg-primary/10 text-primary">
                <span class="material-symbols-outlined">{{ item.icon }}</span>
              </div>
              <div>
                <p class="font-semibold text-content">{{ item.title }}</p>
                <p class="text-sm text-muted">{{ item.text }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: login card -->
        <div class="surface-card mx-auto w-full max-w-md p-8 lg:p-10">
          <div class="mb-8">
            <h2 class="text-3xl font-bold text-content">{{ t('auth.login.title') }}</h2>
            <p class="mt-2 text-muted">{{ t('auth.login.subtitle') }}</p>
          </div>

          <p
            v-if="successMessage"
            class="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
          >
            {{ successMessage }}
          </p>

          <p
            v-if="errorMessage"
            class="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
          >
            {{ errorMessage }}
          </p>

          <form class="space-y-5" @submit.prevent="handleLogin">
            <div>
              <label class="mb-2 block text-sm font-semibold text-content">{{ identifierLabel }}</label>
              <div class="relative">
                <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">mail</span>
                <input
                  v-model.trim="form.identifier"
                  class="field-input pl-11"
                  :placeholder="t('auth.login.identifierPlaceholder')"
                  type="text"
                  @input="clearError('identifier')"
                />
              </div>
              <p v-if="fieldErrors.identifier" class="mt-1.5 text-sm text-danger">{{ fieldErrors.identifier }}</p>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between">
                <label class="text-sm font-semibold text-content">{{ t('auth.login.passwordLabel') }}</label>
                <RouterLink class="text-xs font-semibold text-primary hover:underline" to="/forgot-password">{{ t('auth.login.forgotPasswordLink') }}</RouterLink>
              </div>
              <div class="relative">
                <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">lock</span>
                <input
                  v-model="form.password"
                  class="field-input pl-11 pr-12"
                  placeholder="••••••••"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  @input="clearError('password')"
                />
                <button
                  type="button"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-content"
                  @click="togglePasswordVisibility"
                >
                  <span class="material-symbols-outlined">{{ isPasswordVisible ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              <p v-if="fieldErrors.password" class="mt-1.5 text-sm text-danger">{{ fieldErrors.password }}</p>
            </div>

            <label class="flex cursor-pointer items-center gap-3 py-1" for="remember">
              <input id="remember" v-model="form.remember" class="size-5 rounded border-line" type="checkbox" />
              <span class="text-sm font-medium text-muted">{{ t('auth.login.rememberMe') }}</span>
            </label>

            <AppButton type="submit" block size="lg" :loading="isSubmitting" trailing-icon="arrow_forward">
              {{ isSubmitting ? t('auth.login.signingIn') : t('auth.login.signIn') }}
            </AppButton>
          </form>

          <div class="mt-8 text-center">
            <p class="text-sm text-muted">
              {{ t('auth.login.noAccount') }}
              <button class="ml-1 font-semibold text-primary hover:underline" @click="handleCreateAccount">{{ t('auth.login.createAccount') }}</button>
            </p>
          </div>
        </div>
      </div>
    </main>

    <footer class="px-6 py-8 text-center">
      <p class="text-xs font-medium uppercase tracking-widest text-faint">
        {{ t('auth.login.footer') }}
      </p>
    </footer>
    <LegalFooter />
  </div>
</template>
