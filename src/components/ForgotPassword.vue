<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TopHeader from './common/TopHeader.vue'
import { AppButton } from './ui'
import { forgotPassword } from '../services/auth'

const email = ref('')
const isSubmitting = ref(false)
const submitted = ref(false)
const { t } = useI18n()

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    await forgotPassword(email.value.trim())
  } finally {
    // Always show the neutral confirmation, regardless of outcome, to avoid user enumeration.
    submitted.value = true
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
          <h2 class="text-3xl font-bold text-content">{{ t('auth.forgotPassword.title') }}</h2>
          <p class="mt-2 text-muted">{{ t('auth.forgotPassword.subtitle') }}</p>
        </div>

        <p
          v-if="submitted"
          class="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          {{ t('auth.forgotPassword.confirmationMessage') }}
        </p>

        <form v-else class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="mb-2 block text-sm font-semibold text-content">{{ t('auth.common.emailAddressLabel') }}</label>
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">mail</span>
              <input
                v-model.trim="email"
                class="field-input pl-11"
                :placeholder="t('auth.common.emailPlaceholder')"
                type="email"
                required
              />
            </div>
          </div>

          <AppButton type="submit" block size="lg" :loading="isSubmitting">
            {{ t('auth.forgotPassword.submit') }}
          </AppButton>
        </form>

        <div class="mt-8 text-center">
          <RouterLink class="text-sm font-semibold text-primary hover:underline" to="/login">{{ t('auth.common.backToSignIn') }}</RouterLink>
        </div>
      </div>
    </main>
  </div>
</template>
