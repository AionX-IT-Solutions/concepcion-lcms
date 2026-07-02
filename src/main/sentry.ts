import * as Sentry from '@sentry/electron/main'
import log from 'electron-log'

let initialized = false

export function initSentryMain(): void {
  const dsn = process.env['VITE_SENTRY_DSN']
  if (!dsn) {
    log.warn('[sentry] VITE_SENTRY_DSN not set — Sentry disabled in main process')
    return
  }

  Sentry.init({
    dsn,
    environment: process.env['NODE_ENV'] ?? 'production',
    release: process.env['npm_package_version'],
    // Only upload source maps in production
    integrations: [],
    beforeSend(event) {
      log.info('[sentry] Sending event:', event.event_id)
      return event
    }
  })

  initialized = true
  log.info('[sentry] Main process initialized')
}

export function isSentryInitialized(): boolean {
  return initialized
}

export function captureException(err: Error): void {
  if (initialized) {
    Sentry.captureException(err)
  }
  log.error('[crash]', err)
}
