import { Component, type ComponentType, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, showDetails: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    window.api?.log.error(`[ErrorBoundary] ${error.message}\n${info.componentStack ?? ''}`)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          padding: '32px'
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(232,24,92,0.25)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(232,24,92,0.15)'
          }}
        >
          {/* Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(232,24,92,0.12)',
                border: '1px solid rgba(232,24,92,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}
            >
              ⚡
            </div>
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '2px'
                }}
              >
                Something went wrong
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                An unexpected error occurred in this component.
              </p>
            </div>
          </div>

          {/* Error message */}
          <div
            style={{
              background: 'rgba(232,24,92,0.06)',
              border: '1px solid rgba(232,24,92,0.15)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#f87171',
              fontFamily: "'JetBrains Mono', monospace",
              wordBreak: 'break-word'
            }}
          >
            {this.state.error?.message ?? 'Unknown error'}
          </div>

          {/* Details toggle */}
          {this.state.error?.stack && (
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: '0',
                  marginBottom: '8px'
                }}
              >
                {this.state.showDetails ? '▲ Hide' : '▶ Show'} stack trace
              </button>
              {this.state.showDetails && (
                <pre
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    overflow: 'auto',
                    maxHeight: '160px',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1,
                height: '36px',
                borderRadius: '8px',
                background: '#E8185C',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 0 16px rgba(232,24,92,0.4)'
              }}
            >
              Reload App
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                flex: 1,
                height: '36px',
                borderRadius: '8px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  fallback?: ReactNode
) {
  const displayName = WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'

  function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`
  return WithErrorBoundary
}
