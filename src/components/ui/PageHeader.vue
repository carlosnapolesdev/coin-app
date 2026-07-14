<script setup lang="ts">
// Canonical page header. Left: mobile nav trigger + title/subtitle. Right: persistent UserMenu only.
// View controls live in per-view toolbars; the #actions slot has been retired.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UserMenu from '../common/UserMenu.vue'
import AppIconButton from './AppIconButton.vue'
import MobileNavDrawer from '../dashboard/MobileNavDrawer.vue'

withDefaults(defineProps<{ title: string; subtitle?: string; sticky?: boolean }>(), { sticky: true })

const { t } = useI18n()
const mobileNavOpen = ref(false)
</script>

<template>
  <header
    class="flex flex-col gap-4 border-b border-line bg-bg/80 px-6 py-5 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between lg:px-8"
    :class="sticky ? 'sticky top-0 z-30' : ''"
  >
    <div class="flex min-w-0 items-center gap-3">
      <AppIconButton
        icon="menu"
        class="shrink-0 md:hidden"
        :aria-label="t('sidebar.openMenu')"
        @click="mobileNavOpen = true"
      />
      <div class="min-w-0">
        <h1 class="truncate font-display text-2xl font-bold tracking-tight text-content">{{ title }}</h1>
        <p v-if="subtitle" class="mt-0.5 text-sm text-muted">{{ subtitle }}</p>
      </div>
    </div>
    <div class="flex items-center justify-end">
      <UserMenu />
    </div>
  </header>

  <MobileNavDrawer :is-open="mobileNavOpen" @close="mobileNavOpen = false" />
</template>
