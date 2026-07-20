<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TopHeader from './common/TopHeader.vue'
import LegalFooter from './legal/LegalFooter.vue'
import { AppBadge, AppButton } from './ui'
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
  <div class="flex min-h-screen flex-col bg-ambient bg-ambient--strong font-display">
    <TopHeader />

    <main class="wm-logo-auth flex flex-1 items-center justify-center p-6 lg:p-12">
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

          <div class="surface-glass rounded-2xl space-y-5 p-8">
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
        <div class="surface-glass rounded-2xl mx-auto w-full max-w-md p-8 lg:p-10">
          <div class="mb-8 text-center">
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
              <label class="mb-2 block text-sm font-semibold text-content" for="identifier">{{ identifierLabel }}</label>
              <div class="relative">
                <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">mail</span>
                <input
                  id="identifier"
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
              <label class="mb-2 block text-sm font-semibold text-content" for="password">{{ t('auth.login.passwordLabel') }}</label>
              <div class="relative">
                <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">lock</span>
                <input
                  id="password"
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

            <div class="flex items-center justify-between pt-1">
              <label class="flex cursor-pointer items-center gap-3" for="remember">
                <input id="remember" v-model="form.remember" class="size-5 rounded border-line" type="checkbox" />
                <span class="text-sm font-medium text-muted">{{ t('auth.login.rememberMe') }}</span>
              </label>
              <RouterLink class="text-sm font-semibold text-primary hover:underline" to="/forgot-password">{{ t('auth.login.forgotPasswordLink') }}</RouterLink>
            </div>

            <AppButton type="submit" block size="lg" :loading="isSubmitting">
              {{ isSubmitting ? t('auth.login.signingIn') : t('auth.login.signIn') }}
            </AppButton>

            <div class="flex items-center gap-3 pt-2">
              <span class="h-px flex-1 bg-line" aria-hidden="true"></span>
              <span class="text-xs font-medium text-faint">{{ t('auth.login.orContinueWith') }}</span>
              <span class="h-px flex-1 bg-line" aria-hidden="true"></span>
            </div>

            <AppButton variant="secondary" size="lg" block disabled>
              <svg class="size-5" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              {{ t('auth.login.continueWithGoogle') }}
              <AppBadge>{{ t('auth.login.comingSoon') }}</AppBadge>
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
