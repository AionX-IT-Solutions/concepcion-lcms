import posthog from 'posthog-js'

let initialized = false

export function initPostHog(dataCollection: boolean): void {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined
  const host =
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://app.posthog.com'

  if (!apiKey) {
    console.warn('[posthog] VITE_POSTHOG_KEY not set — analytics disabled')
    return
  }

  if (!dataCollection) {
    console.warn('[posthog] Analytics disabled by user preference')
    return
  }

  if (initialized) return

  posthog.init(apiKey, {
    api_host: host,
    // Electron app — disable web-specific features
    capture_pageview: false,
    capture_pageleave: false,
    persistence: 'localStorage',
    // Respect user opt-out
    opt_out_capturing_by_default: false,
    sanitize_properties(props) {
      // Remove any accidental PII from property bags
      delete props['$ip']
      delete props['$geoip_city_name']
      return props
    }
  })

  // Identify session with a random anonymous ID (no PII)
  const anonId = getAnonymousId()
  posthog.identify(anonId, {
    app_version: import.meta.env.VITE_APP_VERSION,
    platform: navigator.platform,
    env: import.meta.env.MODE
  })

  initialized = true
  console.warn('[posthog] Analytics initialized (anonymous)')
}

export function setAnalyticsEnabled(enabled: boolean): void {
  if (!initialized) return
  if (enabled) {
    posthog.opt_in_capturing()
  } else {
    posthog.opt_out_capturing()
  }
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) return
  posthog.capture(event, properties)
}

export function trackPage(pageName: string): void {
  track('$pageview', { page: pageName })
}

/** Returns a stable anonymous ID stored in localStorage (no PII). */
function getAnonymousId(): string {
  const key = 'aionx_anon_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`
    localStorage.setItem(key, id)
  }
  return id
}

export { posthog }
