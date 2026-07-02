import { createDoc } from './firestore-sync'
import { auth } from './firebase'

export const AUDIT_MODULES = [
  'Clients',
  'Cases',
  'Hearings',
  'Tasks',
  'Billing',
  'Documents',
  'Users',
  'Settings',
  'Auth'
] as const

export type AuditModule = (typeof AUDIT_MODULES)[number]
export type AuditSeverity = 'Info' | 'Warning' | 'Critical'

export interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
  module: AuditModule
  target: string
  severity: AuditSeverity
}

/**
 * The `users/{uid}` Firestore doc is this app's source of truth for a
 * person's display name — Firebase Auth's own `displayName` is only set when
 * the account was created through `createUserAccount`, so accounts seeded any
 * other way would otherwise show their email everywhere. Kept in sync by
 * `useFirebaseAuth`.
 */
let cachedDisplayName: string | null = null

export function setAuditUserDisplayName(name: string | null | undefined): void {
  cachedDisplayName = name?.trim() || null
}

export function getAuditUserDisplayName(): string | null {
  return cachedDisplayName
}

/**
 * Fire-and-forget audit trail write. Failures are swallowed (logged only) so a
 * write hiccup here never blocks the underlying user action from completing.
 */
export async function logAudit(entry: {
  action: string
  module: AuditModule
  target: string
  severity?: AuditSeverity
  /** Overrides the acting user — needed when the account is already signed out by write time. */
  userOverride?: string
}): Promise<void> {
  const user = auth.currentUser
  const userLabel =
    entry.userOverride || cachedDisplayName || user?.displayName || user?.email || 'Unknown user'
  try {
    await createDoc('auditLogs', {
      timestamp: new Date().toISOString(),
      user: userLabel,
      action: entry.action,
      module: entry.module,
      target: entry.target,
      severity: entry.severity ?? 'Info'
    })
  } catch (err) {
    console.error('Failed to write audit log', err)
  }
}
