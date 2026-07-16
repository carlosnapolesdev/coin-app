<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale, SUPPORTED_LOCALES, type LocaleCode } from '../../composables/useLocale'
import { changeLanguage } from '../../services/auth'

const { t } = useI18n()
const { locale } = useLocale()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const toggle = () => (open.value = !open.value)
const close = () => (open.value = false)

const select = (code: LocaleCode) => {
  changeLanguage(code)
  close()
}

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
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      :aria-label="t('languagePicker.label')"
      :title="t('languagePicker.label')"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <span class="material-symbols-outlined text-[18px]">translate</span>
      <span class="uppercase">{{ locale }}</span>
    </button>

    <Transition name="usermenu">
      <div
        v-if="open"
        role="menu"
        class="surface-glass absolute right-0 z-40 mt-2 w-40 overflow-hidden rounded-xl"
      >
        <button
          v-for="code in SUPPORTED_LOCALES"
          :key="code"
          type="button"
          role="menuitem"
          class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-content transition-colors hover:bg-surface-2"
          :class="locale === code ? 'text-primary' : ''"
          @click="select(code)"
        >
          {{ t(`languagePicker.${code}`) }}
          <span v-if="locale === code" class="material-symbols-outlined text-[18px]">check</span>
        </button>
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
