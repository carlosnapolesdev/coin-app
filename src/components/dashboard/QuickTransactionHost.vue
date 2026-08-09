<script setup lang="ts">
// Sole owner of the "new transaction" modal. PageHeader mounts one of these per
// page, so the action is reachable from every authenticated view.
// TransactionsView keeps its own modal instance for *editing* an existing row;
// creation always goes through here, which is why the onboarding milestone
// lives here too and no longer fires on an edit.
import { defineAsyncComponent, ref, watch } from 'vue'
import { useQuickTransaction } from '../../composables/useQuickTransaction'
import { useOnboarding } from '../../composables/useOnboarding'

const AddTransactionModal = defineAsyncComponent(() => import('./AddTransactionModal.vue'))

const { isOpen, close, emitCreated } = useQuickTransaction()
const { notifyTransactionCreated, flushCelebration } = useOnboarding()

// The async chunk is fetched when the component first renders, so rendering it
// unconditionally would pull the modal into every view that has a header. It
// stays mounted after the first open: the chunk is already paid for and the
// form resets itself on each open.
const hasBeenOpened = ref(false)
watch(isOpen, (open) => {
  if (open) hasBeenOpened.value = true
})

const onSaved = () => {
  notifyTransactionCreated()
  emitCreated()
}

// El modal de alta queda abierto tras crear (para adjuntos); mostramos la
// celebración recién al cerrarlo para no apilar dos overlays.
const onClose = () => {
  close()
  flushCelebration()
}
</script>

<template>
  <AddTransactionModal
    v-if="isOpen || hasBeenOpened"
    :is-open="isOpen"
    mode="create"
    @close="onClose"
    @saved="onSaved"
  />
</template>
