import { motion } from 'framer-motion'
import type { ReactNode, CSSProperties } from 'react'

type GlowColor = 'primary' | 'cyan' | 'emerald' | 'amber' | 'rose'

interface CardProps {
  children?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  glow?: GlowColor
  hoverable?: boolean
  className?: string
  style?: CSSProperties
  padding?: string
  /** Makes the card fill its parent height; children area becomes scrollable */
  fill?: boolean
  /** Renders shimmering skeleton bars in place of children */
  loading?: boolean
  skeletonRows?: number
}

const glowBorderColor: Record<GlowColor, string> = {
  primary: 'rgba(99,102,241,0.3)',
  cyan: 'rgba(6,182,212,0.3)',
  emerald: 'rgba(16,185,129,0.3)',
  amber: 'rgba(245,158,11,0.3)',
  rose: 'rgba(239,68,68,0.3)'
}

const glowShadowVar: Record<GlowColor, string> = {
  primary: 'var(--shadow-card-glow-primary)',
  cyan: 'var(--shadow-card-glow-cyan)',
  emerald: 'var(--shadow-card-glow-emerald)',
  amber: 'var(--shadow-card-glow-amber)',
  rose: 'var(--shadow-card-glow-rose)'
}

export function Card({
  children,
  header,
  footer,
  glow,
  hoverable = false,
  className = '',
  style,
  padding = '20px',
  fill = false,
  loading = false,
  skeletonRows = 3
}: CardProps) {
  const baseStyle: CSSProperties = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: `1px solid ${glow ? glowBorderColor[glow] : 'var(--glass-border)'}`,
    borderRadius: '14px',
    boxShadow: glow ? glowShadowVar[glow] : 'var(--shadow-card)',
    overflow: 'hidden',
    ...(fill && { display: 'flex', flexDirection: 'column' as const }),
    ...style
  }

  const dividerStyle = 'var(--border-subtle)'

  const content = (
    <>
      {header && (
        <div
          style={{
            padding: `${padding} ${padding} 0`,
            borderBottom: children || footer ? `1px solid ${dividerStyle}` : undefined,
            paddingBottom: children || footer ? padding : undefined,
            marginBottom: children || footer ? 0 : undefined
          }}
        >
          {header}
        </div>
      )}
      {(children || loading) && (
        <div style={{ padding, ...(fill && { flex: 1, overflowY: 'auto' as const }) }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 14, width: `${90 - i * 15}%`, borderRadius: 6 }}
                />
              ))}
            </div>
          ) : (
            children
          )}
        </div>
      )}
      {footer && (
        <div
          style={{
            padding: `0 ${padding} ${padding}`,
            borderTop: `1px solid ${dividerStyle}`,
            paddingTop: padding
          }}
        >
          {footer}
        </div>
      )}
    </>
  )

  if (hoverable) {
    return (
      <motion.div
        className={className}
        style={baseStyle}
        whileHover={{
          y: -3,
          borderColor: 'var(--border-strong)',
          boxShadow: 'var(--shadow-card-hover)'
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {content}
      </motion.div>
    )
  }

  return (
    <div className={className} style={baseStyle}>
      {content}
    </div>
  )
}
