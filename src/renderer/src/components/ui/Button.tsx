import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { motion, type TargetAndTransition } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

type SafeButtonHTMLAttributes = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart'
>

interface ButtonProps extends SafeButtonHTMLAttributes {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: 'var(--accent-primary)',
    color: '#fff',
    border: '1px solid transparent'
  },
  secondary: {
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent'
  },
  danger: {
    background: 'rgba(239,68,68,0.15)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.3)'
  },
  outline: {
    background: 'transparent',
    color: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)'
  }
}

const variantHoverStyles: Record<Variant, TargetAndTransition> = {
  primary: {
    background: 'var(--accent-primary-hover)',
    boxShadow: '0 0 28px var(--accent-primary-glow), 0 4px 16px rgba(0,0,0,0.2)'
  },
  secondary: {
    background: 'var(--glass-bg-hover)',
    borderColor: 'var(--border-strong)',
    boxShadow: '0 0 12px var(--accent-primary-glow)'
  },
  ghost: {
    background: 'var(--accent-primary-subtle)',
    color: 'var(--accent-primary)'
  },
  danger: {
    background: 'rgba(239,68,68,0.25)',
    boxShadow: '0 0 20px rgba(239,68,68,0.3)'
  },
  outline: {
    background: 'var(--accent-primary-subtle)',
    boxShadow: '0 0 20px var(--accent-primary-glow)'
  }
}

const sizeStyles: Record<Size, CSSProperties> = {
  sm: { padding: '5px 12px', fontSize: '12px', gap: '6px', borderRadius: '6px', height: '28px' },
  md: { padding: '8px 16px', fontSize: '13px', gap: '8px', borderRadius: '8px', height: '34px' },
  lg: { padding: '10px 22px', fontSize: '14px', gap: '10px', borderRadius: '10px', height: '40px' }
}

const Spinner = () => (
  <svg
    style={{ width: '14px', height: '14px', animation: 'spin 0.8s linear infinite' }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
)

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? {} : { scale: 0.96 }}
        whileHover={isDisabled ? {} : variantHoverStyles[variant]}
        transition={{ duration: 0.12 }}
        disabled={isDisabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'inherit',
          fontWeight: 500,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.5 : 1,
          userSelect: 'none',
          transition: 'opacity 0.15s ease',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style
        }}
        {...props}
      >
        {loading ? <Spinner /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
