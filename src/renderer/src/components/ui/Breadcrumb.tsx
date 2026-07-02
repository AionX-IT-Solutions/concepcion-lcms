import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { useLcmsStore } from '../../store/lcms.store'
import { getFullName } from '../../lib/utils'
import { MODULES } from '../../config/modules'

const routeLabels: Record<string, string> = {
  settings: 'Settings',
  about: 'About',
  cases: 'Cases',
  ...Object.fromEntries(MODULES.map((m) => [m.path.replace('/', ''), m.label]))
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function Breadcrumb() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const clients = useLcmsStore((s) => s.clients)
  const cases = useLcmsStore((s) => s.cases)

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const crumbs = segments.map((seg, i) => {
    const prevSeg = segments[i - 1]
    let label = routeLabels[seg] ?? capitalize(seg)

    if (prevSeg === 'clients') {
      const client = clients.find((c) => c.id === seg)
      if (client) label = getFullName(client.firstName, client.middleName ?? '', client.lastName)
    } else if (prevSeg === 'cases') {
      const matchedCase = cases.find((c) => c.id === seg)
      if (matchedCase) label = matchedCase.caseTitle
    }

    return {
      label,
      path: `/${segments.slice(0, i + 1).join('/')}`
    }
  })

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 28,
        paddingRight: 28,
        background: 'var(--bg-base)',
        flexShrink: 0
      }}
    >
      {/* Home icon */}
      <Tooltip content="Home" side="bottom">
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '3px 4px',
            borderRadius: 5,
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <Home size={13} />
        </button>
      </Tooltip>

      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <div key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            {isLast ? (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  userSelect: 'none'
                }}
              >
                {crumb.label}
              </span>
            ) : (
              <button
                onClick={() => navigate(crumb.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  padding: '3px 4px',
                  borderRadius: 5,
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {crumb.label}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
