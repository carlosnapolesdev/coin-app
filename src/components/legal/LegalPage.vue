<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TopHeader from '../common/TopHeader.vue'
import LegalBlocks from './LegalBlocks.vue'
import LegalFooter from './LegalFooter.vue'
import { getLegalDocument, resolveLegalLocale, type LegalSlug } from '../../content/legal'

const props = defineProps<{ slug: LegalSlug; titleKey: string }>()
const { t, locale } = useI18n()

const doc = computed(() => getLegalDocument(props.slug, resolveLegalLocale(locale.value)))
const title = computed(() => t(props.titleKey))
const updatedLabel = computed(() =>
  t('legal.updatedAt', {
    // Format in UTC so the stored calendar date (e.g. 2026-07-14, parsed as UTC
    // midnight) is not shown a day earlier for viewers in negative-offset zones.
    date: new Date(doc.value.updatedAt).toLocaleDateString(locale.value, { timeZone: 'UTC' }),
  }),
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg font-display">
    <TopHeader />

    <main class="mx-auto w-full max-w-3xl flex-1 px-6 py-12 lg:px-8">
      <header class="mb-8">
        <h1 class="text-3xl font-black text-content lg:text-4xl">{{ title }}</h1>
        <p class="mt-2 text-sm text-faint">{{ updatedLabel }}</p>
        <p v-if="doc.intro" class="mt-4 leading-relaxed text-muted">{{ doc.intro }}</p>
        <p class="mt-4 text-xs italic text-faint">{{ t('legal.authoritativeNote') }}</p>
      </header>

      <!-- Table of contents -->
      <nav class="surface-card mb-10 p-5">
        <p class="mb-3 text-xs font-bold uppercase tracking-widest text-primary">{{ t('legal.tableOfContents') }}</p>
        <ul class="space-y-1.5">
          <li v-for="section in doc.sections" :key="section.id">
            <a :href="`#${section.id}`" class="text-sm font-medium text-muted hover:text-primary hover:underline">{{ section.heading }}</a>
          </li>
        </ul>
      </nav>

      <!-- Sections -->
      <div class="space-y-10">
        <section v-for="section in doc.sections" :id="section.id" :key="section.id" class="scroll-mt-24">
          <h2 class="mb-4 text-xl font-bold text-content">{{ section.heading }}</h2>
          <LegalBlocks :blocks="section.blocks" />
        </section>
      </div>
    </main>

    <LegalFooter />
  </div>
</template>
