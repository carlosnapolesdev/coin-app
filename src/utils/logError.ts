export type ErrorReporter = (context: string, error: unknown) => void

// Punto único de reporte de errores. Ningún `catch` debe descartar un error en
// silencio: aunque el fallo no se le muestre al usuario (sincronizaciones de
// fondo, cargas secundarias), tiene que quedar rastro. Un PATCH de onboarding
// que fallaba en silencio ocultó durante meses una pérdida de escritura.
let reporter: ErrorReporter | null = null

// Permite enchufar un destino externo (Sentry y similares) sin tocar los
// llamadores. En tests sirve para afirmar que el error se reportó.
export const setErrorReporter = (next: ErrorReporter | null) => {
  reporter = next
}

export const logError = (context: string, error: unknown) => {
  if (reporter) {
    reporter(context, error)
    return
  }
  console.error(`[${context}]`, error)
}
