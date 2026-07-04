<script setup lang="ts">
import { ref } from 'vue'
import TopHeader from './common/TopHeader.vue'
import { AppButton } from './ui'
import { forgotPassword } from '../services/auth'

const email = ref('')
const isSubmitting = ref(false)
const submitted = ref(false)

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
          <h2 class="text-3xl font-bold text-content">Forgot password</h2>
          <p class="mt-2 text-muted">Enter your email and we'll send you a reset link.</p>
        </div>

        <p
          v-if="submitted"
          class="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          If the email exists, a reset link was sent.
        </p>

        <form v-else class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="mb-2 block text-sm font-semibold text-content">Email Address</label>
            <div class="relative">
              <span class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">mail</span>
              <input
                v-model.trim="email"
                class="field-input pl-11"
                placeholder="name@company.com"
                type="email"
                required
              />
            </div>
          </div>

          <AppButton type="submit" block size="lg" :loading="isSubmitting">
            Send reset link
          </AppButton>
        </form>

        <div class="mt-8 text-center">
          <RouterLink class="text-sm font-semibold text-primary hover:underline" to="/login">Back to sign in</RouterLink>
        </div>
      </div>
    </main>
  </div>
</template>
