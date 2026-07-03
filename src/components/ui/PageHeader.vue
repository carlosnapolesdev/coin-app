<script setup lang="ts">
// Canonical page header. Left: title/subtitle. Right: persistent UserMenu.
// The #actions slot is transitional — view controls are moving into per-view
// toolbars; the slot is retired once every view has migrated.
import UserMenu from '../common/UserMenu.vue'
withDefaults(defineProps<{ title: string; subtitle?: string; sticky?: boolean }>(), { sticky: true })
</script>

<template>
  <header
    class="flex flex-col gap-4 border-b border-line bg-bg/80 px-6 py-5 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between lg:px-8"
    :class="sticky ? 'sticky top-0 z-30' : ''"
  >
    <div class="min-w-0">
      <h1 class="truncate font-display text-2xl font-bold tracking-tight text-content">{{ title }}</h1>
      <p v-if="subtitle" class="mt-0.5 text-sm text-muted">{{ subtitle }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3 lg:justify-end">
      <slot name="actions" />
      <UserMenu />
    </div>
  </header>
</template>
