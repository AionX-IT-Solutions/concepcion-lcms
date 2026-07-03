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
          ? `Update v${status.version} is downloading...`
          : 'A new update is downloading...'
        addNotification({ type: 'info', message: msg })
        if (updateNotifs && notificationsEnabled) {
          toast(msg, { icon: '⬇️', duration: 5000 })
        }
      } else if (status.status === 'downloaded') {
        const msg = 'Update ready to install.'
        addNotification({ type: 'success', message: msg })
        if (updateNotifs && notificationsEnabled) {
          toast(msg, {
            icon: '✅',
            duration: Infinity,
            action: { label: 'Restart & Update', onClick: () => window.api?.update.install() }
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
