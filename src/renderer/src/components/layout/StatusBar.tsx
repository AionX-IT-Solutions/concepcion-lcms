import { useEffect, useState } from 'react'
import { useElectron } from '../../hooks/useElectron'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function StatusBar() {
  const { appVersion } = useElectron()
  const [time, setTime] = useState(() => {
    const now = new Date()
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  })

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(6,6,14,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingLeft: '14px',
        paddingRight: '14px',
        flexShrink: 0,
        zIndex: 10
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Ready indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'block',
              boxShadow: '0 0 6px rgba(16,185,129,0.7)',
              animation: 'pulse-glow 2s ease-in-out infinite'
            }}
          />
          <span
            style={{
              fontSize: '10px',
              color: '#10b981',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.03em',
              fontWeight: 500
            }}
          >
            Ready
          </span>
        </div>

        {/* Separator */}
        <div
          style={{
            width: '1px',
            height: '12px',
            background: 'rgba(255,255,255,0.08)'
          }}
        />

        {/* Version */}
        <span
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.02em'
          }}
        >
          v{appVersion}
        </span>

        {/* Separator */}
        <div
          style={{
            width: '1px',
            height: '12px',
            background: 'rgba(255,255,255,0.08)'
          }}
        />

        {/* Build label */}
        <span
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          electron-vite
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* OS */}
        <span
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          Windows
        </span>

        {/* Separator */}
        <div
          style={{
            width: '1px',
            height: '12px',
            background: 'rgba(255,255,255,0.08)'
          }}
        />

        {/* Clock */}
        <span
          style={{
            fontSize: '10px',
            color: 'var(--text-secondary)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.05em',
            fontWeight: 500
          }}
        >
          {time}
        </span>
      </div>
    </div>
  )
}
