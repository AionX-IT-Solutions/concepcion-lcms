import { useEffect } from 'react'
import { useRolesStore } from '../store/permissions.store'

export function usePermissionsSync(active: boolean): void {
  const initListeners = useRolesStore((s) => s.initListeners)

  useEffect(() => {
    if (!active) return
    const unsubscribe = initListeners()
    return unsubscribe
  }, [active, initListeners])
}
