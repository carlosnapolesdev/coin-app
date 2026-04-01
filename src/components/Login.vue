<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import TopHeader from './common/TopHeader.vue'
import { getApiErrorMessage, login } from '../services/auth'

const router = useRouter()
const route = useRoute()

const isSubmitting = ref(false)
const isPasswordVisible = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const fieldErrors = reactive<Record<string, string>>({})
const form = reactive({
  identifier: '',
  password: '',
  remember: true,
})

const identifierLabel = computed(() => {
  return form.identifier.includes('@') ? 'Email Address' : 'Email or Username'
})

const clearFieldErrors = () => {
  for (const key of Object.keys(fieldErrors)) {
    delete fieldErrors[key]
  }
}

const clearError = (field?: 'identifier' | 'password') => {
  if (field) {
    delete fieldErrors[field]
  }
  errorMessage.value = ''
}

const handleLogin = async () => {
  clearFieldErrors()
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    await login(
      {
        identifier: form.identifier.trim(),
        password: form.password,
      },
      form.remember,
    )

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.replace(redirect)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as {
        message?: string
        validationErrors?: Record<string, string>
      } | undefined

      if (responseData?.validationErrors) {
        Object.assign(fieldErrors, responseData.validationErrors)
      }
    }

    errorMessage.value = getApiErrorMessage(error, 'Unable to sign in right now.')
  } finally {
    isSubmitting.value = false
  }
}

const handleCreateAccount = () => {
  router.push('/register')
}

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

onMounted(() => {
  if (typeof route.query.email === 'string') {
    form.identifier = route.query.email
  }

  if (route.query.registered === '1') {
    successMessage.value = 'Account created successfully. Sign in to continue.'
  }
})
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
    <div class="layout-container flex h-full grow flex-col">
      <!-- Top Navigation -->
      <TopHeader />

      <main class="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div class="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left Side: Marketing/Context -->
          <div class="hidden lg:flex flex-col gap-8">
            <div class="space-y-4">
              <h1 class="text-5xl font-black text-slate-900 dark:text-slate-100 leading-[1.1]">
                Master your money, <span class="text-primary">seamlessly.</span>
              </h1>
              <p class="text-lg text-slate-600 dark:text-slate-400 max-w-md">
                Join over 50,000 users tracking their wealth with real-time analytics and smart budgeting tools.
              </p>
            </div>
            <div class="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-slate-200">
              <img
                alt="Financial dashboard overview"
                class="object-cover w-full h-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrJl2CcZ6CNtV2dWvuROALmQmvH5gh-qfxfJmmnb6sgcS6IHTXREXi-HQsaQmHGlHI_2p1ksO7lIZsZJoOBVc7Lm8sMt1sySR5bdmXYHfrJPRqkL8BcXQVI7YIdNAcy7rNoPPxiUz49JRn-dfI8L8J7RIMHdSTX_o8xQf7VDQe-Zqe8wR_u1Wtnwizef43n5IgIYASY7uIzTmZKxK5LELo8X4QN7Q-y8KqdDAldLy_wfo5mvm8RIMn0OBHKEg8xxwM-zIaDXvBde58"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-8">
                <p class="text-white font-medium italic">
                  "CoinFlow changed how I see my savings. It's the best financial tool I've ever used." - Sarah J.
                </p>
              </div>
            </div>
          </div>

          <!-- Right Side: Login Card -->
          <div
            class="bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md mx-auto"
          >
            <div class="mb-8">
              <h2 class="text-3xl font-black text-slate-900 dark:text-slate-100">Welcome Back</h2>
              <p class="text-slate-500 dark:text-slate-400 mt-2">Please enter your details to sign in</p>
            </div>

            <p
              v-if="successMessage"
              class="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {{ successMessage }}
            </p>

            <p
              v-if="errorMessage"
              class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
            >
              {{ errorMessage }}
            </p>

            <!-- Social Login -->
            <div class="grid grid-cols-2 gap-4 mb-8">
              <button
                class="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <img
                  alt="Google"
                  class="w-5 h-5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXIWOhJY9wVgAlCpBGGbMa8ShKnyOWheimjgqmpn8GqkRVaNtps7n3pVk65mLbW-pR4V7jEMr8CtkH1M5ZfA1kxz2v5v0BW5PiDlAZE_pw_-jzNd1CZIUKqvpsHi8hiljmqSXXOwgQH1oeLUtALS4k5l27gRjyR3lxEfzDG1LwqV1Xgem8yYOxcU5q5cBt9g3Ic8aMapOvAMRKPSsSSLZfgjnlUPSy9tdi5Nef5dtXSGBI7GxwsakdJzz4e3fk32gjXENTucoSuyEw"
                />
                <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">Google</span>
              </button>
              <button
                class="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span class="material-symbols-outlined text-xl dark:text-white">ios</span>
                <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">Apple</span>
              </button>
            </div>

            <div class="relative flex py-5 items-center mb-4">
              <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span class="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-widest font-bold"
                >Or with email</span
              >
              <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <!-- Login Form -->
            <form class="space-y-5" @submit.prevent="handleLogin">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ identifierLabel }}</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >mail</span
                  >
                  <input
                    v-model.trim="form.identifier"
                    @input="clearError('identifier')"
                    class="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="name@company.com or username"
                    type="text"
                  />
                </div>
                <p v-if="fieldErrors.identifier" class="text-sm text-red-500">{{ fieldErrors.identifier }}</p>
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <label class="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                  <a class="text-xs font-bold text-primary hover:underline" href="#">Forgot Password?</a>
                </div>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >lock</span
                  >
                  <input
                    v-model="form.password"
                    @input="clearError('password')"
                    class="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="••••••••"
                    :type="isPasswordVisible ? 'text' : 'password'"
                  />
                  <button
                    @click="togglePasswordVisibility"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    type="button"
                  >
                    <span class="material-symbols-outlined">{{ isPasswordVisible ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                <p v-if="fieldErrors.password" class="text-sm text-red-500">{{ fieldErrors.password }}</p>
              </div>

              <div class="flex items-center gap-3 py-1">
                <input
                  v-model="form.remember"
                  class="checkbox-custom w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary bg-white dark:bg-slate-800"
                  id="remember"
                  type="checkbox"
                />
                <label class="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer" for="remember"
                  >Remember me for 30 days</label
                >
              </div>

              <button
                class="w-full py-4 bg-primary hover:bg-opacity-90 text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
                :disabled="isSubmitting"
                type="submit"
              >
                <span>{{ isSubmitting ? 'Signing In...' : 'Sign In' }}</span>
                <span class="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform"
                  >arrow_forward</span
                >
              </button>
            </form>

            <div class="mt-8 text-center">
              <p class="text-slate-600 dark:text-slate-400 text-sm">
                Don't have an account?
                <button @click="handleCreateAccount" class="text-primary font-bold hover:underline ml-1">Create an Account</button>
              </p>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="px-6 py-8 text-center">
        <p class="text-slate-400 text-xs font-medium uppercase tracking-widest">
          © 2024 CoinFlow Inc. • Secure &amp; Encrypted
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.checkbox-custom:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
}
</style>
