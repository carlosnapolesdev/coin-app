<script setup lang="ts">
defineProps<{
  userName: string
}>()
</script>

<template>
  <header class="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-8 py-4 flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Hello, {{ userName }}!</h2>
      <p class="text-sm text-slate-500">Welcome back to your financial overview.</p>
    </div>
    <div class="flex items-center gap-4">
      <div class="relative flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 cursor-pointer shadow-sm">
        <span class="material-symbols-outlined text-slate-400 mr-2 text-xl">calendar_today</span>
        <span class="text-sm font-medium pr-4">This Month</span>
        <span class="material-symbols-outlined text-slate-400 text-xl">expand_more</span>
      </div>
      <button class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors relative">
        <span class="material-symbols-outlined">notifications</span>
        <span class="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-background-light"></span>
      </button>
      <div class="size-10 rounded-full bg-slate-200 overflow-hidden" 
           style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCffy4reO3iWHxxw9gfFHXUeSnumSya6TwmBcL7M5BqMfXQOr8G-8b9DzKw1X0ff0drBFJ7J99O4P0qY0zJlaNnQqM4_gu04RPyDnusggSq-ff2A4DqLrrdsub8jkjpMi_xgHN5RgrMTzJMb7bF3QLToa7VGBHBc5GX13rRfJU0bAZ2HqWxR8hmN-FWz7aAEiU21jhF0jsD4B_60ofWp6tl1QkF696AJvZ1DNq7oCoYpB25VhtBptN4h5D7bDaPwGz3S6hGeSa1aII'); background-size: cover;">
      </div>
    </div>
  </header>
</template>
