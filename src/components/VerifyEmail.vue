<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TopHeader from './common/TopHeader.vue'
import LegalFooter from './legal/LegalFooter.vue'
import { AppButton } from './ui'
import { verifyEmail } from '../services/auth'
import { logError } from '../utils/logError'
import { isExpectedApiRejection } from '../utils/expectedApiRejection'

const route = useRoute()
const { t } = useI18n()

const status = ref<'verifying' | 'success' | 'error'>('verifying')

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  if (!token) {
    status.value = 'error'
    return
  }

  try {
    await verifyEmail(token)
    status.value = 'success'
  } catch (err) {
    // An expired or already-used token is a 400 the user can act on, and the
    // screen already explains it; only genuine faults are worth a report.
    if (!isExpectedApiRejection(err)) logError('verifyEmail.onMounted', err)
    status.value = 'error'
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ambient bg-ambient--strong font-display">
    <TopHeader />

    <main class="wm-pattern flex flex-1 items-center justify-center p-6">
      <div class="surface-glass rounded-2xl mx-auto w-full max-w-md p-8 text-center lg:p-10">
        <template v-if="status === 'verifying'">
          <h2 class="text-3xl font-bold text-content">{{ t('auth.verifyEmail.title') }}</h2>
          <p class="mt-2 text-muted">{{ t('auth.verifyEmail.verifying') }}</p>
        </template>

        <template v-else-if="status === 'success'">
          <span class="material-symbols-outlined text-[48px] text-primary">mark_email_read</span>
          <h2 class="mt-4 text-3xl font-bold text-content">{{ t('auth.verifyEmail.successTitle') }}</h2>
          <p class="mt-2 text-muted">{{ t('auth.verifyEmail.successBody') }}</p>
        </template>

        <template v-else>
          <span class="material-symbols-outlined text-[48px] text-danger">link_off</span>
          <h2 class="mt-4 text-3xl font-bold text-content">{{ t('auth.verifyEmail.errorTitle') }}</h2>
          <p class="mt-2 text-muted">{{ t('auth.verifyEmail.invalidLink') }}</p>
        </template>

        <RouterLink to="/login" class="mt-8 block">
          <AppButton block size="lg">{{ t('auth.verifyEmail.goToSignIn') }}</AppButton>
        </RouterLink>
      </div>
    </main>
    <LegalFooter />
  </div>
</template>