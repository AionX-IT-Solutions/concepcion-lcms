import type { CSSProperties, ReactNode } from 'react'

interface GlowEffectProps {
  color?: string
  size?: number
  intensity?: number
  className?: string
  children?: ReactNode
  style?: CSSProperties
}

export function GlowEffect({
  color = 'var(--accent-primary)',
  size = 300,
  intensity = 0.3,
  className = '',
  children,
  style
}: GlowEffectProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      {/* Glow blob behind */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: color,
          opacity: intensity,
          filter: `blur(${size * 0.35}px)`,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      {/* Content on top */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

interface GlowRingProps {
  color?: string
  size?: number
  strokeWidth?: number
  animated?: boolean
}

export function GlowRing({
  color = '#6366f1',
  size = 120,
  strokeWidth = 1.5,
  animated = true
}: GlowRingProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      style={animated ? { animation: 'spin-slow 8s linear infinite' } : {}}
    >
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="50%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.8" />
        </linearGradient>
        <filter id="ring-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - strokeWidth}
        stroke="url(#ring-grad)"
        strokeWidth={strokeWidth}
        filter="url(#ring-glow)"
      />
    </svg>
  )
}
