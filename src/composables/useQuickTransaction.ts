import { onScopeDispose, ref } from 'vue'

// Global entry point for "new transaction", the app's primary action. Adding one
// used to require navigating to Transactions first; the trigger now lives in the
// page header, so the open flag has to be shared by components that never see
// each other: the header button, the empty state of a list, and the single modal
// host. Module scope is that shared ground.
const isOpen = ref(false)

// Several views render data a new transaction invalidates (balances, lists,
// reports). They subscribe here instead of receiving the news through props,
// because the modal is nowhere near them in the component tree.
const listeners = new Set<() => void>()

export function useQuickTransaction() {
  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  // Bound to the caller's effect scope: a view that navigated away must stop
  // refetching. Callers are components, so the scope is their lifetime.
  const onCreated = (listener: () => void) => {
    listeners.add(listener)
    onScopeDispose(() => {
      listeners.delete(listener)
    })
  }

  // Iterates a copy: a listener that tears down its own scope while running
  // would otherwise mutate the set mid-iteration.
  const emitCreated = () => {
    for (const listener of [...listeners]) listener()
  }

  return { isOpen, open, close, onCreated, emitCreated }
}
