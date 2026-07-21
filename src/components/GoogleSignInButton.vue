<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getGoogleClientId, loginWithGoogle } from '../services/auth'
import { googleErrorMessage } from '../utils/googleErrorMessage'
import { useLocale } from '../composables/useLocale'
import { logError } from '../utils/logError'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

// Google renders its own button; we can only steer theme, size, shape, width
// and locale (not colors/typeface — its branding rules own those).
type GsiIdApi = {
  initialize: (options: unknown) => void
  renderButton: (element: HTMLElement, options: unknown) => void
}

const router = useRouter()
const { t } = useI18n()
const { locale } = useLocale()

const buttonHost = ref<HTMLDivElement | null>(null)
const errorMessage = ref('')
const available = ref(true)

// Load the Google Identity Services script once, shared across mounts.
let gsiPromise: Promise<void> | null = null
const loadGsi = (): Promise<void> => {
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${GSI_SRC}"]`)) return resolve()
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(script)
  })
  return gsiPromise
}

let idApi: GsiIdApi | null = null

// Re-rendered when the app language changes so the button text stays localized.
// Kept as the light 'outline' style in both themes on purpose.
const renderButton = () => {
  if (!idApi || !buttonHost.value) return
  const width = Math.max(200, Math.min(400, buttonHost.value.clientWidth || 320))
  buttonHost.value.replaceChildren()
  idApi.renderButton(buttonHost.value, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    locale: locale.value,
    width,
  })
}

const handleCredential = async (idToken: string) => {
  errorMessage.value = ''
  try {
    const data = await loginWithGoogle(idToken, true)
    const target = data.user.requiresCurrencySetup ? 'welcome-currency' : 'dashboard'
    await router.push({ name: target })
  } catch (err) {
    logError('googleSignIn.login', err)
    errorMessage.value = googleErrorMessage(err, t)
  }
}

onMounted(async () => {
  try {
    const clientId = await getGoogleClientId()
    if (!clientId) {
      available.value = false
      return
    }
    await loadGsi()
    const google = (
      window as unknown as { google?: { accounts: { id: GsiIdApi } } }
    ).google
    if (!google || !buttonHost.value) {
      available.value = false
      return
    }
    idApi = google.accounts.id
    idApi.initialize({
      client_id: clientId,
      callback: (resp: { credential: string }) => {
        void handleCredential(resp.credential)
      },
    })
    renderButton()
  } catch (err) {
    // The button is optional; if Google is unreachable, hide it and keep
    // email/password working, but leave a trace.
    logError('googleSignIn.init', err)
    available.value = false
  }
})

watch(locale, () => renderButton())
</script>

<template>
  <div v-if="available" class="flex flex-col gap-2">
    <div ref="buttonHost" class="w-full"></div>
    <p v-if="errorMessage" class="text-sm text-danger">{{ errorMessage }}</p>
  </div>
</template>
