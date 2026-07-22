import { watch } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory, type Router } from 'vue-router'
import { i18n } from '../i18n'
import { documentTitleFor } from './documentTitle'
import { applyHeadFor } from './head'
import { initializeAuth, isAuthenticated, useAuthState } from '../services/auth'
import { currencyGuardTarget } from './currencyGuard'

// Route components are lazy-loaded so each view lands in its own chunk, keeping
// the initial bundle small (avoids the >500 kB single-chunk build warning).
const Landing = () => import('../components/LandingView.vue')
const Login = () => import('../components/LoginView.vue')
const Register = () => import('../components/RegisterView.vue')
const ForgotPassword = () => import('../components/ForgotPassword.vue')
const ResetPassword = () => import('../components/ResetPassword.vue')
const VerifyEmail = () => import('../components/VerifyEmail.vue')
const Dashboard = () => import('../components/dashboard/DashboardView.vue')
const CategoriesView = () => import('../components/dashboard/CategoriesView.vue')
const AccountsView = () => import('../components/dashboard/AccountsView.vue')
const TransactionsView = () => import('../components/dashboard/TransactionsView.vue')
const BudgetsView = () => import('../components/dashboard/BudgetsView.vue')
const GoalsView = () => import('../components/dashboard/GoalsView.vue')
const RecurringView = () => import('../components/dashboard/RecurringView.vue')
const ReportsView = () => import('../components/dashboard/ReportsView.vue')
const SettingsView = () => import('../components/dashboard/SettingsView.vue')
const LegalPage = () => import('../components/legal/LegalPage.vue')
const NotFound = () => import('../components/NotFound.vue')
const WelcomeCurrency = () => import('../components/WelcomeCurrencyView.vue')

// Exported as a constant so vite-ssg can build its own prerender router from
// the same definition (see src/main.ts). The default export below keeps the
// existing `import router from './router'` shape used by tests.
export const routes = [
  {
    path: '/',
    name: 'landing',
    component: Landing,
    meta: { title: 'landing.hero.title', authenticatedRedirect: 'dashboard' },
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { publicOnly: true, title: 'auth.login.signIn' },
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: { publicOnly: true, title: 'auth.login.createAccount' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPassword,
    meta: { publicOnly: true, title: 'auth.forgotPassword.title' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPassword,
    meta: { publicOnly: true, title: 'auth.resetPassword.title' },
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: VerifyEmail,
    meta: { publicOnly: true, title: 'auth.verifyEmail.title' },
  },
  {
    path: '/legal/privacy',
    name: 'legal-privacy',
    component: LegalPage,
    props: { slug: 'privacy', titleKey: 'legal.privacy.title' },
    meta: { title: 'legal.privacy.title' },
  },
  {
    path: '/legal/terms',
    name: 'legal-terms',
    component: LegalPage,
    props: { slug: 'terms', titleKey: 'legal.terms.title' },
    meta: { title: 'legal.terms.title' },
  },
  {
    path: '/legal/cookies',
    name: 'legal-cookies',
    component: LegalPage,
    props: { slug: 'cookies', titleKey: 'legal.cookies.title' },
    meta: { title: 'legal.cookies.title' },
  },
  {
    path: '/legal/legal-notice',
    name: 'legal-legal-notice',
    component: LegalPage,
    props: { slug: 'legal-notice', titleKey: 'legal.legalNotice.title' },
    meta: { title: 'legal.legalNotice.title' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, title: 'sidebar.nav.dashboard' },
  },
  {
    path: '/accounts',
    name: 'accounts',
    component: AccountsView,
    meta: { requiresAuth: true, title: 'sidebar.nav.accounts' },
  },
  {
    path: '/transactions',
    name: 'transactions',
    component: TransactionsView,
    meta: { requiresAuth: true, title: 'sidebar.nav.transactions' },
  },
  {
    path: '/budgets',
    name: 'budgets',
    component: BudgetsView,
    meta: { requiresAuth: true, title: 'sidebar.nav.budgets' },
  },
  {
    path: '/goals',
    name: 'goals',
    component: GoalsView,
    meta: { requiresAuth: true, title: 'sidebar.nav.goals' },
  },
  {
    path: '/recurring',
    name: 'recurring',
    component: RecurringView,
    meta: { requiresAuth: true, title: 'sidebar.nav.recurring' },
  },
  {
    path: '/reports',
    name: 'reports',
    component: ReportsView,
    meta: { requiresAuth: true, title: 'sidebar.nav.reports' },
  },
  {
    path: '/categories',
    name: 'categories',
    component: CategoriesView,
    meta: { requiresAuth: true, title: 'sidebar.nav.categories' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true, title: 'sidebar.nav.settings' },
  },
  {
    path: '/welcome/currency',
    name: 'welcome-currency',
    component: WelcomeCurrency,
    meta: { requiresAuth: true, title: 'welcome.currency.title' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: { title: 'notFound.title' },
  },
]

const router = createRouter({
  // `createWebHistory` reads from `window` during construction; under SSR
  // (vite-ssg prerender) `window` is undefined, so fall back to memory history.
  // The default-exported router is only consumed by unit tests, and `resolve()`
  // doesn't depend on the history implementation, so this swap is invisible
  // to every test that imports this router.
  history: typeof window === 'undefined' ? createMemoryHistory() : createWebHistory(),
  routes,
})

// Shared guard logic — registered on the test router here AND on the
// prerender router inside the ViteSSG setup callback, so both run the same
// auth/currency/title flow without diverging.
export function installGuards(target: Router): void {
  target.beforeEach(async (to) => {
    await initializeAuth()

    if (to.meta.requiresAuth && !isAuthenticated()) {
      return {
        name: 'login',
        query: {
          redirect: to.fullPath,
        },
      }
    }

    if (to.meta.publicOnly && isAuthenticated()) {
      return { name: 'dashboard' }
    }

    if (to.meta.authenticatedRedirect && isAuthenticated()) {
      return { name: to.meta.authenticatedRedirect }
    }

    const currencyTarget = currencyGuardTarget(
      isAuthenticated(),
      useAuthState().user?.requiresCurrencySetup,
      typeof to.name === 'string' ? to.name : null,
    )
    if (currencyTarget && to.name !== currencyTarget) {
      return { name: currencyTarget }
    }
  })
}

// Document title and meta tags. Both touch `document`, which is undefined
// during prerender — the caller is responsible for skipping it under SSR.
export function installHead(target: Router): void {
  target.afterEach((to) => {
    if (typeof document === 'undefined') return
    document.title = documentTitleFor(to.meta)
    applyHeadFor(to)
  })

  watch(i18n.global.locale, () => {
    if (typeof document === 'undefined') return
    document.title = documentTitleFor(target.currentRoute.value.meta)
    applyHeadFor(target.currentRoute.value)
  })
}

installGuards(router)
installHead(router)

export default router

// Module augmentation: the landing route declares an authenticatedRedirect so
// signed-in visitors hit /dashboard instead of the public marketing page.
declare module 'vue-router' {
  interface RouteMeta {
    authenticatedRedirect?: string
  }
}