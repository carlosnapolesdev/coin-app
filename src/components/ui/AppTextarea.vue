<script setup lang="ts">
defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  id?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="field-label">{{ label }}</label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows ?? 3"
      :disabled="disabled"
      class="field-input resize-none"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>
