<script setup lang="ts">
import axios from 'axios'
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import { setCurrentUser, useAuthState } from '../../services/auth'
import { usersApi } from '../../services/users'
import { currenciesApi, type UserCurrencyDetail } from '../../services/currencies'
import {
  AppButton,
  AppCard,
  AppInput,
  AppSpinner,
  PageContainer,
  PageHeader,
} from '../ui'

const authState = useAuthState()
const { t } = useI18n()

const profileForm = reactive({
  fullName: authState.user?.fullName ?? '',
})
const isSavingProfile = ref(false)
const profileError = ref('')
const profileSuccess = ref('')

const saveProfile = async () => {
  isSavingProfile.value = true
  profileError.value = ''
  profileSuccess.value = ''
  try {
    const { data } = await usersApi.updateProfile({
      fullName: profileForm.fullName,
    })
    setCurrentUser(data)
    profileSuccess.value = t('settings.profile.successMessage')
  } catch (e) {
    profileError.value = getErrorMessage(e, t('settings.profile.errorFallback'))
  } finally {
    isSavingProfile.value = false
  }
}

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const isSavingPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    return message ?? fallback
  }
  return fallback
}

const isPasswordFormValid = () =>
  passwordForm.currentPassword.length > 0 &&
  passwordForm.newPassword.length > 0 &&
  passwordForm.newPassword === passwordForm.confirmPassword

const changePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = t('auth.resetPassword.passwordMismatch')
    return
  }

  isSavingPassword.value = true
  try {
    await usersApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordSuccess.value = t('settings.password.successMessage')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (e) {
    passwordError.value = getErrorMessage(e, t('settings.password.errorFallback'))
  } finally {
    isSavingPassword.value = false
  }
}

const userCurrencies = ref<UserCurrencyDetail[]>([])
const isLoadingCurrencies = ref(false)
const currenciesError = ref('')
const exchangeRateInputs = reactive<Record<number, string>>({})
const savingCurrencyId = ref<number | null>(null)
const currencySavedId = ref<number | null>(null)

const loadCurrencies = async () => {
  isLoadingCurrencies.value = true
  currenciesError.value = ''
  try {
    const { data } = await currenciesApi.listUserCurrencies()
    userCurrencies.value = data
    for (const uc of data) {
      exchangeRateInputs[uc.currencyId] = String(uc.exchangeRate)
    }
  } catch (e) {
    currenciesError.value = getErrorMessage(e, t('settings.currencies.errorFallback'))
  } finally {
    isLoadingCurrencies.value = false
  }
}

onMounted(loadCurrencies)

const saveExchangeRate = async (currencyId: number) => {
  const rawValue = exchangeRateInputs[currencyId]
  const exchangeRate = Number(rawValue)
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    currenciesError.value = t('settings.currencies.invalidRate')
    return
  }

  currenciesError.value = ''
  currencySavedId.value = null
  savingCurrencyId.value = currencyId
  try {
    const { data } = await currenciesApi.updateUserCurrency(currencyId, { exchangeRate })
    const index = userCurrencies.value.findIndex((uc) => uc.currencyId === currencyId)
    if (index !== -1) userCurrencies.value[index] = data
    currencySavedId.value = currencyId
  } catch (e) {
    currenciesError.value = getErrorMessage(e, t('settings.currencies.saveErrorFallback'))
  } finally {
    savingCurrencyId.value = null
  }
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-bg">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <PageHeader :title="t('settings.pageTitle')" :subtitle="t('settings.pageSubtitle')" />

      <PageContainer>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AppCard>
            <h2 class="text-lg font-bold text-content">{{ t('settings.profile.title') }}</h2>
            <p class="mt-1 text-sm text-muted">{{ t('settings.profile.subtitle') }}</p>

            <form class="mt-6 space-y-5" @submit.prevent="saveProfile">
              <div v-if="profileError" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
                {{ profileError }}
              </div>
              <div v-if="profileSuccess" class="rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
                {{ profileSuccess }}
              </div>

              <AppInput
                :label="t('settings.profile.fullNameLabel')"
                icon="badge"
                :model-value="profileForm.fullName"
                :disabled="isSavingProfile"
                @update:model-value="(v) => (profileForm.fullName = v)"
              />

              <AppButton type="submit" :loading="isSavingProfile" :disabled="!profileForm.fullName">
                {{ t('settings.profile.saveButton') }}
              </AppButton>
            </form>
          </AppCard>

          <AppCard>
            <h2 class="text-lg font-bold text-content">{{ t('settings.password.title') }}</h2>
            <p class="mt-1 text-sm text-muted">{{ t('settings.password.subtitle') }}</p>

            <form class="mt-6 space-y-5" @submit.prevent="changePassword">
              <div v-if="passwordError" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
                {{ passwordError }}
              </div>
              <div v-if="passwordSuccess" class="rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
                {{ passwordSuccess }}
              </div>

              <AppInput
                :label="t('settings.password.currentLabel')"
                icon="lock"
                type="password"
                :model-value="passwordForm.currentPassword"
                :disabled="isSavingPassword"
                @update:model-value="(v) => (passwordForm.currentPassword = v)"
              />

              <AppInput
                :label="t('settings.password.newLabel')"
                icon="lock_reset"
                type="password"
                :model-value="passwordForm.newPassword"
                :disabled="isSavingPassword"
                @update:model-value="(v) => (passwordForm.newPassword = v)"
              />

              <AppInput
                :label="t('settings.password.confirmLabel')"
                icon="lock_reset"
                type="password"
                :model-value="passwordForm.confirmPassword"
                :disabled="isSavingPassword"
                @update:model-value="(v) => (passwordForm.confirmPassword = v)"
              />

              <AppButton type="submit" :loading="isSavingPassword" :disabled="!isPasswordFormValid()">
                {{ t('settings.password.submitButton') }}
              </AppButton>
            </form>
          </AppCard>

          <AppCard class="lg:col-span-2">
            <h2 class="text-lg font-bold text-content">{{ t('settings.currencies.title') }}</h2>
            <p class="mt-1 text-sm text-muted">
              {{ t('settings.currencies.subtitle') }}
            </p>

            <div v-if="currenciesError" class="mt-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
              {{ currenciesError }}
            </div>

            <div v-if="isLoadingCurrencies" class="flex items-center justify-center py-10 text-faint">
              <AppSpinner size="md" />
            </div>

            <div v-else class="mt-6 space-y-3">
              <div
                v-for="uc in userCurrencies"
                :key="uc.currencyId"
                class="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3"
              >
                <div class="min-w-[120px] flex-1">
                  <p class="text-sm font-semibold text-content">{{ uc.code }} — {{ uc.name }}</p>
                  <p class="text-xs text-muted">{{ uc.base ? t('settings.currencies.baseCurrency') : t('settings.currencies.rateVsBase') }}</p>
                </div>

                <div v-if="uc.base" class="text-sm font-medium text-faint">1.000000</div>
                <template v-else>
                  <AppInput
                    class="w-32"
                    type="number"
                    :model-value="exchangeRateInputs[uc.currencyId]"
                    :disabled="savingCurrencyId === uc.currencyId"
                    @update:model-value="(v) => (exchangeRateInputs[uc.currencyId] = v)"
                  />
                  <AppButton
                    size="sm"
                    variant="secondary"
                    :loading="savingCurrencyId === uc.currencyId"
                    @click="saveExchangeRate(uc.currencyId)"
                  >
                    {{ currencySavedId === uc.currencyId ? t('settings.currencies.saved') : t('common.save') }}
                  </AppButton>
                </template>
              </div>
            </div>
          </AppCard>
        </div>
      </PageContainer>
    </main>
  </div>
</template>
