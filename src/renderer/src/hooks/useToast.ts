import { toast } from 'sonner'
import { useAppStore } from '../store/app.store'

type ToastType = 'info' | 'success' | 'warning' | 'error'

interface ToastOptions {
  description?: string
  duration?: number
  /** Also show a native OS notification (respects notificationsEnabled) */
  native?: boolean
  nativeTitle?: string
}

export function useToast() {
  const addNotification = useAppStore((s) => s.addNotification)
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled)
  const soundEnabled = useAppStore((s) => s.soundEnabled)

  const show = (type: ToastType, message: string, opts?: ToastOptions) => {
    // Always log to the notification history in the store
    addNotification({ type, message })

    // Only show UI toasts if notifications are enabled
    if (!notificationsEnabled) return

    const options = { description: opts?.description, duration: opts?.duration ?? 4000 }

    switch (type) {
      case 'success':
        toast.success(message, options)
        break
      case 'error':
        toast.error(message, options)
        break
      case 'warning':
        toast.warning(message, options)
        break
      default:
        toast.info(message, options)
    }

    // Optional native OS notification
    if (opts?.native) {
      window.api?.notification
        .show({ title: opts.nativeTitle ?? 'AionX', body: message, type })
        .catch(() => {})
    }

    // Optional sound (uses the Web Audio API for a short beep)
    if (soundEnabled && type !== 'info') {
      playNotificationSound(type)
    }
  }

  return {
    success: (msg: string, opts?: ToastOptions) => show('success', msg, opts),
    error: (msg: string, opts?: ToastOptions) => show('error', msg, opts),
    warning: (msg: string, opts?: ToastOptions) => show('warning', msg, opts),
    info: (msg: string, opts?: ToastOptions) => show('info', msg, opts)
  }
}

/** Standalone function — checks securityAlerts setting before showing. Safe to call outside React. */
export function notifySecurityAlert(message: string, opts?: ToastOptions) {
  const { securityAlerts, notificationsEnabled, soundEnabled, addNotification } =
    useAppStore.getState()
  addNotification({ type: 'warning', message })
  if (!securityAlerts || !notificationsEnabled) return
  toast.warning(message, { description: opts?.description, duration: opts?.duration ?? 6000 })
  if (opts?.native) {
    window.api?.notification
      .show({ title: opts.nativeTitle ?? 'AionX Security', body: message, type: 'warning' })
      .catch(() => {})
  }
  if (soundEnabled) playNotificationSound('warning')
}

function playNotificationSound(type: ToastType) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const freq = type === 'error' ? 300 : type === 'warning' ? 500 : 750
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
    osc.onended = () => ctx.close()
  } catch {
    // AudioContext not available — silently ignore
  }
}
