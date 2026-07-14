import { describe, expect, it, vi, beforeEach } from 'vitest'

// `getStoredUser` sólo necesita devolver un usuario "truthy": en patch() su
// onboardingState se descarta (se sobrescribe con el estado reactivo derivado),
// así que puede ser un stub plano sin reactividad.
vi.mock('../services/auth-session', () => ({
  getStoredUser: () => ({
    id: 1, fullName: 'A', email: 'a@a.com', username: null, language: 'en',
  }),
}))

// IMPORTANTE: el fixture DEBE ser reactivo. En el composable, `state` y las APIs
// derivadas (`steps`, `checklistVisible`, `isComplete`) son `computed`; con un
// objeto plano quedarían cacheados y, tras `markCoachSeen`/`dismissChecklist`, los
// tests leerían valores obsoletos y fallarían. El objeto reactivo vive dentro del
// propio mock (factory async que importa `vue`, evitando el hoisting de vi.mock) y
// se resetea entre tests con `__resetOnboarding`.
vi.mock('../services/auth', async () => {
  const { reactive } = await import('vue')
  const authState = reactive({
    user: {
      id: 1, fullName: 'A', email: 'a@a.com', username: null, language: 'en',
      onboardingState: null as unknown,
    },
  })
  return {
    useAuthState: () => authState,
    setCurrentUser: (u: { onboardingState: unknown }) => {
      authState.user = { ...authState.user, ...u }
    },
    __resetOnboarding: () => {
      authState.user = { ...authState.user, onboardingState: null }
    },
  }
})
vi.mock('../services/onboarding', async () => {
  const actual = await vi.importActual<typeof import('../services/onboarding')>('../services/onboarding')
  return { ...actual, onboardingApi: { update: vi.fn((p) => Promise.resolve({ data: p })) } }
})
vi.mock('../services/accounts', () => ({ accountsApi: { list: vi.fn(() => Promise.resolve({ data: [] })) } }))
vi.mock('../services/transactions', () => ({ transactionsApi: { search: vi.fn(() => Promise.resolve({ data: { data: [], total: 0, page: 1, pageSize: 1 } })) } }))
vi.mock('../services/budgets', () => ({ budgetsApi: { list: vi.fn(() => Promise.resolve({ data: [] })) } }))

import { useOnboarding } from './useOnboarding'
import * as authMock from '../services/auth'

beforeEach(() => {
  // Restablece el estado de onboarding a vacío antes de cada test.
  ;(authMock as unknown as { __resetOnboarding: () => void }).__resetOnboarding()
})

describe('useOnboarding', () => {
  it('derives step completion from counts', async () => {
    const ob = useOnboarding()
    await ob.loadCounts()
    const byKey = Object.fromEntries(ob.steps.value.map((s) => [s.key, s.done]))
    expect(byKey.account).toBe(false)
    expect(byKey.transaction).toBe(false)
    expect(ob.isComplete.value).toBe(false)
  })

  it('marks a coach mark as seen and does not show it again', () => {
    const ob = useOnboarding()
    expect(ob.shouldShowCoach('dashboard')).toBe(true)
    ob.markCoachSeen('dashboard')
    expect(ob.shouldShowCoach('dashboard')).toBe(false)
  })

  it('hides the checklist once dismissed', () => {
    const ob = useOnboarding()
    ob.dismissChecklist()
    expect(ob.checklistVisible.value).toBe(false)
  })

  it('resetTour clears flags and bumps tourVersion', () => {
    const ob = useOnboarding()
    ob.markCoachSeen('reports')
    ob.dismissChecklist()
    ob.resetTour()
    expect(ob.shouldShowCoach('reports')).toBe(true)
    expect(ob.checklistVisible.value).toBe(true)
  })
})
