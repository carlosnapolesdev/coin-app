import { computed, reactive, ref } from 'vue'
import { setCurrentUser, useAuthState } from '../services/auth'
import { getStoredUser } from '../services/auth-session'
import {
  DEFAULT_ONBOARDING_STATE,
  onboardingApi,
  type OnboardingState,
} from '../services/onboarding'
import { accountsApi } from '../services/accounts'
import { transactionsApi } from '../services/transactions'
import { budgetsApi } from '../services/budgets'

// Singletons a nivel de módulo: todos los consumidores comparten el mismo estado.
const counts = reactive({ accounts: 0, transactions: 0, budgets: 0, loaded: false })
const celebrationVisible = ref(false)
// La primera transacción se detecta al guardar, pero el modal de alta queda
// abierto (para adjuntos/splits). Para no apilar dos overlays, la celebración se
// marca pendiente y se muestra recién al cerrar el modal (flushCelebration).
const celebrationPending = ref(false)

const auth = useAuthState()

const state = computed<OnboardingState>(() => ({
  ...DEFAULT_ONBOARDING_STATE,
  ...((auth.user?.onboardingState as Partial<OnboardingState> | null | undefined) ?? {}),
}))

// Actualiza el estado local (optimista) y sincroniza con el backend (fire-and-forget).
function patch(partial: Partial<OnboardingState>) {
  const user = getStoredUser()
  if (!user) return
  const next: OnboardingState = { ...state.value, ...partial }
  setCurrentUser({ ...user, onboardingState: next })
  onboardingApi.update(partial).catch(() => {
    // Falla de red: se conserva el valor optimista para esta sesión.
  })
}

async function loadCounts() {
  const user = getStoredUser()
  if (!user) return
  const [a, t, b] = await Promise.allSettled([
    accountsApi.list(),
    transactionsApi.search({ page: 1, pageSize: 1 }),
    budgetsApi.list(),
  ])
  if (a.status === 'fulfilled') counts.accounts = a.value.data.length
  if (t.status === 'fulfilled') counts.transactions = t.value.data.total
  if (b.status === 'fulfilled') counts.budgets = b.value.data.length
  counts.loaded = true

  // Usuario con datos previos: no corresponde celebrar retroactivamente.
  if (counts.transactions > 0 && !state.value.celebrationShown) {
    patch({ celebrationShown: true })
  }
}

const totalSteps = 4

const steps = computed(() => [
  { key: 'account', done: counts.accounts > 0, route: 'accounts' },
  { key: 'transaction', done: counts.transactions > 0, route: 'transactions' },
  { key: 'budget', done: counts.budgets > 0, route: 'budgets' },
  { key: 'reports', done: state.value.reportsVisited, route: 'reports' },
])

const completedCount = computed(() => steps.value.filter((s) => s.done).length)
const isComplete = computed(() => completedCount.value === totalSteps)
const checklistVisible = computed(
  () => Boolean(auth.user) && !state.value.checklistDismissed && !isComplete.value,
)

export function useOnboarding() {
  const shouldShowCoach = (key: string) =>
    Boolean(auth.user) && !state.value.coachSeen.includes(key)

  const markCoachSeen = (key: string) => {
    if (state.value.coachSeen.includes(key)) return
    patch({ coachSeen: [...state.value.coachSeen, key] })
  }

  const markReportsVisited = () => {
    if (state.value.reportsVisited) return
    patch({ reportsVisited: true })
  }

  const dismissChecklist = () => patch({ checklistDismissed: true })

  const notifyTransactionCreated = () => {
    if (!state.value.celebrationShown && counts.transactions === 0) {
      celebrationPending.value = true
      patch({ celebrationShown: true })
    }
    counts.transactions += 1
  }

  // Muestra la celebración pendiente (llamado al cerrar el modal de alta).
  const flushCelebration = () => {
    if (celebrationPending.value) {
      celebrationPending.value = false
      celebrationVisible.value = true
    }
  }

  const dismissCelebration = () => {
    celebrationVisible.value = false
  }

  const resetTour = () => {
    patch({
      coachSeen: [],
      checklistDismissed: false,
      reportsVisited: false,
      tourVersion: state.value.tourVersion + 1,
    })
  }

  return {
    steps,
    completedCount,
    totalSteps,
    isComplete,
    checklistVisible,
    celebrationVisible,
    loadCounts,
    shouldShowCoach,
    markCoachSeen,
    markReportsVisited,
    dismissChecklist,
    notifyTransactionCreated,
    flushCelebration,
    dismissCelebration,
    resetTour,
  }
}
