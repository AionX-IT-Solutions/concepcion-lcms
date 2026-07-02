import type { ReactNode, CSSProperties } from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'cyan'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  dot?: boolean
  className?: string
  style?: CSSProperties
}

const variantStyles: Record<BadgeVariant, CSSProperties> = {
  default: {
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text-secondary)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  primary: {
    background: 'rgba(99,102,241,0.15)',
    color: '#818cf8',
    border: '1px solid rgba(99,102,241,0.3)',
    boxShadow: '0 0 10px rgba(99,102,241,0.2)'
  },
  success: {
    background: 'rgba(16,185,129,0.12)',
    color: '#34d399',
    border: '1px solid rgba(16,185,129,0.25)',
    boxShadow: '0 0 10px rgba(16,185,129,0.15)'
  },
  warning: {
    background: 'rgba(245,158,11,0.12)',
    color: '#fbbf24',
    border: '1px solid rgba(245,158,11,0.25)',
    boxShadow: '0 0 10px rgba(245,158,11,0.15)'
  },
  danger: {
    background: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.25)',
    boxShadow: '0 0 10px rgba(239,68,68,0.15)'
  },
  outline: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)'
  },
  cyan: {
    background: 'rgba(6,182,212,0.12)',
    color: '#22d3ee',
    border: '1px solid rgba(6,182,212,0.25)',
    boxShadow: '0 0 10px rgba(6,182,212,0.15)'
  }
}

const dotColors: Record<BadgeVariant, string> = {
  default: '#8888aa',
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  outline: '#8888aa',
  cyan: '#06b6d4'
}

export function Badge({
  children,
  variant = 'default',
  dot = false,
  className = '',
  style
}: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 500,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
        ...variantStyles[variant],
        ...style
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: dotColors[variant],
            flexShrink: 0,
            animation:
              variant !== 'default' && variant !== 'outline'
                ? 'ping 1.5s ease infinite'
                : undefined,
            boxShadow:
              variant !== 'default' && variant !== 'outline'
                ? `0 0 6px ${dotColors[variant]}`
                : undefined
          }}
        />
      )}
      {children}
    </span>
  )
}
