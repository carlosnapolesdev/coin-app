<script setup lang="ts">
import type { LegalBlock } from '../../content/legal'

defineProps<{ blocks: LegalBlock[] }>()
</script>

<template>
  <div class="space-y-4">
    <template v-for="(block, i) in blocks" :key="i">
      <p v-if="block.kind === 'paragraph'" class="leading-relaxed text-muted">{{ block.text }}</p>

      <ul v-else-if="block.kind === 'list'" class="list-disc space-y-2 pl-6 text-muted">
        <li v-for="(item, j) in block.items" :key="j" class="leading-relaxed">{{ item }}</li>
      </ul>

      <div v-else-if="block.kind === 'note'" class="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <span class="material-symbols-outlined mt-0.5 text-primary" aria-hidden="true">info</span>
        <p class="leading-relaxed text-content">{{ block.text }}</p>
      </div>

      <div v-else-if="block.kind === 'placeholder'" class="flex items-start gap-3 rounded-xl border border-dashed border-line-strong bg-surface-2 p-4">
        <span class="material-symbols-outlined mt-0.5 text-faint" aria-hidden="true">edit_note</span>
        <p class="font-medium leading-relaxed text-faint">{{ block.text }}</p>
      </div>
    </template>
  </div>
</template>
