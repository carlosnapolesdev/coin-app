<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { BrandMark } from '../ui'
import { NAV_ITEMS } from '../../navigation/navItems'
import { useOnboarding } from '../../composables/useOnboarding'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { resetTour } = useOnboarding()
const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
// Element focus returns to when the drawer closes (the hamburger trigger).
let previouslyFocused: HTMLElement | null = null

// Navigating away must dismiss the drawer. Tapping the already-active link
// fires no route change, so each RouterLink closes it directly (@click below);
// this watch covers navigation triggered from elsewhere while it is open.
watch(
  () => route.fullPath,
  () => emit('close'),
)

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close')
    return
  }
  // Trap Tab focus inside the dialog so it cannot reach the inert page behind.
  if (e.key !== 'Tab' || !dialog.value) return
  const focusable = Array.from(dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE))
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) return
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

const appRoot = () => document.getElementById('app')

const activate = async () => {
  previouslyFocused = document.activeElement as HTMLElement | null
  // Take the rest of the page out of the a11y/interaction tree and lock scroll.
  appRoot()?.setAttribute('inert', '')
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  closeButton.value?.focus()
}

const deactivate = () => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  // Restore interactivity BEFORE returning focus — the trigger lives in #app.
  appRoot()?.removeAttribute('inert')
  previouslyFocused?.focus()
  previouslyFocused = null
}

watch(
  () => props.isOpen,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) activate()
    else deactivate()
  },
)

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  appRoot()?.removeAttribute('inert')
})

const replayTour = async () => {
  resetTour()
  emit('close')
  await router.push({ name: 'dashboard' })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" ref="dialog" class="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" :aria-label="t('sidebar.navigationLabel')">
        <!-- El scrim solo cubre el área fuera del panel: si tapara también la zona
             del panel, aplanaría el fondo y el blur del cristal no tendría nada
             que revelar. left = w-72 (18rem) acotado por max-w-[85vw] del panel. -->
        <div class="drawer-scrim absolute inset-y-0 right-0 left-[min(18rem,85vw)] bg-scrim/60" @click="emit('close')" />
        <div class="drawer-panel surface-glass absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain">
          <div class="flex items-center justify-between px-6 py-6">
            <BrandMark :subtitle="t('sidebar.subtitle')" />
            <button
              ref="closeButton"
              type="button"
              :aria-label="t('sidebar.closeMenu')"
              class="flex size-9 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              @click="emit('close')"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav class="flex-1 space-y-1 px-4 py-2" :aria-label="t('sidebar.navigationLabel')">
            <RouterLink
              v-for="item in NAV_ITEMS"
              :key="item.routeName"
              :to="{ name: item.routeName }"
              class="nav-link w-full"
              :class="item.routeName === route.name ? 'nav-link-active' : ''"
              @click="emit('close')"
            >
              <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
              <span>{{ t(item.labelKey) }}</span>
            </RouterLink>
          </nav>

          <div class="border-t border-line p-4">
            <button
              type="button"
              class="nav-link w-full"
              @click="replayTour"
            >
              <span class="material-symbols-outlined text-[22px]" aria-hidden="true">help</span>
              <span>{{ t('onboarding.help.replayTour') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Compositor-friendly only: opacity on the scrim, transform on the panel. */
.drawer-enter-active .drawer-scrim,
.drawer-leave-active .drawer-scrim {
  transition: opacity 0.2s ease;
}
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.2s ease;
}
.drawer-enter-from .drawer-scrim,
.drawer-leave-to .drawer-scrim {
  opacity: 0;
}
.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(-100%);
}
@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active .drawer-scrim,
  .drawer-leave-active .drawer-scrim,
  .drawer-enter-active .drawer-panel,
  .drawer-leave-active .drawer-panel {
    transition: none;
  }
}

/* El panel es cristal SIN scrim detrás: en el peor caso (relleno primary
   difuminado bajo el panel) el texto muted cae a ~2.9:1. Los ítems de nav
   suben a content (≥7.7:1 en ese peor caso); el activo sigue en primary. */
.drawer-panel .nav-link {
  color: rgb(var(--color-content));
}
.drawer-panel .nav-link-active {
  color: rgb(var(--color-primary));
}
</style>
