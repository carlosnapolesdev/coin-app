import { setErrorReporter } from './logError'

declare const __APP_VERSION__: string

const seen = new Set<string>()

// Solo para tests: el Set es de módulo y persistiría entre casos.
export const __resetReporterDedup = () => seen.clear()

// La query puede llevar credenciales: /reset-password?token=<raw> es el caso
// claro. Sin recortarla, un fallo cualquiera en esa pantalla deja el token
// guardado 90 días en client_errors. La ruta sola basta para situar el error.
const currentPath = (): string => {
  const { origin, pathname } = window.location
  return `${origin}${pathname}`.slice(0, 500)
}

const describeError = (error: unknown): { name: string; message: string; stack?: string } => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return { name: 'UnknownError', message: String(error) }
}

export function installErrorReporter(endpoint = '/api/client-errors') {
  setErrorReporter((context, error) => {
    const { name, message, stack } = describeError(error)

    // Dedup por sesión: un error en un watcher puede dispararse cientos de
    // veces y no tiene sentido mandar cada una.
    const key = `${context}|${name}|${message}`
    if (seen.has(key)) return
    seen.add(key)

    // fetch pelado a propósito, no la instancia `api` de axios: por axios un
    // 401 dispararía el unauthorizedHandler y cerraría la sesión del usuario
    // por un fallo de telemetría.
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        errorName: name,
        // El DTO exige message no vacío; un `new Error()` sin mensaje haría
        // que el servidor rechazara el reporte y se perdiera en silencio.
        message: (message || name).slice(0, 1000),
        stack: stack?.slice(0, 8000),
        url: currentPath(),
        userAgent: navigator.userAgent.slice(0, 300),
        appVersion: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : undefined,
      }),
      keepalive: true,
      // eslint-disable-next-line no-restricted-syntax -- ver comentario: reportar aquí recursa
    }).catch(() => {
      // ÚNICA excepción permitida a la regla de no silenciar errores
      // (eslint.config.js, no-restricted-syntax): reportar el fallo del
      // reporte volvería a entrar aquí, en bucle infinito.
    })
  })
}
