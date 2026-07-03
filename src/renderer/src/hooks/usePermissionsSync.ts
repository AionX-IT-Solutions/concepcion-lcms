import { useEffect } from 'react'
import { useRolesStore } from '../store/permissions.store'
import { useAppStore } from '../store/app.store'
import { setAuditIsSystemDeveloper } from '../lib/audit'

export function usePermissionsSync(active: boolean): void {
  const initListeners = useRolesStore((s) => s.initListeners)
  const roles = useRolesStore((s) => s.roles)
  const roleName = useAppStore((s) => s.currentUser.role)

  useEffect(() => {
    if (!active) return
    const unsubscribe = initListeners()
    return unsubscribe
  }, [active, initListeners])

  // Developer-flagged roles (Role.isSystemDeveloper) bypass permission checks
  // app-wide, so their actions are excluded from the audit trail as well.
  useEffect(() => {
    const isSystemDeveloper = roles.find((r) => r.name === roleName)?.isSystemDeveloper ?? false
    setAuditIsSystemDeveloper(active && isSystemDeveloper)
  }, [active, roles, roleName])
}
