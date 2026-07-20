import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { i18n } from '../i18n'
import { documentTitleFor } from './documentTitle'
import { applyHeadFor } from './head'
import { initializeAuth, isAuthenticated } from '../services/auth'

// Route components are lazy-loaded so each view lands in its own chunk, keeping
// the initial bundle small (avoids the >500 kB single-chunk build warning).
const Login = () => import('../components/LoginView.vue')
const Register = () => import('../components/RegisterView.vue')
const ForgotPassword = () => import('../components/ForgotPassword.vue')
const ResetPassword = () => import('../components/ResetPassword.vue')
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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
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
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
      meta: { title: 'notFound.title' },
    },
  ],
})

router.beforeEach(async (to) => {
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
})

// Keep the browser tab title in sync with the active view...
router.afterEach((to) => {
  document.title = documentTitleFor(to.meta)
  applyHeadFor(to)
})

// ...and re-apply it when the user switches language mid-session.
watch(i18n.global.locale, () => {
  document.title = documentTitleFor(router.currentRoute.value.meta)
  applyHeadFor(router.currentRoute.value)
})

export default router
