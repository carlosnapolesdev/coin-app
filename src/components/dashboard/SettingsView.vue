<script setup lang="ts">
import axios from 'axios'
import { reactive, ref } from 'vue'
import Sidebar from './Sidebar.vue'
import { setCurrentUser, useAuthState } from '../../services/auth'
import { usersApi } from '../../services/users'
import {
  AppButton,
  AppCard,
  AppInput,
  AppSelect,
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
        </div>
      </PageContainer>
    </main>
  </div>
</template>
