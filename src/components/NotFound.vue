<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import TopHeader from './common/TopHeader.vue'
import LegalFooter from './legal/LegalFooter.vue'
import { AppButton } from './ui'
import { isAuthenticated } from '../services/auth'

const { t } = useI18n()
const router = useRouter()
const goHome = () => router.replace(isAuthenticated() ? '/dashboard' : '/login')
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ambient bg-ambient--strong font-display">
    <TopHeader />

    <main class="flex flex-1 items-center justify-center p-6">
      <div class="surface-glass rounded-2xl mx-auto w-full max-w-md p-8 text-center lg:p-10">
        <p class="text-7xl font-bold text-primary">404</p>
        <h2 class="mt-4 text-2xl font-bold text-content">{{ t('notFound.title') }}</h2>
        <p class="mt-2 text-muted">{{ t('notFound.message') }}</p>
        <AppButton block size="lg" class="mt-8" @click="goHome">{{ t('notFound.cta') }}</AppButton>
      </div>
    </main>

    <LegalFooter />
  </div>
</template>
