<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogin = () => {
  router.push('/dashboard')
}
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
    <div class="layout-container flex h-full grow flex-col">
      <!-- Top Navigation -->
      <header
        class="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 lg:px-20 py-4 bg-background-light dark:bg-background-dark"
      >
        <div class="flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div class="size-8 bg-primary rounded-lg flex items-center justify-center text-background-dark">
            <span class="material-symbols-outlined font-bold">account_balance_wallet</span>
          </div>
          <h2 class="text-xl font-extrabold leading-tight tracking-tight">CoinFlow</h2>
        </div>
        <div class="flex items-center gap-4">
          <button
            class="hidden md:flex min-w-[84px] cursor-pointer items-center justify-center rounded-xl h-10 px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold"
          >
            <span>English</span>
          </button>
          <button
            class="flex min-w-[84px] cursor-pointer items-center justify-center rounded-xl h-10 px-4 bg-primary text-slate-900 text-sm font-bold"
          >
            <span>Help</span>
          </button>
        </div>
      </header>

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
                <label class="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >mail</span
                  >
                  <input
                    class="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="name@company.com"
                    type="email"
                  />
                </div>
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
                    class="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="••••••••"
                    type="password"
                  />
                  <button
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    type="button"
                  >
                    <span class="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-3 py-1">
                <input
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
                type="submit"
              >
                <span>Sign In</span>
                <span class="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform"
                  >arrow_forward</span
                >
              </button>
            </form>

            <div class="mt-8 text-center">
              <p class="text-slate-600 dark:text-slate-400 text-sm">
                Don't have an account?
                <a class="text-primary font-bold hover:underline ml-1" href="#">Create an Account</a>
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
