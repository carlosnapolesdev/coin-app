<script setup lang="ts">
import OnboardingCelebration from './components/onboarding/OnboardingCelebration.vue'
import ToastContainer from './components/ToastContainer.vue'
</script>

<template>
  <RouterView />
  <OnboardingCelebration />
  <ToastContainer />
</template>

<style>
/* Global styles can stay in style.css, App.vue remains clean */
</style>
