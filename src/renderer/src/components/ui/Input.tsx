import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, style, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const hasError = Boolean(error)

    const borderColor = hasError
      ? 'rgba(239,68,68,0.6)'
      : focused
        ? 'var(--accent-primary)'
        : 'rgba(255,255,255,0.1)'

    const boxShadow = hasError
      ? focused
        ? '0 0 0 3px rgba(239,68,68,0.15)'
        : 'none'
      : focused
        ? '0 0 0 3px var(--accent-primary-glow)'
        : 'none'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              letterSpacing: '0.02em'
            }}
          >
            {label}
          </label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span
              style={{
                position: 'absolute',
                left: '10px',
                color: focused ? 'var(--accent-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s ease',
                pointerEvents: 'none'
              }}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            style={{
              width: '100%',
              height: '36px',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
              paddingLeft: leftIcon ? '34px' : '12px',
              paddingRight: rightIcon ? '34px' : '12px',
              boxShadow,
              backdropFilter: 'blur(8px)',
              ...style
            }}
            className={className}
            {...props}
          />

          {rightIcon && (
            <span
              style={{
                position: 'absolute',
                right: '10px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {(helperText || error) && (
          <p
            style={{
              fontSize: '11px',
              color: error ? '#ef4444' : 'var(--text-muted)',
              marginTop: '2px',
              lineHeight: '1.4'
            }}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
