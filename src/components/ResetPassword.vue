<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TopHeader from './common/TopHeader.vue'
import LegalFooter from './legal/LegalFooter.vue'
import { AppButton } from './ui'
import { getApiErrorMessage, resetPassword } from '../services/auth'
import { logError } from '../utils/logError'

const route = useRoute()
const router = useRouter()

const token = typeof route.query.token === 'string' ? route.query.token : ''
const newPassword = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const { t } = useI18n()

const passwordsMatch = computed(() => newPassword.value.length > 0 && newPassword.value === confirmPassword.value)

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!token) {
    errorMessage.value = t('auth.resetPassword.invalidLink')
    return
  }
  if (!passwordsMatch.value) {
    errorMessage.value = t('auth.resetPassword.passwordMismatch')
    return
  }

  isSubmitting.value = true
  try {
    await resetPassword(token, newPassword.value)
    router.push({ path: '/login', query: { reset: '1' } })
  } catch (err) {
    logError('resetPassword.handleSubmit', err)
    errorMessage.value = getApiErrorMessage(err, t('auth.resetPassword.genericError'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ambient bg-ambient--strong font-display">
    <TopHeader />

    <main class="wm-logo-auth flex flex-1 items-center justify-center p-6">
      <div class="surface-glass rounded-2xl mx-auto w-full max-w-md p-8 lg:p-10">
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-content">{{ t('auth.resetPassword.title') }}</h2>
          <p class="mt-2 text-muted">{{ t('auth.resetPassword.subtitle') }}</p>
        </div>

        <p
          v-if="errorMessage"
          class="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
        >
          {{ errorMessage }}
        </p>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="mb-2 block text-sm font-semibold text-content">{{ t('auth.resetPassword.newPasswordLabel') }}</label>
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">lock</span>
              <input v-model="newPassword" class="field-input pl-11" placeholder="••••••••" type="password" required />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-content">{{ t('auth.resetPassword.confirmPasswordLabel') }}</label>
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">lock_reset</span>
              <input v-model="confirmPassword" class="field-input pl-11" placeholder="••••••••" type="password" required />
            </div>
          </div>

          <AppButton type="submit" block size="lg" :loading="isSubmitting" :disabled="!passwordsMatch">
            {{ t('auth.resetPassword.submit') }}
          </AppButton>
        </form>

        <div class="mt-8 text-center">
          <RouterLink class="text-sm font-semibold text-primary hover:underline" to="/login">{{ t('auth.common.backToSignIn') }}</RouterLink>
        </div>
      </div>
    </main>
    <LegalFooter />
  </div>
</template>
