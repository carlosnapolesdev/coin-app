<script setup lang="ts">
import { AppButton, BrandMark, ThemeToggle } from '../ui'
</script>

<template>
  <header
    class="flex items-center justify-between whitespace-nowrap border-b border-line bg-bg px-6 py-4 lg:px-20"
  >
    <BrandMark :wordmark="true" />
    <div class="flex items-center gap-3">
      <ThemeToggle />
      <AppButton variant="secondary" size="md">Help</AppButton>
    </div>
  </header>
</template>
