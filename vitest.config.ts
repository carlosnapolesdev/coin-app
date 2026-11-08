import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    // Node >= 25 ships a global `localStorage` that is undefined unless
    // --localstorage-file is given, and it shadows jsdom's, so every test
    // touching `window.localStorage` crashes. Turning Node's off lets jsdom's
    // through.
    execArgv: ['--no-webstorage'],
  },
})
