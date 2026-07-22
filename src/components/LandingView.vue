<script setup lang="ts">
import LandingHero from './landing/LandingHero.vue'
import LandingFeatures from './landing/LandingFeatures.vue'
import LandingHowItWorks from './landing/LandingHowItWorks.vue'
import LandingFooter from './landing/LandingFooter.vue'
</script>

<template>
  <main class="min-h-screen bg-bg font-body text-content">
    <LandingHero />
    <LandingFeatures />
    <LandingHowItWorks />
    <LandingFooter />
  </main>
</template>