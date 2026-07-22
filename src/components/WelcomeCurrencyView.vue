<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { currenciesApi, type AvailableCurrency } from '../services/currencies'
import { setCurrentUser } from '../services/auth'
import { getStoredUser } from '../services/auth-session'
import { guessBaseCurrency } from '../utils/guessBaseCurrency'
import { logError } from '../utils/logError'
import TopHeader from './common/TopHeader.vue'
import LegalFooter from './legal/LegalFooter.vue'
import { AppButton, AppSelect } from './ui'

const router = useRouter()
const { t } = useI18n()

const currencies = ref<AvailableCurrency[]>([])
const selectedCode = ref<string>('')
const loading = ref(true)
const submitting = ref(false)
const error = ref('')

// Greeting the account by name reassures the user this is still their session,
// not a page they landed on after leaving the app.
const firstName = computed(
  () => getStoredUser()?.fullName?.trim().split(/\s+/)[0] ?? '',
)

onMounted(async () => {
  try {
    const { data } = await currenciesApi.listAvailable()
    currencies.value = data
    selectedCode.value = guessBaseCurrency(
      data.map((c) => c.code),
      navigator.language || 'en',
    )
  } catch (err) {
    logError('welcomeCurrency.load', err)
    error.value = t('welcome.currency.loadError')
  } finally {
    loading.value = false
  }
})

const confirm = async () => {
  const chosen = currencies.value.find((c) => c.code === selectedCode.value)
  if (!chosen) return
  submitting.value = true
  error.value = ''
  try {
    await currenciesApi.addUserCurrency(chosen.id, true)
    const user = getStoredUser()
    if (user) setCurrentUser({ ...user, requiresCurrencySetup: false })
    await router.replace({ name: 'dashboard' })
  } catch (err) {
    logError('welcomeCurrency.submit', err)
    error.value = t('welcome.currency.submitError')
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ambient bg-ambient--strong font-display">
    <TopHeader />

    <main class="wm-pattern flex flex-1 items-center justify-center p-6 lg:p-12">
      <div class="surface-glass rounded-2xl mx-auto w-full max-w-md p-8 lg:p-10">
        <div class="mb-8 text-center">
          <div
            class="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary text-primary-fg shadow-elevated"
          >
            <span class="material-symbols-outlined text-4xl">celebration</span>
          </div>
          <p v-if="firstName" class="text-sm font-semibold text-primary">
            {{ t('welcome.currency.greeting', { name: firstName }) }}
          </p>
          <h1 class="mt-1 text-3xl font-bold text-content">{{ t('welcome.currency.title') }}</h1>
          <p class="mt-2 text-muted">{{ t('welcome.currency.subtitle') }}</p>
        </div>

        <p v-if="loading" class="text-center text-sm text-muted">{{ t('common.loading') }}</p>

        <div v-else class="space-y-5">
          <AppSelect
            id="welcome-currency"
            v-model="selectedCode"
            :label="t('welcome.currency.label')"
          >
            <option v-for="c in currencies" :key="c.id" :value="c.code">
              {{ c.code }} — {{ c.name }}
            </option>
          </AppSelect>

          <p
            v-if="error"
            class="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
          >
            {{ error }}
          </p>

          <AppButton
            size="lg"
            block
            :loading="submitting"
            :disabled="!selectedCode"
            @click="confirm"
          >
            {{ t('welcome.currency.confirm') }}
          </AppButton>
        </div>
      </div>
    </main>

    <LegalFooter />
  </div>
</template>
