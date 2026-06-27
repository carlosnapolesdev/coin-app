<script setup lang="ts">
defineProps<{
  modelValue?: string | number
  label?: string
  icon?: string
  type?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  id?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="field-label">{{ label }}</label>
    <div class="relative">
      <span
        v-if="icon"
        class="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint"
        >{{ icon }}</span
      >
      <input
        :id="id"
        :type="type ?? 'text'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="field-input"
        :class="[icon ? 'pl-11' : '', error ? '!border-danger focus:!ring-danger/20' : '']"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <p v-if="error" class="mt-1.5 text-xs font-medium text-danger">{{ error }}</p>
  </div>
</template>
