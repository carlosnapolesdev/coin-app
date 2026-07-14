import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { i18n } from '../i18n'
import { documentTitleFor } from './documentTitle'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import Dashboard from '../components/dashboard/Dashboard.vue'
import CategoriesView from '../components/dashboard/CategoriesView.vue'
import AccountsView from '../components/dashboard/AccountsView.vue'
import TransactionsView from '../components/dashboard/TransactionsView.vue'
import BudgetsView from '../components/dashboard/BudgetsView.vue'
import GoalsView from '../components/dashboard/GoalsView.vue'
import RecurringView from '../components/dashboard/RecurringView.vue'
import ReportsView from '../components/dashboard/ReportsView.vue'
import SettingsView from '../components/dashboard/SettingsView.vue'
import ForgotPassword from '../components/ForgotPassword.vue'
import ResetPassword from '../components/ResetPassword.vue'
import { initializeAuth, isAuthenticated } from '../services/auth'

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
})

// ...and re-apply it when the user switches language mid-session.
watch(i18n.global.locale, () => {
  document.title = documentTitleFor(router.currentRoute.value.meta)
})

export default router
