import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  ArrowRight,
  Gavel,
  CheckSquare,
  Bell,
  X,
  Calendar,
  Briefcase,
  FileText,
  Scale,
  ClipboardList,
  Activity
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps
} from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLcmsStore } from '../store/lcms.store'
import { formatDate, formatRelativeTime, initialsOf, sortByField } from '../lib/utils'
import { useFirestoreResource } from '../lib/useFirestoreResource'
import type { AuditEntry, AuditModule, AuditSeverity } from '../lib/audit'

/* ── Page transition ───────────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

/* ── Animated Counter ──────────────────────────────────────── */
function AnimatedCounter({
  target,
  prefix = '',
  suffix = ''
}: {
  target: number
  prefix?: string
  suffix?: string
}) {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)
  const duration = 1200

  useEffect(() => {
    let raf: number
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target])

  const display =
    value >= 1000
      ? value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(1)}M`
        : value >= 100_000
          ? `${(value / 1000).toFixed(0)}K`
          : value.toLocaleString()
      : value.toString()

  return (
    <span>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}

/* ── Stat Card ─────────────────────────────────────────────── */
interface StatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  change?: number
  positive?: boolean
  icon: ReactNode
  color: string
  glowColor: string
}

function StatCard({
  title,
  value,
  prefix,
  suffix,
  change,
  positive,
  icon,
  color,
  glowColor
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: 'var(--shadow-card-hover)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '14px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        borderTop: `2px solid ${color}`,
        cursor: 'default'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: color,
          opacity: 0.06,
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}
      >
        <div>
          <p
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
              letterSpacing: '-0.02em'
            }}
          >
            <AnimatedCounter target={value} prefix={prefix} suffix={suffix} />
          </p>
        </div>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: `${color}18`,
            border: `1px solid ${color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            boxShadow: `0 0 16px ${glowColor}`,
            flexShrink: 0
          }}
        >
          {icon}
        </div>
      </div>
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '12px',
              fontWeight: 600,
              color: positive ? '#10b981' : '#ef4444',
              padding: '2px 6px',
              borderRadius: '6px',
              background: positive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
            }}
          >
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {positive ? '+' : ''}
            {change}%
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>vs last month</span>
        </div>
      )}
    </motion.div>
  )
}

/* ── Activity Feed ─────────────────────────────────────────── */
const moduleColors: Record<AuditModule, string> = {
  Clients: '#6366f1',
  Cases: '#06b6d4',
  Hearings: '#8b5cf6',
  Tasks: '#f59e0b',
  Billing: '#10b981',
  Documents: '#ef4444',
  Users: '#ec4899',
  Settings: '#64748b',
  Auth: '#3b82f6'
}

const severityBadge: Record<AuditSeverity, 'primary' | 'warning' | 'danger'> = {
  Info: 'primary',
  Warning: 'warning',
  Critical: 'danger'
}

/* ── Chart tooltip ─────────────────────────────────────────── */
function ChartTooltip({
  active,
  payload,
  label
}: TooltipProps<ValueType, NameType> & {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--tooltip-bg)',
        border: '1px solid var(--tooltip-border)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: 'var(--tooltip-shadow)',
        fontSize: 12
      }}
    >
      {label && <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{String(label)}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: String(p.color), fontWeight: 600 }}>
          {String(p.name)}: {String(p.value)}
        </p>
      ))}
    </div>
  )
}

/* ── Case Filings Chart ───────────────────────────────────────
   Mirrors the lmts-desktop Activity Timeline: gradient area chart
   plotting real case counts per month for the current year. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function useCaseFilingsData(cases: { createdAt: string }[]): { month: string; filed: number }[] {
  return useMemo(() => {
    const currentYear = new Date().getFullYear()
    const counts: Record<string, number> = {}
    MONTHS.forEach((m) => (counts[m] = 0))
    for (const c of cases) {
      const d = new Date(c.createdAt)
      if (isNaN(d.getTime()) || d.getFullYear() !== currentYear) continue
      const key = MONTHS[d.getMonth()]
      counts[key]++
    }
    return MONTHS.map((month) => ({ month, filed: counts[month] }))
  }, [cases])
}

function CaseFilingsChart({ data }: { data: { month: string; filed: number }[] }) {
  const axisStyle = { fill: 'var(--text-muted)', fontSize: 11 } as const
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
        <defs>
          <linearGradient id="caseFilingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
        <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
        <Area
          type="monotone"
          dataKey="filed"
          name="Cases Filed"
          stroke="var(--accent-primary)"
          strokeWidth={2.5}
          fill="url(#caseFilingsGrad)"
          dot={{ r: 3, fill: 'var(--accent-primary)', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: 'var(--accent-primary)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── helpers ───────────────────────────────────────────────── */
type ReminderEventType = 'hearing' | 'task'

interface ReminderEvent {
  id: string
  date: string
  type: ReminderEventType
  title: string
  detail: string
  link?: string
}

function daysFromToday(dateStr: string): number {
  const today = new Date(new Date().toISOString().slice(0, 10))
  const target = new Date(dateStr)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function reminderDateLabel(dateStr: string, t: (key: string) => string): string {
  const diff = daysFromToday(dateStr)
  if (diff === 0) return t('dashboard.today')
  if (diff === 1) return t('dashboard.tomorrow')
  return formatDate(dateStr)
}

/* ── Reminder Banner ───────────────────────────────────────── */
function ReminderBanner() {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)
  const hearings = useLcmsStore((s) => s.hearings)
  const tasks = useLcmsStore((s) => s.tasks)

  const { hearingCount, taskCount, nextLabel } = useMemo(() => {
    let hCount = 0
    let tCount = 0
    let nearest: string | null = null

    for (const h of hearings) {
      if (h.status === 'Cancelled' || h.status === 'Completed') continue
      const diff = daysFromToday(h.date)
      if (diff >= 0 && diff <= 3) {
        hCount++
        if (!nearest || h.date < nearest) nearest = h.date
      }
    }
    for (const task of tasks) {
      if (task.status === 'Done') continue
      const diff = daysFromToday(task.dueDate)
      if (diff >= 0 && diff <= 3) {
        tCount++
        if (!nearest || task.dueDate < nearest) nearest = task.dueDate
      }
    }

    const label = nearest
      ? daysFromToday(nearest) === 0
        ? 'today'
        : daysFromToday(nearest) === 1
          ? 'tomorrow'
          : `on ${formatDate(nearest)}`
      : null

    return { hearingCount: hCount, taskCount: tCount, nextLabel: label }
  }, [hearings, tasks])

  const total = hearingCount + taskCount
  if (dismissed || total === 0) return null

  const parts: string[] = []
  if (hearingCount > 0) parts.push(`${hearingCount} hearing${hearingCount > 1 ? 's' : ''}`)
  if (taskCount > 0) parts.push(`${taskCount} task${taskCount > 1 ? 's' : ''} due`)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.28)',
          marginBottom: '20px',
          boxShadow: '0 0 30px rgba(99,102,241,0.1)'
        }}
      >
        {/* Pulsing bell */}
        <div
          className="pulse-dot"
          style={{
            color: '#818cf8',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Bell size={15} />
        </div>

        {/* Message */}
        <p style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600, color: '#818cf8' }}>Reminder: </span>
          You have{' '}
          <span style={{ fontWeight: 600 }}>{parts.join(' and ')}</span>
          {nextLabel ? ` — next is ${nextLabel}` : ''}.
        </p>

        {/* View calendar */}
        <button
          onClick={() => navigate('/calendar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(99,102,241,0.18)',
            border: '1px solid rgba(99,102,241,0.35)',
            color: '#a5b4fc',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.28)'
            e.currentTarget.style.color = '#c7d2fe'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.18)'
            e.currentTarget.style.color = '#a5b4fc'
          }}
        >
          View Calendar <ArrowRight size={12} />
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          }}
        >
          <X size={13} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Upcoming Hearings & Reminders Card ────────────────────── */
function UpcomingRemindersCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const hearings = useLcmsStore((s) => s.hearings)
  const tasks = useLcmsStore((s) => s.tasks)
  const cases = useLcmsStore((s) => s.cases)
  const loading = useLcmsStore((s) => s.loading)

  const events = useMemo<ReminderEvent[]>(() => {
    const list: ReminderEvent[] = []

    for (const h of hearings) {
      if (h.status === 'Cancelled' || h.status === 'Completed') continue
      const diff = daysFromToday(h.date)
      if (diff < 0 || diff > 3) continue
      const caseData = cases.find((c) => c.id === h.caseId)
      list.push({
        id: `hearing-${h.id}`,
        date: h.date,
        type: 'hearing',
        title: `${h.hearingType} — ${caseData?.caseTitle ?? 'Unknown case'}`,
        detail: `${h.time} · ${h.courtBranch}`,
        link: caseData ? `/clients/${caseData.clientId}/cases/${caseData.id}` : undefined
      })
    }

    for (const task of tasks) {
      if (task.status === 'Done') continue
      const diff = daysFromToday(task.dueDate)
      if (diff < 0 || diff > 3) continue
      const caseData = task.caseId ? cases.find((c) => c.id === task.caseId) : undefined
      list.push({
        id: `task-${task.id}`,
        date: task.dueDate,
        type: 'task',
        title: task.title,
        detail: caseData ? caseData.caseTitle : t('tasks.none'),
        link: caseData ? `/clients/${caseData.clientId}/cases/${caseData.id}` : undefined
      })
    }

    return list.sort((a, b) => a.date.localeCompare(b.date))
  }, [hearings, tasks, cases, t])

  return (
    <Card
      header={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('dashboard.upcomingReminders')}
          </h2>
          <button
            onClick={() => navigate('/calendar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--accent-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {t('dashboard.viewCalendar')} <ArrowRight size={12} />
          </button>
        </div>
      }
      padding="16px"
    >
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>
          {t('dashboard.noUpcomingReminders')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {events.map((event, i) => (
            <div
              key={event.id}
              onClick={() => event.link && navigate(event.link)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 4px',
                borderBottom: i < events.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: event.link ? 'pointer' : 'default'
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background:
                    event.type === 'hearing' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                  border: `1px solid ${event.type === 'hearing' ? 'rgba(99,102,241,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: event.type === 'hearing' ? '#818cf8' : '#fbbf24'
                }}
              >
                {event.type === 'hearing' ? <Gavel size={14} /> : <CheckSquare size={14} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {event.title}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {event.detail}
                </p>
              </div>
              <Badge variant={event.type === 'hearing' ? 'primary' : 'warning'}>
                {reminderDateLabel(event.date, t)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ── Quick Navigation ──────────────────────────────────────── */
const quickNavItems = [
  { path: '/clients', label: 'Clients', icon: Users, color: '#6366f1', glow: 'rgba(99,102,241,0.3)' },
  { path: '/cases', label: 'Cases', icon: Briefcase, color: '#06b6d4', glow: 'rgba(6,182,212,0.3)' },
  { path: '/hearings', label: 'Hearings', icon: Gavel, color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
  { path: '/calendar', label: 'Calendar', icon: Calendar, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  { path: '/documents', label: 'Documents', icon: FileText, color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
  { path: '/billing', label: 'Billing', icon: DollarSign, color: '#06b6d4', glow: 'rgba(6,182,212,0.3)' },
  { path: '/legal-research', label: 'Legal Research', icon: Scale, color: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
  { path: '/reports', label: 'Reports', icon: ClipboardList, color: '#f472b6', glow: 'rgba(244,114,182,0.3)' }
]

function QuickNavSection() {
  const navigate = useNavigate()

  return (
    <div style={{ marginTop: '20px' }}>
      <h2
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          marginBottom: '14px'
        }}
      >
        Quick Navigation
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: '12px'
        }}
      >
        {quickNavItems.map((item, i) => (
          <motion.button
            key={item.path}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 + i * 0.04 }}
            whileHover={{ y: -4, boxShadow: `0 8px 24px ${item.glow}` }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '18px 12px',
              borderRadius: '14px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: `${item.color}18`,
                border: `1px solid ${item.color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color,
                boxShadow: `0 0 16px ${item.glow}`
              }}
            >
              <item.icon size={20} />
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                lineHeight: 1.3
              }}
            >
              {item.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

/* ── Dashboard View ────────────────────────────────────────── */
export function Dashboard() {
  const navigate = useNavigate()
  const clients = useLcmsStore((s) => s.clients)
  const cases = useLcmsStore((s) => s.cases)
  const hearings = useLcmsStore((s) => s.hearings)
  const tasks = useLcmsStore((s) => s.tasks)
  const lcmsLoading = useLcmsStore((s) => s.loading)

  const activeCases = cases.filter(
    (c) => c.status !== 'CLOSED' && c.status !== 'DISMISSED'
  ).length

  const today = new Date(new Date().toISOString().slice(0, 10))
  const upcomingHearings = hearings.filter((h) => {
    if (h.status === 'Cancelled' || h.status === 'Completed') return false
    const diff = Math.round((new Date(h.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 7
  }).length

  const openTasks = tasks.filter((t) => t.status !== 'Done').length

  const caseFilingsData = useCaseFilingsData(cases)
  const casesFiledThisYear = caseFilingsData.reduce((sum, m) => sum + m.filed, 0)

  const { items: auditLogs, loading: auditLoading } = useFirestoreResource<AuditEntry>('auditLogs')
  const recentActivity = useMemo(() => sortByField(auditLogs, 'timestamp', 'desc').slice(0, 6), [auditLogs])

  const stats: StatCardProps[] = [
    {
      title: 'Total Clients',
      value: clients.length,
      icon: <Users size={20} />,
      color: '#6366f1',
      glowColor: 'rgba(99,102,241,0.3)'
    },
    {
      title: 'Active Cases',
      value: activeCases,
      icon: <Gavel size={20} />,
      color: '#06b6d4',
      glowColor: 'rgba(6,182,212,0.3)'
    },
    {
      title: 'Upcoming Hearings',
      value: upcomingHearings,
      icon: <Calendar size={20} />,
      color: '#10b981',
      glowColor: 'rgba(16,185,129,0.3)'
    },
    {
      title: 'Open Tasks',
      value: openTasks,
      icon: <CheckSquare size={20} />,
      color: '#f59e0b',
      glowColor: 'rgba(245,158,11,0.3)'
    }
  ]

  return (
    <motion.div
      key="dashboard"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '4px'
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Welcome back. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge variant="success" dot>
            Live
          </Badge>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={13} />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={13} />}>
            New Report
          </Button>
        </div>
      </div>

      {/* ── Reminder Banner (shows only when upcoming events exist) */}
      <ReminderBanner />

      {/* Stats Grid */}
      {lcmsLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 108 }} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '20px',
          marginBottom: '20px'
        }}
      >
        {/* Left column: Chart + Reminders stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
        >
          <Card
            header={
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Activity size={13} color="var(--accent-primary)" />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}
                  >
                    Case Filings
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: 'var(--accent-primary-subtle)',
                    color: 'var(--accent-primary)'
                  }}
                >
                  {new Date().getFullYear()}
                </span>
              </div>
            }
          >
            {lcmsLoading ? (
              <div className="skeleton" style={{ height: 180 }} />
            ) : (
              <>
                <div style={{ marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {casesFiledThisYear}
                  </span>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    cases filed this year
                  </span>
                </div>
                <div style={{ height: '180px' }}>
                  <CaseFilingsChart data={caseFilingsData} />
                </div>
              </>
            )}
          </Card>
        </motion.div>

          {/* Upcoming Hearings & Reminders — sits directly below the chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.5 }}
          >
            <UpcomingRemindersCard />
          </motion.div>
        </div>

        {/* Activity Feed — right column, stretches to match left column height */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.42 }}
        >
          <Card
            fill
            style={{ height: '100%' }}
            header={
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Activity Feed
                </h2>
                <button
                  onClick={() => navigate('/audit-trail')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: 'var(--accent-primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
            }
            padding="16px"
          >
            <div>
              {auditLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 44, borderRadius: 8, marginBottom: '6px' }}
                  />
                ))
              ) : recentActivity.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>
                  No activity recorded yet.
                </p>
              ) : (
                recentActivity.map((item, i) => {
                  const color = moduleColors[item.module]
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 0',
                        borderBottom:
                          i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                      }}
                    >
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: `${color}22`,
                          border: `1px solid ${color}44`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 700,
                          color,
                          flexShrink: 0
                        }}
                      >
                        {initialsOf(item.user)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            lineHeight: '1.4',
                            marginBottom: '3px'
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{item.user}</span>{' '}
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {item.action.toLowerCase()}
                          </span>{' '}
                          <span style={{ color }}>{item.target}</span>
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Badge
                            variant={severityBadge[item.severity]}
                            style={{ fontSize: '10px', padding: '1px 6px' }}
                          >
                            {item.module}
                          </Badge>
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-muted)',
                              fontFamily: "'JetBrains Mono', monospace"
                            }}
                          >
                            {formatRelativeTime(item.timestamp)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.62 }}
      >
        <QuickNavSection />
      </motion.div>
    </motion.div>
  )
}
