<script setup lang="ts">
import axios from 'axios'
import { onMounted, reactive, ref } from 'vue'
import Sidebar from './Sidebar.vue'
import { setCurrentUser, useAuthState } from '../../services/auth'
import { usersApi } from '../../services/users'
import { currenciesApi, type UserCurrencyDetail } from '../../services/currencies'
import {
  AppButton,
  AppCard,
  AppInput,
  AppSelect,
  AppSpinner,
  PageContainer,
  PageHeader,
} from '../ui'

const authState = useAuthState()

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
]

const profileForm = reactive({
  fullName: authState.user?.fullName ?? '',
  language: authState.user?.language ?? 'en',
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
      language: profileForm.language,
    })
    setCurrentUser(data)
    profileSuccess.value = 'Profile updated successfully.'
  } catch (e) {
    profileError.value = getErrorMessage(e, 'Unable to update your profile right now.')
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
    passwordError.value = 'Passwords do not match.'
    return
  }

  isSavingPassword.value = true
  try {
    await usersApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordSuccess.value = 'Password changed successfully.'
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (e) {
    passwordError.value = getErrorMessage(e, 'Unable to change your password right now.')
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
    currenciesError.value = getErrorMessage(e, 'Unable to load your currencies right now.')
  } finally {
    isLoadingCurrencies.value = false
  }
}

onMounted(loadCurrencies)

const saveExchangeRate = async (currencyId: number) => {
  const rawValue = exchangeRateInputs[currencyId]
  const exchangeRate = Number(rawValue)
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    currenciesError.value = 'Exchange rate must be greater than 0.'
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
    currenciesError.value = getErrorMessage(e, 'Unable to update the exchange rate right now.')
  } finally {
    savingCurrencyId.value = null
  }
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-bg">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <PageHeader title="Settings" subtitle="Manage your profile and account security." />

      <PageContainer>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AppCard>
            <h2 class="text-lg font-bold text-content">Profile</h2>
            <p class="mt-1 text-sm text-muted">Update your personal information.</p>

            <form class="mt-6 space-y-5" @submit.prevent="saveProfile">
              <div v-if="profileError" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
                {{ profileError }}
              </div>
              <div v-if="profileSuccess" class="rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
                {{ profileSuccess }}
              </div>

              <AppInput
                label="Full name"
                icon="badge"
                :model-value="profileForm.fullName"
                :disabled="isSavingProfile"
                @update:model-value="(v) => (profileForm.fullName = v)"
              />

              <AppSelect
                label="Language"
                :model-value="profileForm.language"
                :disabled="isSavingProfile"
                @update:model-value="(v) => (profileForm.language = v)"
              >
                <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
              </AppSelect>

              <AppButton type="submit" :loading="isSavingProfile" :disabled="!profileForm.fullName">
                Save changes
              </AppButton>
            </form>
          </AppCard>

          <AppCard>
            <h2 class="text-lg font-bold text-content">Password</h2>
            <p class="mt-1 text-sm text-muted">Change the password used to sign in.</p>

            <form class="mt-6 space-y-5" @submit.prevent="changePassword">
              <div v-if="passwordError" class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
                {{ passwordError }}
              </div>
              <div v-if="passwordSuccess" class="rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
                {{ passwordSuccess }}
              </div>

              <AppInput
                label="Current password"
                icon="lock"
                type="password"
                :model-value="passwordForm.currentPassword"
                :disabled="isSavingPassword"
                @update:model-value="(v) => (passwordForm.currentPassword = v)"
              />

              <AppInput
                label="New password"
                icon="lock_reset"
                type="password"
                :model-value="passwordForm.newPassword"
                :disabled="isSavingPassword"
                @update:model-value="(v) => (passwordForm.newPassword = v)"
              />

              <AppInput
                label="Confirm new password"
                icon="lock_reset"
                type="password"
                :model-value="passwordForm.confirmPassword"
                :disabled="isSavingPassword"
                @update:model-value="(v) => (passwordForm.confirmPassword = v)"
              />

              <AppButton type="submit" :loading="isSavingPassword" :disabled="!isPasswordFormValid()">
                Change password
              </AppButton>
            </form>
          </AppCard>

          <AppCard class="lg:col-span-2">
            <h2 class="text-lg font-bold text-content">Currencies</h2>
            <p class="mt-1 text-sm text-muted">
              Set the exchange rate for each currency (units of that currency per 1 unit of your base currency).
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
                  <p class="text-xs text-muted">{{ uc.base ? 'Base currency' : 'Rate vs. base' }}</p>
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
                    {{ currencySavedId === uc.currencyId ? 'Saved' : 'Save' }}
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
