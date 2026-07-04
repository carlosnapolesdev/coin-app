<!-- src/components/common/UserMenu.vue -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { logout, useAuthState } from '../../services/auth'
import { getInitials } from '../../utils/initials'
import { ThemeToggle } from '../ui'

const router = useRouter()
const authState = useAuthState()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const toggle = () => (open.value = !open.value)
const close = () => (open.value = false)

const onDocClick = (e: MouseEvent) => {
  if (open.value && root.value && !root.value.contains(e.target as Node)) close()
}
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})

const handleSignOut = async () => {
  close()
  logout()
  await router.replace('/login')
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center gap-3 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {{ getInitials(authState.user?.fullName, authState.user?.email) }}
      </span>
      <span class="hidden min-w-0 sm:block">
        <span class="block max-w-[10rem] truncate text-sm font-semibold leading-tight text-content">
          {{ authState.user?.fullName || 'Account' }}
        </span>
        <span class="block max-w-[10rem] truncate text-xs leading-tight text-muted">
          {{ authState.user?.email }}
        </span>
      </span>
      <span class="material-symbols-outlined text-[20px] text-faint">expand_more</span>
    </button>

    <Transition name="usermenu">
      <div
        v-if="open"
        role="menu"
        class="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-elevated"
      >
        <div class="flex items-center gap-3 border-b border-line px-4 py-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {{ getInitials(authState.user?.fullName, authState.user?.email) }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-content">{{ authState.user?.fullName || 'Account' }}</p>
            <p class="truncate text-xs text-muted">{{ authState.user?.email }}</p>
          </div>
        </div>

        <div class="p-1.5">
          <RouterLink
            to="/settings"
            role="menuitem"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-2"
            @click="close"
          >
            <span class="material-symbols-outlined text-[20px]">settings</span>
            <span class="flex-1 text-left">Settings</span>
          </RouterLink>

          <div class="flex items-center justify-between rounded-lg px-3 py-2">
            <span class="flex items-center gap-3 text-sm font-medium text-content">
              <span class="material-symbols-outlined text-[20px] text-muted">contrast</span>
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>

        <div class="border-t border-line p-1.5">
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
            @click="handleSignOut"
          >
            <span class="material-symbols-outlined text-[20px]">logout</span>
            Sign out
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.usermenu-enter-active,
.usermenu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.usermenu-enter-from,
.usermenu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
