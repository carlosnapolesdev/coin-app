import { afterEach, describe, expect, it } from 'vitest'
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

    expect(reported).toEqual([['unhandledrejection', failure]])
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
