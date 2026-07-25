import type { App } from 'vue'
import { logError } from './logError'

// Acumular listeners en cada install duplicaría los reportes. Guardamos el
// AbortController de la instalación anterior para limpiar antes de instalar
// otra vez — útil en tests y defensa frente a doble bootstrap.
let abortController: AbortController | null = null

const RELOAD_MARKER = 'crecik.preloadReloadAt'

// Una vez lanzada la recarga de recuperación, la página se está desmontando y
// todo lo que falle a partir de ahí es consecuencia, no causa. Reportarlo llena
// client_errors de secuelas que apuntan al sitio equivocado: al silenciar el
// error del chunk con preventDefault, el import resuelve a `undefined` y
// vue-router lanza su propio "Couldn't resolve component", que sin este corte
// sería lo único que se viera del incidente.
let recovering = false

/**
 * ¿Ya se recargó esta pestaña para recuperar un chunk? La marca va en
 * sessionStorage porque tiene que sobrevivir justo a lo único que la borraría
 * en memoria —la recarga— y morir con la pestaña.
 *
 * Si el almacenamiento no está disponible se responde que sí. Sin poder anotar
 * el intento no hay forma de distinguir la primera recarga de la número mil, y
 * una recarga en bucle contra un chunk que sigue sin llegar es peor que el
 * fallo que intenta arreglar.
 */
const alreadyReloadedForPreload = (): boolean => {
  try {
    if (window.sessionStorage.getItem(RELOAD_MARKER)) return true
    window.sessionStorage.setItem(RELOAD_MARKER, new Date().toISOString())
    return false
  } catch (err: unknown) {
    logError('preloadRecovery.markReload', err)
    return true
  }
}

/**
 * Los try/catch del código solo cubren fallos previstos. Estos enganches son los
 * que cubren lo imprevisto: un TypeError que deja la vista en blanco no pasa por
 * ningún catch, y es justo el fallo que nadie reporta.
 *
 * `reload` se inyecta solo para poder probarlo: jsdom no implementa la
 * navegación real.
 */
export function installGlobalErrorHandlers(
  app: App,
  reload: () => void = () => window.location.reload(),
) {
  if (abortController) abortController.abort()
  abortController = new AbortController()
  // Instalar es arrancar la página: si venimos de una recarga de recuperación,
  // esta carga es un intento limpio y sus errores vuelven a contar.
  recovering = false

  window.onerror = (_message, _source, _line, _column, error) => {
    if (recovering) return false
    logError('window.onerror', error ?? _message)
    return false
  }

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (recovering) return
      logError('window.unhandledRejection', event.reason)
    },
    { signal: abortController.signal },
  )

  // El chunk de una ruta perezosa no llegó. Puede ser una red móvil que se
  // corta, un bloqueador de contenido, o un deploy que borró el asset que pedía
  // un index.html ya servido — la imagen de nginx se reemplaza entera, así que
  // los hashes anteriores desaparecen de golpe.
  //
  // Sin recuperación el router nunca resuelve la vista y no se ve nada: en `/`,
  // que va prerenderizada, el usuario se queda mirando una landing correcta que
  // no responde a ningún clic. Recargar vuelve a pedir el index.html —nginx lo
  // sirve `no-cache`— y con él los nombres de chunk vigentes.
  window.addEventListener(
    'vite:preloadError',
    (event) => {
      if (alreadyReloadedForPreload()) return
      // Se reporta aunque se recupere. Un fallo que se arregla solo pero pasa a
      // diario es justo el que hay que ver, y tras el preventDefault ya no
      // llegaría a `unhandledrejection`. El reporter manda con `keepalive`, así
      // que la petición sobrevive a la recarga que viene justo detrás.
      logError('vite.preloadError', event.payload)
      event.preventDefault()
      recovering = true
      reload()
    },
    { signal: abortController.signal },
  )

  app.config.errorHandler = (error) => {
    if (recovering) return
    logError('vue.errorHandler', error)
  }
}
