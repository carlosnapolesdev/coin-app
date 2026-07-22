import { ViteSSG } from 'vite-ssg'
import './fonts.css'
import './style.css'
import App from './App.vue'
import { routes, installGuards, installHead } from './router'
import { i18n } from './i18n'
import './composables/useLocale'
import { handleUnauthorizedSession } from './services/auth'
import { setUnauthorizedHandler } from './services/api'
import { installErrorReporter } from './utils/errorReporter'
import { installGlobalErrorHandlers } from './utils/globalErrorHandlers'

export const createApp = ViteSSG(
  App,
  { routes },
  ({ app, router, isClient }) => {
    app.use(i18n)
    installGuards(router)
    installHead(router)

    if (isClient) {
      setUnauthorizedHandler(() => handleUnauthorizedSession(router))
      installErrorReporter()
      installGlobalErrorHandlers(app)
    }
  },
)