import { computed, ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'coinflow-theme'

export const resolveInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

// Module-level singleton so every component shares the same theme state.
const theme = ref<Theme>(resolveInitialTheme())

const applyTheme = (value: Theme) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', value === 'dark')
}

applyTheme(theme.value)

const setTheme = (value: Theme) => {
  theme.value = value
  applyTheme(value)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, value)
  }
}

const toggleTheme = () => setTheme(theme.value === 'dark' ? 'light' : 'dark')

export function useTheme() {
  return {
    theme,
    isDark: computed(() => theme.value === 'dark'),
    setTheme,
    toggleTheme,
  }
}
