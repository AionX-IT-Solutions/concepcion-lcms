import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

interface TableToolbarProps {
  search?: string
  onSearch?: (val: string) => void
  searchPlaceholder?: string
  total?: number
  filters?: ReactNode
  columnsButton?: ReactNode
}

/** Compact filter select styled for the toolbar */
export function ToolbarSelect({
  value,
  onChange,
  options
}: {
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '0 32px 0 10px',
        height: 36,
        borderRadius: 8,
        border: '1px solid var(--c-input-border)',
        background: 'var(--c-input-bg)',
        color: 'var(--c-text-1)',
        fontSize: 13,
        cursor: 'pointer',
        outline: 'none',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        minWidth: 140,
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888aa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        transition: 'border-color 0.15s, background 0.15s'
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/** Card row containing search + filter selects + columns visibility button */
export function TableToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search...',
  total,
  filters,
  columnsButton
}: TableToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        marginBottom: 12,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-card)'
      }}
    >
      {/* Search */}
      {onSearch !== undefined && (
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
          <input
            className="input-field"
            style={{ paddingLeft: 32, height: 36, padding: '0 12px 0 32px' }}
            placeholder={searchPlaceholder}
            value={search ?? ''}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}

      {/* Filter selects */}
      {filters}

      {/* Divider before columns button */}
      {columnsButton && (onSearch !== undefined || filters) && (
        <div
          style={{ width: 1, height: 22, background: 'var(--border-default)', flexShrink: 0 }}
        />
      )}

      {/* Column visibility button */}
      {columnsButton}

      {/* Row count badge */}
      {total !== undefined && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-default)',
            borderRadius: 6,
            padding: '2px 8px',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
        >
          {total} {total === 1 ? 'row' : 'rows'}
        </span>
      )}
    </div>
  )
}
