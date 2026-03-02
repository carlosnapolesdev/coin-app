<template>
  <div class="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
    <div class="flex justify-between items-center mb-6">
      <h4 class="font-bold text-lg">Balance Trend (Last 30 Days)</h4>
      <div class="flex gap-2">
        <button class="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-zinc-800">Income</button>
        <button class="px-3 py-1 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800">Outcome</button>
      </div>
    </div>
    <div class="h-64 w-full">
      <svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
        <defs>
          <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#2ecc70" stop-opacity="0.3"></stop>
            <stop offset="100%" stop-color="#2ecc70" stop-opacity="0"></stop>
          </linearGradient>
        </defs>
        <!-- Grid Lines -->
        <line stroke="#f1f5f9" stroke-width="1" x1="0" x2="1000" y1="40" y2="40"></line>
        <line stroke="#f1f5f9" stroke-width="1" x1="0" x2="1000" y1="80" y2="80"></line>
        <line stroke="#f1f5f9" stroke-width="1" x1="0" x2="1000" y1="120" y2="120"></line>
        <line stroke="#f1f5f9" stroke-width="1" x1="0" x2="1000" y1="160" y2="160"></line>
        <!-- Area Path -->
        <path d="M0 160 C 100 150, 200 80, 300 100 S 400 40, 500 60 S 600 140, 700 120 S 800 60, 900 40 S 1000 70, 1000 70 V 200 H 0 Z" fill="url(#chartGradient)"></path>
        <!-- Line Path -->
        <path d="M0 160 C 100 150, 200 80, 300 100 S 400 40, 500 60 S 600 140, 700 120 S 800 60, 900 40 S 1000 70, 1000 70" fill="none" stroke="#2ecc70" stroke-linecap="round" stroke-width="4"></path>
      </svg>
    </div>
    <div class="flex justify-between mt-4 text-xs text-slate-400 font-medium px-2">
      <span>May 01</span>
      <span>May 07</span>
      <span>May 14</span>
      <span>May 21</span>
      <span>May 28</span>
      <span>May 31</span>
    </div>
  </div>
</template>
