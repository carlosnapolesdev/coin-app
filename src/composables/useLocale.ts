import { ref } from 'vue'
import { i18n } from '../i18n'
import { getStoredUser } from '../services/auth-session'

export type LocaleCode = 'en' | 'es' | 'pt'
export const SUPPORTED_LOCALES: LocaleCode[] = ['en', 'es', 'pt']

const STORAGE_KEY = 'coinflow-locale'

const isSupportedLocale = (value: unknown): value is LocaleCode =>
  value === 'en' || value === 'es' || value === 'pt'

export const resolveInitialLocale = (): LocaleCode => {
  if (typeof window === 'undefined') return 'en'

  const storedUser = getStoredUser()
  if (isSupportedLocale(storedUser?.language)) return storedUser!.language as LocaleCode

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isSupportedLocale(stored)) return stored

  const browserLang = window.navigator.language?.slice(0, 2).toLowerCase()
  if (isSupportedLocale(browserLang)) return browserLang

  return 'en'
}

// Module-level singleton so every component shares the same locale state.
const locale = ref<LocaleCode>(resolveInitialLocale())

const applyLocale = (value: LocaleCode) => {
  i18n.global.locale.value = value
}

applyLocale(locale.value)

export const setLocale = (value: LocaleCode) => {
  locale.value = value
  applyLocale(value)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, value)
  }
}

export function useLocale() {
  return {
    locale,
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
  }
}
