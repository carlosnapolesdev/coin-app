<!-- src/components/common/NotificationBell.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  notificationsApi,
  type NotificationItem,
} from '../../services/notifications'
import { isAuthenticated } from '../../services/auth'
import { logError } from '../../utils/logError'
import { EmptyState } from '../ui'

const { t, locale } = useI18n()
const router = useRouter()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const items = ref<NotificationItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const unreadCount = computed(() => items.value.filter((n) => !n.isRead).length)

const POLL_INTERVAL_MS = 60_000

const toggle = () => {
  open.value = !open.value
  if (open.value) void refresh()
}
const close = () => {
  open.value = false
}

const onDocClick = (e: MouseEvent) => {
  if (open.value && root.value && !root.value.contains(e.target as Node)) close()
}
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

async function refresh(): Promise<void> {
  // TopHeader se monta también en vistas públicas (login, registro, reset,
  // legal, 404). Sin esta guarda la campana pedía /users/me/notifications sin
  // sesión: 401 en consola al cargar y otro cada minuto por el polling.
  if (!isAuthenticated()) return
  loading.value = true
  error.value = null
  try {
    const { data } = await notificationsApi.list(false)
    items.value = data
  } catch (err: unknown) {
    logError('notifications.refresh', err)
    error.value = (err as Error).message ?? t('notifications.errors.load')
  } finally {
    loading.value = false
  }
}

async function handleItemClick(item: NotificationItem): Promise<void> {
  if (item.isRead) {
    close()
    return
  }
  const previous = items.value
  items.value = items.value.map((n) =>
    n.id === item.id ? { ...n, isRead: true } : n,
  )
  close()
  try {
    await notificationsApi.markRead(item.id)
  } catch (err: unknown) {
    logError('notifications.handleItemClick', err)
    items.value = previous
  }
}

async function handleMarkAll(): Promise<void> {
  const previous = items.value
  items.value = items.value.map((n) => ({ ...n, isRead: true }))
  try {
    await notificationsApi.markAllRead()
  } catch (err: unknown) {
    logError('notifications.handleMarkAll', err)
    items.value = previous
  }
}

const formattedDate = (iso: string | null): string => {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch (err: unknown) {
    // Legitimate recovery for an invalid locale; still reported, because
    // systematic occurrences would indicate a language configuration bug.
    logError('notifications.formattedDate', err)
    return iso
  }
}

const iconForType = (type: NotificationItem['type']): string => {
  switch (type) {
    case 'BUDGET_EXCEEDED':
      return 'donut_large'
    case 'LOW_BALANCE':
      return 'account_balance'
    case 'UPCOMING_PAYMENT':
      return 'event_upcoming'
    default:
      return 'notifications'
  }
}

const tintForType = (type: NotificationItem['type']): string => {
  switch (type) {
    case 'BUDGET_EXCEEDED':
      return 'bg-danger/10 text-danger'
    case 'LOW_BALANCE':
      return 'bg-warning/10 text-warning'
    case 'UPCOMING_PAYMENT':
      return 'bg-info/10 text-info'
    default:
      return 'bg-surface-2 text-muted'
  }
}

let pollHandle: ReturnType<typeof setInterval> | null = null
const stopRouterListener = router.afterEach(() => {
  void refresh()
})

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
  void refresh()
  pollHandle = setInterval(() => {
    void refresh()
  }, POLL_INTERVAL_MS)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  if (pollHandle) clearInterval(pollHandle)
  stopRouterListener()
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:bg-surface-2 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      :aria-label="t('notifications.bellLabel', { count: unreadCount })"
      :aria-expanded="open"
      :aria-haspopup="true"
      :title="t('notifications.title')"
      data-testid="notification-bell"
      @click="toggle"
    >
      <span class="material-symbols-outlined text-[20px]">notifications</span>
      <span
        v-if="unreadCount > 0"
        class="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-overlay-fg shadow-sm"
        data-testid="notification-bell-badge"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <Transition name="bell-panel">
      <div
        v-if="open"
        role="dialog"
        :aria-label="t('notifications.title')"
        class="surface-glass absolute right-0 z-40 mt-2 w-[22rem] max-w-[90vw] overflow-hidden rounded-2xl"
        data-testid="notification-panel"
      >
        <div class="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 class="font-display text-sm font-bold text-content">
            {{ t('notifications.title') }}
          </h2>
          <button
            v-if="unreadCount > 0"
            type="button"
            class="text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            data-testid="notification-mark-all"
            @click="handleMarkAll"
          >
            {{ t('notifications.markAllRead') }}
          </button>
        </div>

        <div class="max-h-[60vh] overflow-y-auto">
          <div
            v-if="loading && items.length === 0"
            class="flex items-center justify-center gap-3 px-4 py-8 text-sm text-muted"
          >
            <span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            {{ t('common.loading') }}
          </div>

          <div
            v-else-if="error"
            class="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-danger"
            role="alert"
          >
            <span class="material-symbols-outlined text-[20px]">error</span>
            <span>{{ error }}</span>
            <button
              type="button"
              class="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-content hover:bg-surface-2"
              @click="refresh"
            >
              {{ t('common.retry') }}
            </button>
          </div>

          <EmptyState
            v-else-if="items.length === 0"
            :icon="'notifications_none'"
            :title="t('notifications.empty.title')"
            :description="t('notifications.empty.description')"
          />

          <ul v-else role="list" class="divide-y divide-line">
            <li
              v-for="item in items"
              :key="item.id"
            >
              <button
                type="button"
                class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2"
                :class="item.isRead ? '' : 'bg-primary/[0.04]'"
                :aria-label="item.title"
                data-testid="notification-item"
                @click="handleItemClick(item)"
              >
                <span
                  class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full"
                  :class="tintForType(item.type)"
                  aria-hidden="true"
                >
                  <span class="material-symbols-outlined text-[18px]">{{ iconForType(item.type) }}</span>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline gap-2">
                    <span
                      class="truncate text-sm"
                      :class="item.isRead ? 'font-medium text-content' : 'font-semibold text-content'"
                    >
                      {{ item.title }}
                    </span>
                    <span
                      v-if="!item.isRead"
                      class="inline-block size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    ></span>
                  </span>
                  <span class="mt-0.5 block text-xs text-muted">{{ item.body }}</span>
                  <span class="mt-1 block text-[11px] text-faint">{{ formattedDate(item.createdAt) }}</span>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.bell-panel-enter-active,
.bell-panel-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.bell-panel-enter-from,
.bell-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
