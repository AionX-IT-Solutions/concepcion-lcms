import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAppStore } from '../store/app.store'

export function useUpdateStatus() {
  const updateStatus = useAppStore((s) => s.updateStatus)
  const setUpdateStatus = useAppStore((s) => s.setUpdateStatus)

  useEffect(() => {
    const unsubscribe = window.api?.update.onStatus((status) => {
      setUpdateStatus(status)

      const { updateNotifs, notificationsEnabled, addNotification } = useAppStore.getState()

      if (status.status === 'available') {
        const msg = status.version
          ? `Update v${status.version} available`
          : 'A new update is available'
        addNotification({ type: 'info', message: msg })
        if (updateNotifs && notificationsEnabled) {
          toast.info(msg, { duration: 6000 })
        }
      } else if (status.status === 'downloaded') {
        const msg = 'Update ready — restart to install'
        addNotification({ type: 'success', message: msg })
        if (updateNotifs && notificationsEnabled) {
          toast.success(msg, {
            duration: 0,
            action: { label: 'Restart now', onClick: () => window.api?.update.install() }
          })
        }
      }
    })
    return () => unsubscribe?.()
  }, [setUpdateStatus])

  return {
    updateStatus,
    checkForUpdate: () => window.api?.update.check().catch(() => {}),
    installUpdate: () => window.api?.update.install()
  }
}
