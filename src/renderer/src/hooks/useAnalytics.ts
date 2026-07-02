import { useEffect } from 'react'
import { useAppStore } from '../store/app.store'
import { initPostHog, setAnalyticsEnabled, track, trackPage } from '../lib/posthog'
import { initSentryRenderer, setSentryEnabled } from '../lib/sentry'

/**
 * Initialize and manage Sentry + PostHog based on user consent.
 * Call once at the app root (in useTheme or App.tsx).
 */
export function useAnalytics() {
  const crashReports = useAppStore((s) => s.crashReports)
  const dataCollection = useAppStore((s) => s.dataCollection)

  // Bootstrap both SDKs with initial consent values on mount
  useEffect(() => {
    initSentryRenderer(crashReports)
    initPostHog(dataCollection)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Respect consent changes at runtime
  useEffect(() => {
    setSentryEnabled(crashReports)
  }, [crashReports])

  useEffect(() => {
    setAnalyticsEnabled(dataCollection)
  }, [dataCollection])
}

/** Track a named event (no-ops if dataCollection is off or PostHog not init). */
export { track, trackPage }
