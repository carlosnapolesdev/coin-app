<script setup lang="ts">
import { ref } from 'vue'
import Dashboard from './components/dashboard/Dashboard.vue'
import Login from './components/Login.vue'

const isLoggedIn = ref(false)

const handleLogin = () => {
  isLoggedIn.value = true
}
</script>

<template>
  <Login v-if="!isLoggedIn" @login="handleLogin" />
  <Dashboard v-else />
</template>

<style>
/* Global styles can stay in style.css, App.vue remains clean */
</style>