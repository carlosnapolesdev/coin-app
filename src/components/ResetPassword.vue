<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopHeader from './common/TopHeader.vue'
import { AppButton } from './ui'
import { getApiErrorMessage, resetPassword } from '../services/auth'

const route = useRoute()
const router = useRouter()

const token = typeof route.query.token === 'string' ? route.query.token : ''
const newPassword = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const passwordsMatch = computed(() => newPassword.value.length > 0 && newPassword.value === confirmPassword.value)

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!token) {
    errorMessage.value = 'This reset link is invalid. Please request a new one.'
    return
  }
  if (!passwordsMatch.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isSubmitting.value = true
  try {
    await resetPassword(token, newPassword.value)
    router.push({ path: '/login', query: { reset: '1' } })
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, 'Unable to reset your password right now.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg font-display">
    <TopHeader />

    <main class="flex flex-1 items-center justify-center p-6">
      <div class="surface-card mx-auto w-full max-w-md p-8 lg:p-10">
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-content">Reset password</h2>
          <p class="mt-2 text-muted">Choose a new password for your account.</p>
        </div>

        <p
          v-if="errorMessage"
          class="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
        >
          {{ errorMessage }}
        </p>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="mb-2 block text-sm font-semibold text-content">New password</label>
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">lock</span>
              <input v-model="newPassword" class="field-input pl-11" placeholder="••••••••" type="password" required />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-content">Confirm new password</label>
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">lock_reset</span>
              <input v-model="confirmPassword" class="field-input pl-11" placeholder="••••••••" type="password" required />
            </div>
          </div>

          <AppButton type="submit" block size="lg" :loading="isSubmitting" :disabled="!passwordsMatch">
            Reset password
          </AppButton>
        </form>

        <div class="mt-8 text-center">
          <RouterLink class="text-sm font-semibold text-primary hover:underline" to="/login">Back to sign in</RouterLink>
        </div>
      </div>
    </main>
  </div>
</template>
