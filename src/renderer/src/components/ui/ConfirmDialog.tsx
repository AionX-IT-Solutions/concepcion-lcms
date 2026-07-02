import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false
}: ConfirmDialogProps) {
  if (!open) return null

  const iconBg = danger ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'
  const iconColor = danger ? '#f87171' : '#fbbf24'

  // Portalled to <body> — rendering in place (e.g. inside the animated
  // sidebar) puts it under an ancestor with a `transform`, which makes that
  // ancestor the containing block for `position: fixed` and traps the dialog
  // inside the sidebar's bounds instead of centering on the whole window.
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(5px)'
        }}
        onClick={onCancel}
      />
      <div
        className="animate-scale-in"
        style={{
          position: 'relative',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 18,
          overflow: 'hidden',
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Accent top bar */}
        <div
          style={{
            height: 2,
            background: danger
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : 'linear-gradient(90deg, #f59e0b, #d97706)'
          }}
        />

        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '24px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flexShrink: 0,
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertTriangle size={18} color={iconColor} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6
              }}
            >
              {title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 20,
            padding: '0 24px 24px'
          }}
        >
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
