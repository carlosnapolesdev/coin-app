import type { App } from 'vue'
import { logError } from './logError'

// Acumular listeners en cada install duplicaría los reportes. Guardamos el
// AbortController de la instalación anterior para limpiar antes de instalar
// otra vez — útil en tests y defensa frente a doble bootstrap.
let abortController: AbortController | null = null

/**
 * Los try/catch del código solo cubren fallos previstos. Estos tres enganches
 * son los que cubren lo imprevisto: un TypeError que deja la vista en blanco
 * no pasa por ningún catch, y es justo el fallo que nadie reporta.
 */
export function installGlobalErrorHandlers(app: App) {
  if (abortController) abortController.abort()
  abortController = new AbortController()

  window.onerror = (_message, _source, _line, _column, error) => {
    logError('window.onerror', error ?? _message)
    return false
  }

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      logError('unhandledrejection', event.reason)
    },
    { signal: abortController.signal },
  )

  app.config.errorHandler = (error) => {
    logError('vue.errorHandler', error)
  }
}
