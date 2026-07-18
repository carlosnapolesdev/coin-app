<script setup lang="ts">
import axios from 'axios'
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import { setCurrentUser, useAuthState } from '../../services/auth'
import { usersApi } from '../../services/users'
import { currenciesApi, type UserCurrencyDetail } from '../../services/currencies'
import { tagsApi, type TagDto } from '../../services/tags'
import {
  AppButton,
  AppCard,
  AppIconButton,
  AppInput,
  AppSpinner,
  ConfirmDialog,
  PageContainer,
  PageHeader,
} from '../ui'
import { LEGAL_SLUGS, LEGAL_ROUTE_PATHS, LEGAL_TITLE_KEYS } from '../../content/legal'
import { useToast } from '../../composables/useToast'

const authState = useAuthState()
const { t } = useI18n()
const toast = useToast()

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

const userTags = ref<TagDto[]>([])
const isLoadingTags = ref(false)
const tagsError = ref('')
const editingTagId = ref<number | null>(null)
const renameValue = ref('')
const savingTagId = ref<number | null>(null)
const tagToDelete = ref<TagDto | null>(null)
const isDeletingTag = ref(false)

const loadTags = async () => {
  isLoadingTags.value = true
  tagsError.value = ''
  try {
    userTags.value = await tagsApi.list()
  } catch (e) {
    userTags.value = []
    tagsError.value = getErrorMessage(e, t('settings.tags.loadError'))
  } finally {
    isLoadingTags.value = false
  }
}

const startRename = (tag: TagDto) => {
  editingTagId.value = tag.id
  renameValue.value = tag.name
}

const cancelRename = () => {
  editingTagId.value = null
  renameValue.value = ''
}

const renameTag = async () => {
  if (editingTagId.value === null) return
  const name = renameValue.value.trim()
  if (!name) return
  const id = editingTagId.value
  savingTagId.value = id
  try {
    await tagsApi.rename(id, name)
    cancelRename()
    await loadTags()
    toast.success(t('settings.tags.toast.renamed'))
  } catch (e) {
    toast.error(getErrorMessage(e, t('settings.tags.toast.error')))
  } finally {
    savingTagId.value = null
  }
}

const confirmDeleteTag = async () => {
  if (!tagToDelete.value) return
  isDeletingTag.value = true
  try {
    await tagsApi.remove(tagToDelete.value.id)
    tagToDelete.value = null
    await loadTags()
    toast.success(t('settings.tags.toast.deleted'))
  } catch (e) {
    toast.error(getErrorMessage(e, t('settings.tags.toast.error')))
  } finally {
    isDeletingTag.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadCurrencies(), loadTags()])
})

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
  <div class="flex h-screen overflow-hidden bg-ambient">
    <Sidebar />

    <main class="wm-logo-main flex-1 overflow-y-auto">
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
                name="currentPassword"
                autocomplete="current-password"
                :model-value="passwordForm.currentPassword"
                :disabled="isSavingPassword"
                @update:model-value="(v) => (passwordForm.currentPassword = v)"
              />

              <AppInput
                :label="t('settings.password.newLabel')"
                icon="lock_reset"
                type="password"
                name="newPassword"
                autocomplete="new-password"
                :model-value="passwordForm.newPassword"
                :disabled="isSavingPassword"
                @update:model-value="(v) => (passwordForm.newPassword = v)"
              />

              <AppInput
                :label="t('settings.password.confirmLabel')"
                icon="lock_reset"
                type="password"
                name="confirmPassword"
                autocomplete="new-password"
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

          <AppCard class="lg:col-span-2">
            <h2 class="font-display text-lg font-bold text-content">{{ t('settings.tags.title') }}</h2>
            <p class="mt-1 text-sm text-muted">{{ t('settings.tags.subtitle') }}</p>

            <div v-if="isLoadingTags" class="flex items-center justify-center py-10 text-primary">
              <AppSpinner size="md" />
            </div>

            <div v-else-if="tagsError" class="mt-6 rounded-xl border border-danger/30 bg-danger/10 p-4">
              <p class="text-sm font-medium text-danger">{{ tagsError }}</p>
              <AppButton class="mt-3" size="sm" variant="secondary" @click="loadTags">
                {{ t('common.retry') }}
              </AppButton>
            </div>

            <p v-else-if="userTags.length === 0" class="mt-6 text-sm text-muted">
              {{ t('settings.tags.empty') }}
            </p>

            <div v-else class="mt-6 divide-y divide-line">
              <div
                v-for="tag in userTags"
                :key="tag.id"
                class="flex min-h-16 flex-wrap items-center gap-3 py-3"
              >
                <template v-if="editingTagId === tag.id">
                  <AppInput
                    :id="`tag-rename-${tag.id}`"
                    class="min-w-48 flex-1"
                    :label="t('settings.tags.renamePrompt')"
                    name="tagName"
                    autocomplete="off"
                    :model-value="renameValue"
                    :placeholder="t('settings.tags.renamePrompt')"
                    :disabled="savingTagId === tag.id"
                    @update:model-value="(value) => (renameValue = value)"
                    @keyup.enter="renameTag"
                    @keyup.escape="cancelRename"
                  />
                  <AppButton
                    size="sm"
                    :loading="savingTagId === tag.id"
                    :disabled="!renameValue.trim()"
                    @click="renameTag"
                  >
                    {{ t('common.save') }}
                  </AppButton>
                  <AppButton size="sm" variant="ghost" :disabled="savingTagId === tag.id" @click="cancelRename">
                    {{ t('common.cancel') }}
                  </AppButton>
                </template>

                <template v-else>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-content">{{ tag.name }}</p>
                    <p class="text-xs text-muted">{{ t('tags.usageCount', tag.usageCount ?? 0) }}</p>
                  </div>
                  <AppButton size="sm" variant="ghost" icon="edit" @click="startRename(tag)">
                    {{ t('settings.tags.rename') }}
                  </AppButton>
                  <AppIconButton
                    icon="delete"
                    variant="danger"
                    :aria-label="t('settings.tags.delete')"
                    @click="tagToDelete = tag"
                  />
                </template>
              </div>
            </div>
          </AppCard>

          <AppCard class="lg:col-span-2">
            <h3 class="text-lg font-bold text-content">{{ t('settings.legal.title') }}</h3>
            <p class="mt-1 text-sm text-muted">{{ t('settings.legal.subtitle') }}</p>
            <div class="mt-4 flex flex-col divide-y divide-line">
              <RouterLink
                v-for="slug in LEGAL_SLUGS"
                :key="slug"
                :to="LEGAL_ROUTE_PATHS[slug]"
                class="flex items-center justify-between py-3 text-sm font-medium text-content hover:text-primary"
              >
                <span>{{ t(LEGAL_TITLE_KEYS[slug]) }}</span>
                <span class="material-symbols-outlined text-faint" aria-hidden="true">chevron_right</span>
              </RouterLink>
            </div>
          </AppCard>
        </div>
      </PageContainer>
    </main>

    <ConfirmDialog
      :is-open="tagToDelete !== null"
      :title="t('settings.tags.confirmDeleteTitle')"
      :message="tagToDelete ? t('settings.tags.confirmDelete', { name: tagToDelete.name }) : ''"
      :loading="isDeletingTag"
      @confirm="confirmDeleteTag"
      @cancel="tagToDelete = null"
    />
  </div>
</template>
