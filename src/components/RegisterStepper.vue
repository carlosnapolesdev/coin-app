<script setup lang="ts">
interface Step {
  n: number
  icon: string
  label: string
}

defineProps<{
  steps: Step[]
  currentStep: number
  currentLabel: string
}>()
</script>

<template>
  <div class="mx-auto w-full max-w-2xl">
    <ol class="flex items-start">
      <template v-for="(step, index) in steps" :key="step.n">
        <li
          v-if="index > 0"
          class="mt-4 h-0.5 flex-1 transition-colors duration-500 lg:mt-5"
          :class="currentStep > step.n - 1 ? 'bg-primary' : 'bg-line'"
          aria-hidden="true"
        ></li>
        <li class="flex flex-col items-center">
          <div
            class="flex size-9 items-center justify-center rounded-full transition duration-300 lg:size-10"
            :class="currentStep > step.n
              ? 'border-2 border-primary bg-primary/15 text-primary'
              : currentStep === step.n
                ? 'bg-primary text-primary-fg shadow-lg shadow-primary/30'
                : 'border-2 border-line text-faint'"
          >
            <span class="material-symbols-outlined text-[20px]">
              {{ currentStep > step.n ? 'check' : step.icon }}
            </span>
          </div>
          <span
            class="mt-2 hidden max-w-[6.5rem] text-center text-xs leading-tight transition-colors lg:block"
            :class="currentStep === step.n ? 'font-semibold text-content' : 'text-muted'"
          >
            {{ step.label }}
          </span>
        </li>
      </template>
    </ol>

    <p class="mt-3 text-center text-sm font-medium text-muted lg:hidden">
      {{ currentLabel }}
    </p>
  </div>
</template>
