<script setup lang="ts">
// Canonical page header. Left: mobile nav trigger + title/subtitle. Right: the
// global "new transaction" action and the persistent UserMenu.
// The #actions slot stays retired and view controls still live in per-view
// toolbars — what sits here is not a view control but *the* primary action of
// the app, identical on every screen, which is why it is worth the fixed space.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UserMenu from '../common/UserMenu.vue'
import AppButton from './AppButton.vue'
import AppIconButton from './AppIconButton.vue'
import CoachMark from '../onboarding/CoachMark.vue'
import MobileNavDrawer from '../dashboard/MobileNavDrawer.vue'
import QuickTransactionHost from '../dashboard/QuickTransactionHost.vue'
import { useQuickTransaction } from '../../composables/useQuickTransaction'

withDefaults(defineProps<{ title: string; subtitle?: string; sticky?: boolean }>(), { sticky: true })

const { t } = useI18n()
const { open } = useQuickTransaction()
const mobileNavOpen = ref(false)
</script>

<template>
  <header
    class="flex flex-col gap-4 border-b border-line bg-bg/65 px-6 py-5 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between lg:px-8"
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
    <div class="flex items-center justify-end gap-3">
      <CoachMark
        coach-key="transactions"
        :text="t('onboarding.coach.transactions')"
        placement="bottom"
        align="right"
      >
        <!-- Narrow screens keep the icon only; the label is redundant there and
             the header still has to fit a title and the user menu. -->
        <AppButton icon="add" class="px-3 sm:px-4" :aria-label="t('transactions.actions.add')" @click="open">
          <span class="hidden sm:inline">{{ t('transactions.actions.add') }}</span>
        </AppButton>
      </CoachMark>
      <UserMenu />
    </div>
  </header>

  <MobileNavDrawer :is-open="mobileNavOpen" @close="mobileNavOpen = false" />
  <QuickTransactionHost />
</template>
