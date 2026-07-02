import * as Sentry from '@sentry/electron/renderer'

let initialized = false

export function initSentryRenderer(crashReports: boolean): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

  if (!dsn) {
    console.warn('[sentry] VITE_SENTRY_DSN not set — Sentry disabled in renderer')
    return
  }

  if (!crashReports) {
    console.warn('[sentry] Crash reporting disabled by user preference')
    return
  }

  if (initialized) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION as string,
    // Don't send in dev mode unless explicitly enabled
    enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_FORCE === 'true',
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    beforeSend(event) {
      // Strip user-identifying data
      delete event.user
      return event
    }
  })

  initialized = true
  console.warn('[sentry] Renderer initialized')
}

export function setSentryEnabled(enabled: boolean): void {
  if (!initialized) return
  Sentry.getCurrentScope().setTag('crashReports', String(enabled))
  // Sentry doesn't have a runtime pause API — reinitialize on next app start
}

export function captureError(err: Error, context?: Record<string, unknown>): void {
  window.api?.log.error(`[renderer] ${err.message}`)
  if (initialized) {
    Sentry.withScope((scope) => {
      if (context) scope.setExtras(context)
      Sentry.captureException(err)
    })
  }
}

export { Sentry }
