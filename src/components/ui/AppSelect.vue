<script setup lang="ts">
// Emits the raw string value; bind with v-model and coerce if you need a number.
defineProps<{
  modelValue?: string | number | null
  label?: string
  disabled?: boolean
  id?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="field-label">{{ label }}</label>
    <div class="relative">
      <select
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        class="field-input appearance-none pr-10"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <slot />
      </select>
      <span
        class="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-faint"
        >unfold_more</span
      >
    </div>
  </div>
</template>
