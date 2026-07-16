<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { BrandMark } from '../ui'
import { NAV_ITEMS } from '../../navigation/navItems'

const { t } = useI18n()
const route = useRoute()
</script>

<template>
  <aside class="surface-panel wm-logo-side hidden h-screen w-64 flex-shrink-0 flex-col border-r border-line md:flex">
    <div class="px-6 py-6">
      <BrandMark :subtitle="t('sidebar.subtitle')" />
    </div>

    <nav class="flex-1 space-y-1 px-4 py-2" :aria-label="t('sidebar.navigationLabel')">
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.routeName"
        :to="{ name: item.routeName }"
        class="nav-link w-full"
        :class="item.routeName === route.name ? 'nav-link-active' : ''"
      >
        <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
        <span>{{ t(item.labelKey) }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>
