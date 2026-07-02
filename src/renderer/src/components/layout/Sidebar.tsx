import { motion } from 'framer-motion'
import { Settings, Info, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/app.store'
import { useState, type ReactNode } from 'react'
import { Tooltip } from '../ui/Tooltip'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { MODULE_GROUPS, MODULES } from '../../config/modules'
import { initialsOf } from '../../lib/utils'
import { usePermissions } from '../../hooks/usePermissions'

interface NavItem {
  path: string
  label: string
  icon: ReactNode
}

const footerNavItems: NavItem[] = [
  { path: '/settings', label: 'Settings', icon: <Settings size={16} /> },
  { path: '/about', label: 'About', icon: <Info size={16} /> }
]

// ─── Nav item ─────────────────────────────────────────────────────────────────

interface SidebarNavItemProps {
  item: NavItem
  isActive: boolean
  collapsed: boolean
  onClick: () => void
}

function SidebarNavItem({ item, isActive, collapsed, onClick }: SidebarNavItemProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.97 }}
      style={{
        width: '100%',
        height: 38,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '0 11px' : '0 12px',
        borderRadius: 10,
        border: isActive ? '1px solid var(--accent-primary-subtle)' : '1px solid transparent',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        background: isActive
          ? 'var(--accent-primary-subtle)'
          : hovered
            ? 'var(--sidebar-nav-hover)'
            : 'transparent',
        transition: 'background 0.15s ease, border-color 0.15s ease',
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0,
        boxShadow: isActive ? 'inset 3px 0 0 var(--accent-primary)' : 'none'
      }}
    >
      {/* Icon */}
      <span
        style={{
          color: isActive
            ? 'var(--accent-primary)'
            : hovered
              ? 'var(--text-primary)'
              : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.15s ease',
          flexShrink: 0
        }}
      >
        {item.icon}
      </span>

      {/* Label */}
      {!collapsed && (
        <span
          style={{
            fontSize: 13,
            fontWeight: isActive ? 600 : 500,
            color: isActive
              ? 'var(--text-primary)'
              : hovered
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'color 0.15s ease'
          }}
        >
          {item.label}
        </span>
      )}
    </motion.button>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)
  const logout = useAppStore((s) => s.logout)
  const currentUser = useAppStore((s) => s.currentUser)
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()
  const location = useLocation()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const userName = currentUser.displayName || currentUser.email || 'LCMS User'
  const userRole = currentUser.role || 'Member'
  const userInitials = initialsOf(userName) || 'U'

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/')
    } finally {
      setLoggingOut(false)
      setLogoutConfirmOpen(false)
    }
  }

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  function renderNavItem(item: NavItem) {
    const active = isActive(item.path)
    const navItem = (
      <SidebarNavItem
        key={item.path}
        item={item}
        isActive={active}
        collapsed={collapsed}
        onClick={() => navigate(item.path)}
      />
    )
    return collapsed ? (
      <Tooltip key={item.path} content={item.label} side="right">
        {navItem}
      </Tooltip>
    ) : (
      navItem
    )
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 270 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--sidebar-border)',
        boxShadow: 'var(--sidebar-shadow)',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* ── Header: Logo + Title + Collapse btn ─────────────────── */}
      <div
        style={{
          minHeight: collapsed ? 58 : 72,
          padding: collapsed ? '0 14px' : '12px 10px 12px 14px',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
          flexShrink: 0,
          transition: 'padding 0.25s ease'
        }}
      >
        {/* Logo + text */}
        {(() => {
          const logoButton = (
            <button
              onClick={() => collapsed && setSidebarCollapsed(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'none',
                border: 'none',
                cursor: collapsed ? 'pointer' : 'default',
                padding: 0,
                overflow: 'hidden',
                minWidth: 0,
                flex: collapsed ? '0 0 auto' : '1 1 auto'
              }}
            >
              {/* Logo square */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}lcms-icon.png`}
                  alt="LCMS"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }}
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>

              {/* App name + subtitle */}
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}
                >
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 11.5,
                      lineHeight: 1.25,
                      color: 'var(--text-primary)',
                      whiteSpace: 'normal',
                      wordBreak: 'normal',
                      letterSpacing: '0.01em'
                    }}
                  >
                    Legal Case Management System
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      marginTop: 3,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    Concepcion Law Office
                  </p>
                </motion.div>
              )}
            </button>
          )
          return collapsed ? (
            <Tooltip content="Expand sidebar" side="right">
              {logoButton}
            </Tooltip>
          ) : (
            logoButton
          )
        })()}

        {/* Collapse button — only when expanded */}
        {!collapsed && (
          <Tooltip content="Collapse sidebar" side="right">
            <button
              onClick={() => setSidebarCollapsed(true)}
              style={{
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 7,
                border: '1px solid var(--sidebar-border)',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--sidebar-nav-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <ChevronLeft size={13} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* ── Main navigation (scrollable) ────────────────────────── */}
      <nav
        style={{
          flex: 1,
          padding: collapsed ? '10px 8px' : '10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none'
        }}
      >
        {MODULE_GROUPS.map((group) => {
          const items = MODULES.filter((m) => m.group === group && hasPermission(m.permission))
          if (items.length === 0) return null
          return (
            <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!collapsed && (
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    padding: '10px 12px 4px'
                  }}
                >
                  {group}
                </p>
              )}
              {items.map((m) =>
                renderNavItem({
                  path: m.path,
                  label: m.label,
                  icon: <m.icon size={16} />
                })
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Footer: expand + settings + about + logout ──────────── */}
      <div
        style={{
          padding: collapsed ? '10px 8px' : '10px 10px',
          borderTop: '1px solid var(--sidebar-border)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {/* Expand button — only when collapsed */}
        {collapsed && (
          <Tooltip content="Expand sidebar" side="right">
            <button
              onClick={() => setSidebarCollapsed(false)}
              style={{
                width: '100%',
                height: 34,
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                border: '1px solid var(--sidebar-border)',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--sidebar-nav-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <ChevronRight size={14} />
            </button>
          </Tooltip>
        )}

        {/* Settings + About */}
        {footerNavItems.map(renderNavItem)}
      </div>

      {/* ── User profile ─────────────────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '10px 8px' : '10px 10px',
          borderTop: '1px solid var(--sidebar-border)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10,
          overflow: 'hidden',
          minWidth: 0
        }}
      >
        {/* Avatar */}
        <Tooltip content={collapsed ? userName : ''} side="right">
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 0 12px var(--accent-primary-glow)',
              cursor: 'default'
            }}
          >
            {userInitials}
          </div>
        </Tooltip>

        {/* Name + role + logout — only when expanded */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {userRole}
              </div>
            </div>

            {/* Logout icon button */}
            <Tooltip content="Sign out" side="top">
              <LogoutIconButton onLogout={() => setLogoutConfirmOpen(true)} />
            </Tooltip>
          </motion.div>
        )}
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Sign Out"
        message="Are you sure you want to sign out of LCMS?"
        confirmLabel="Sign Out"
        danger
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </motion.aside>
  )
}

// ─── Logout icon button ───────────────────────────────────────────────────────

function LogoutIconButton({ onLogout }: { onLogout: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onLogout}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: hovered ? 'rgba(239,68,68,0.12)' : 'transparent',
        border: hovered ? '1px solid rgba(239,68,68,0.25)' : '1px solid transparent',
        cursor: 'pointer',
        color: hovered ? '#ef4444' : 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s ease'
      }}
    >
      <LogOut size={14} />
    </button>
  )
}
