import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  /** Used to resolve the currently-selected label, and as the result list when `onSearch` isn't given. */
  options: SearchableSelectOption[]
  /** When provided, results come from this (e.g. a real Firestore query) instead of filtering `options` client-side. */
  onSearch?: (query: string) => Promise<SearchableSelectOption[]>
  placeholder?: string
  searchPlaceholder?: string
  error?: boolean
  /** Max matching results shown at once — type to narrow further. */
  maxResults?: number
}

/**
 * A searchable dropdown for long option lists (e.g. picking a client or case).
 * Renders inline (not via a portal) — this is used inside Modal (a Radix
 * Dialog), whose FocusScope traps focus within the dialog's own DOM subtree.
 * A document.body portal sits outside that subtree, so Radix immediately
 * yanks focus back to the dialog on every keystroke, making the search box
 * untypeable. Staying inline avoids that entirely.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  onSearch,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  error,
  maxResults = 10
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [remoteResults, setRemoteResults] = useState<SearchableSelectOption[]>([])
  const [searching, setSearching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    setQuery('')
    const id = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Real server-side search — debounced, cancels stale requests instead of racing them.
  useEffect(() => {
    if (!open || !onSearch) return
    let cancelled = false
    setSearching(true)
    const id = setTimeout(() => {
      onSearch(query)
        .then((found) => {
          if (!cancelled) setRemoteResults(found)
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [open, query, onSearch])

  const localMatches = onSearch
    ? []
    : options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
  const visible = onSearch ? remoteResults : localMatches.slice(0, maxResults)

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('input-field', error && 'border-red-500/60')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%'
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selected ? 'inherit' : '#9ca3af'
          }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            marginLeft: 8,
            color: '#9ca3af',
            transition: 'transform 0.15s ease',
            transform: open ? 'rotate(180deg)' : 'none'
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 50,
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 14,
            boxShadow: '0 16px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'relative', padding: 8 }}>
            {searching ? (
              <Loader2
                size={14}
                style={{
                  position: 'absolute',
                  left: 20,
                  top: 'calc(50% - 7px)',
                  color: '#9ca3af',
                  animation: 'spin-slow 0.8s linear infinite'
                }}
              />
            ) : (
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }}
              />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                height: 34,
                padding: '0 12px 0 34px',
                borderRadius: 9,
                border: '1px solid rgba(0,0,0,0.1)',
                background: '#f5f5f7',
                color: '#12122a',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '0 6px 6px' }}>
            {visible.length === 0 ? (
              <div style={{ padding: '16px 12px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                {searching ? 'Searching…' : 'No matches'}
              </div>
            ) : (
              visible.map((o) => (
                <div
                  key={o.value}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  style={{
                    padding: '9px 10px',
                    fontSize: 13,
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: '#12122a',
                    background: o.value === value ? 'rgba(99,102,241,0.1)' : 'transparent'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      o.value === value ? 'rgba(99,102,241,0.1)' : 'transparent')
                  }
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
          {!onSearch && localMatches.length > maxResults && (
            <div style={{ padding: '6px 12px 10px', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
              Showing {maxResults} of {localMatches.length} — keep typing to narrow down
            </div>
          )}
          {onSearch && visible.length === maxResults && (
            <div style={{ padding: '6px 12px 10px', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
              Showing first {maxResults} matches — keep typing to narrow down
            </div>
          )}
        </div>
      )}
    </div>
  )
}
