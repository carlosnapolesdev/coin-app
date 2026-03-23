<script setup lang="ts">
// TopHeader.vue
</script>

<template>
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
</template>
