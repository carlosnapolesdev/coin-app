import { createApp } from 'vue'
import './fonts.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import './composables/useLocale'
import { handleUnauthorizedSession } from './services/auth'
import { setUnauthorizedHandler } from './services/api'

setUnauthorizedHandler(() => handleUnauthorizedSession(router))

createApp(App).use(router).use(i18n).mount('#app')
