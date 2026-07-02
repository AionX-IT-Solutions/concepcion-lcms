import { Toaster as SonnerToaster } from 'sonner'
import { useAppStore } from '../../store/app.store'

export { toast } from 'sonner'

export function Toaster() {
  const theme = useAppStore((s) => s.theme)

  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontFamily: 'inherit',
          boxShadow: 'var(--shadow-card)'
        },
        classNames: {
          error: 'toast-error',
          success: 'toast-success',
          warning: 'toast-warning',
          info: 'toast-info'
        }
      }}
      richColors
      closeButton
      gap={8}
    />
  )
}
