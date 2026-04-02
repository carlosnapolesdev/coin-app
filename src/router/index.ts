import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import Dashboard from '../components/dashboard/Dashboard.vue'
import CategoriesView from '../components/dashboard/CategoriesView.vue'
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
      meta: { publicOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { publicOnly: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true },
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoriesView,
      meta: { requiresAuth: true },
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

export default router
