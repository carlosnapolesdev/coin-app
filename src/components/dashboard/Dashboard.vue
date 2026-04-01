<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import StatsCards from './StatsCards.vue'
import BalanceChart from './BalanceChart.vue'
import SpendingCategories from './SpendingCategories.vue'
import RecentTransactions from './RecentTransactions.vue'
import { useAuthState } from '../../services/auth'

const authState = useAuthState()
const userName = computed(() => {
  return authState.user?.fullName?.split(' ')[0] ?? 'User'
})
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <Sidebar />
    
    <main class="flex-1 overflow-y-auto">
      <Header :user-name="userName" />
      
      <div class="p-8 space-y-8 max-w-7xl mx-auto">
        <!-- Key Stats -->
        <StatsCards />
        
        <!-- Main Chart -->
        <BalanceChart />
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Spending Categories -->
          <SpendingCategories />
          
          <!-- Recent Transactions -->
          <RecentTransactions />
        </div>
      </div>
    </main>
  </div>
</template>
