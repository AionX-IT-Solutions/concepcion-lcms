import { useEffect } from 'react'
import { useLcmsStore } from '../store/lcms.store'

export function useLcmsSync(active: boolean): void {
  const initListeners = useLcmsStore((s) => s.initListeners)

  useEffect(() => {
    if (!active) return
    const unsubscribe = initListeners()
    return unsubscribe
  }, [active, initListeners])
}
