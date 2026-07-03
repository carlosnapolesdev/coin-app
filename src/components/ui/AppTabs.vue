<!-- src/components/ui/AppTabs.vue -->
<script setup lang="ts" generic="T extends string">
defineProps<{ modelValue: T; tabs: { value: T; label: string }[] }>()
defineEmits<{ 'update:modelValue': [T] }>()
</script>

<template>
  <div class="inline-flex rounded-lg border border-line bg-surface-2 p-1">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="rounded-md px-5 py-2 text-sm font-semibold transition"
      :class="modelValue === tab.value ? 'bg-surface text-content shadow-sm' : 'text-muted hover:text-content'"
      @click="$emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
