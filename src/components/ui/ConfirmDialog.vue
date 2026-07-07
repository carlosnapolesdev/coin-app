<!-- src/components/ui/ConfirmDialog.vue -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

defineProps<{
  isOpen: boolean
  title?: string
  message?: string
  confirmLabel?: string
  loading?: boolean
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const { t } = useI18n()
</script>

<template>
  <AppModal :is-open="isOpen" :title="title ?? t('common.areYouSure')" icon="warning" size="sm" @close="emit('cancel')">
    <p class="px-6 py-5 text-sm text-muted">{{ message }}</p>
    <template #footer>
      <AppButton variant="ghost" @click="emit('cancel')">{{ t('common.cancel') }}</AppButton>
      <AppButton variant="danger" :loading="loading" @click="emit('confirm')">{{ confirmLabel ?? t('common.delete') }}</AppButton>
    </template>
  </AppModal>
</template>
