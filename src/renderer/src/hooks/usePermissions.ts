import { useMemo } from 'react'
import { useAppStore } from '../store/app.store'
import { useRolesStore } from '../store/permissions.store'

export interface Permissions {
  permissions: string[]
  isSystemDeveloper: boolean
  loading: boolean
  /** No `permission` argument means the page/action needs no specific permission. */
  hasPermission: (permission?: string) => boolean
}

export function usePermissions(): Permissions {
  const roleName = useAppStore((s) => s.currentUser.role)
  const roles = useRolesStore((s) => s.roles)
  const rolesLoaded = useRolesStore((s) => s.rolesLoaded)

  return useMemo(() => {
    const role = roles.find((r) => r.name === roleName)
    const isSystemDeveloper = role?.isSystemDeveloper ?? false
    const permissions = role?.permissions ?? []
    return {
      permissions,
      isSystemDeveloper,
      loading: !rolesLoaded,
      hasPermission: (permission) => {
        if (!permission) return true
        if (isSystemDeveloper) return true
        // No role assigned yet — keep the pre-enforcement behavior (unrestricted) so
        // existing accounts don't get locked out the moment this ships.
        if (!roleName) return true
        return permissions.includes(permission)
      }
    }
  }, [roleName, roles, rolesLoaded])
}
