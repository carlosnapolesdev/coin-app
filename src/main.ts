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
      // Solo en producción. Sin reporter instalado, `logError` cae a su salida
      // por consola, que es donde el error sirve mientras se programa; mandarlo
      // además a client_errors llenaría el digest de ruido que no existe en
      // producción: recargas de HMR a media edición, la API local caída,
      // pantallas a medio escribir. Ese ruido es justo lo que acaba haciendo que
      // se dejen de leer los avisos.
      if (import.meta.env.PROD) installErrorReporter()
      installGlobalErrorHandlers(app)
    }
  },
)