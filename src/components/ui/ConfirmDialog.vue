<!-- src/components/ui/ConfirmDialog.vue -->
<script setup lang="ts">
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

withDefaults(
  defineProps<{
    isOpen: boolean
    title?: string
    message?: string
    confirmLabel?: string
    loading?: boolean
  }>(),
  { title: 'Are you sure?', confirmLabel: 'Delete' },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <AppModal :is-open="isOpen" :title="title" icon="warning" size="sm" @close="emit('cancel')">
    <p class="px-6 py-5 text-sm text-muted">{{ message }}</p>
    <template #footer>
      <AppButton variant="ghost" @click="emit('cancel')">Cancel</AppButton>
      <AppButton variant="danger" :loading="loading" @click="emit('confirm')">{{ confirmLabel }}</AppButton>
    </template>
  </AppModal>
</template>
