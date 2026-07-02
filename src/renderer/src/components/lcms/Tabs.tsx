interface TabItem {
  id: string
  label: string
}

interface TabsProps {
  tabs: TabItem[]
  activeId: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        borderBottom: '1px solid var(--border-default)',
        marginBottom: 18
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s ease, border-color 0.15s ease',
              marginBottom: -1
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
