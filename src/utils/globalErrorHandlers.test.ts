import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { setErrorReporter } from './logError'
import { installGlobalErrorHandlers } from './globalErrorHandlers'

describe('globalErrorHandlers', () => {
  afterEach(() => {
    setErrorReporter(null)
    window.onerror = null
  })

  it('routes window.onerror through logError', () => {
    const reported: [string, unknown][] = []
    setErrorReporter((context, error) => reported.push([context, error]))
    const app = createApp({ render: () => null })
    installGlobalErrorHandlers(app)

    const failure = new TypeError('render blew up')
    window.onerror?.('msg', 'file.js', 1, 1, failure)

    expect(reported).toEqual([['window.onerror', failure]])
  })

  it('routes unhandled promise rejections through logError', () => {
    const reported: [string, unknown][] = []
    setErrorReporter((context, error) => reported.push([context, error]))
    const app = createApp({ render: () => null })
    installGlobalErrorHandlers(app)

    const failure = new Error('nobody caught me')
    window.dispatchEvent(
      Object.assign(new Event('unhandledrejection'), { reason: failure }),
    )

    expect(reported).toEqual([['window.unhandledRejection', failure]])
  })

  it('routes Vue render errors through logError', () => {
    const reported: [string, unknown][] = []
    setErrorReporter((context, error) => reported.push([context, error]))
    const app = createApp({ render: () => null })
    installGlobalErrorHandlers(app)

    const failure = new Error('bad render')
    app.config.errorHandler?.(failure, null, 'render')

    expect(reported).toEqual([['vue.errorHandler', failure]])
  })
})

// Un chunk de ruta que no llega deja al router sin resolver la vista. En `/`,
// que va prerenderizada, eso no se ve: el HTML estático pinta una landing
// correcta que no responde a nada, sin ningún aviso. Se observó en producción
// el 2026-07-24 (iOS Safari, chunk que sí existía en el servidor).
describe('globalErrorHandlers — recuperación de vite:preloadError', () => {
  const dispatchPreloadError = (error: Error) => {
    const event = Object.assign(new Event('vite:preloadError', { cancelable: true }), {
      payload: error,
    })
    window.dispatchEvent(event)
    return event
  }

  beforeEach(() => {
    window.sessionStorage.clear()
  })

  afterEach(() => {
    setErrorReporter(null)
    window.sessionStorage.clear()
  })

  it('recarga y reporta la primera vez, y silencia el error original', () => {
    const reported: [string, unknown][] = []
    setErrorReporter((context, error) => reported.push([context, error]))
    const reload = vi.fn()
    installGlobalErrorHandlers(createApp({ render: () => null }), reload)

    const failure = new TypeError(
      'Failed to fetch dynamically imported module: /assets/LandingView-x.js',
    )
    const event = dispatchPreloadError(failure)

    expect(reload).toHaveBeenCalledTimes(1)
    // Se reporta aunque se recupere: si no, un fallo que se repite a diario
    // deja de existir para quien lee el digest.
    expect(reported).toEqual([['vite.preloadError', failure]])
    // preventDefault evita que Vite relance el error, que ya no aporta nada:
    // la página se está recargando.
    expect(event.defaultPrevented).toBe(true)
  })

  it('no reporta las secuelas mientras la página se recarga', () => {
    const reported: [string, unknown][] = []
    setErrorReporter((context, error) => reported.push([context, error]))
    const app = createApp({ render: () => null })
    installGlobalErrorHandlers(app, vi.fn())

    dispatchPreloadError(new TypeError('chunk inalcanzable'))
    // Lo que vue-router lanza al recibir `undefined` del import silenciado. Sin
    // el corte sería lo único visible del incidente, y apunta al sitio
    // equivocado: parece un fallo de rutas, no de red.
    window.dispatchEvent(
      Object.assign(new Event('unhandledrejection'), {
        reason: new Error(`Couldn't resolve component "default" at "/"`),
      }),
    )
    app.config.errorHandler?.(new Error('render a medias'), null, 'render')

    expect(reported.map(([context]) => context)).toEqual(['vite.preloadError'])
  })

  it('no recarga una segunda vez en la misma pestaña', () => {
    setErrorReporter(() => {})
    const reload = vi.fn()
    // La marca vive en sessionStorage justamente para sobrevivir al reload;
    // reinstalar los handlers simula la página ya recargada.
    installGlobalErrorHandlers(createApp({ render: () => null }), reload)
    dispatchPreloadError(new TypeError('boom'))
    installGlobalErrorHandlers(createApp({ render: () => null }), reload)

    const event = dispatchPreloadError(new TypeError('boom otra vez'))

    // Recargar de nuevo con el chunk aún inalcanzable es un bucle: se recarga
    // sola para siempre contra un servidor que no responde.
    expect(reload).toHaveBeenCalledTimes(1)
    // Sin preventDefault el error sigue su curso hasta unhandledrejection, que
    // es quien lo reporta: el fallo no recuperable no puede quedar mudo.
    expect(event.defaultPrevented).toBe(false)
  })

  it('no recarga si sessionStorage no está disponible', () => {
    const reported: [string, unknown][] = []
    setErrorReporter((context, error) => reported.push([context, error]))
    const boom = new Error('storage disabled')
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw boom
      })
    const reload = vi.fn()
    installGlobalErrorHandlers(createApp({ render: () => null }), reload)

    dispatchPreloadError(new TypeError('boom'))

    // Sin poder anotar que ya se recargó, recargar es arriesgarse al bucle:
    // se prefiere no recuperar y que el error se vea.
    expect(reload).not.toHaveBeenCalled()
    expect(reported).toEqual([['preloadRecovery.markReload', boom]])
    getItem.mockRestore()
  })
})
