import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'

interface RequirePermissionProps {
  /** Omit for pages any authenticated user may open (e.g. Dashboard, Settings). */
  permission?: string
  children: ReactNode
}

/** Redirects to the dashboard if the signed-in user's role lacks `permission`. */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { loading, hasPermission } = usePermissions()

  if (loading) return null
  if (!hasPermission(permission)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
