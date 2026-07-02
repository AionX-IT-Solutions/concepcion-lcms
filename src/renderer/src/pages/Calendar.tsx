import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Gavel, CheckSquare } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useLcmsStore } from '../store/lcms.store'
import { formatDate } from '../lib/utils'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface CalendarEvent {
  id: string
  date: string
  type: 'hearing' | 'task'
  title: string
  detail: string
  link?: string
}

export function Calendar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const hearings = useLcmsStore((s) => s.hearings)
  const tasks = useLcmsStore((s) => s.tasks)
  const cases = useLcmsStore((s) => s.cases)

  const events = useMemo<CalendarEvent[]>(() => {
    const today = new Date().toISOString().slice(0, 10)
    const list: CalendarEvent[] = []

    for (const h of hearings) {
      if (h.date < today || h.status === 'Cancelled' || h.status === 'Completed') continue
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
      if (task.dueDate < today || task.status === 'Done') continue
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
    <motion.div
      key="calendar"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      <PageHeader
        icon={<CalendarDays size={20} />}
        title={t('calendar.title')}
        subtitle={t('calendar.subtitle')}
      />

      <Card padding="0">
        {events.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>
            {t('calendar.noUpcoming')}
          </p>
        ) : (
          <div>
            {events.map((event, i) => (
              <div
                key={event.id}
                onClick={() => event.link && navigate(event.link)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < events.length - 1 ? '1px solid var(--c-divider)' : 'none',
                  cursor: event.link ? 'pointer' : 'default'
                }}
                className={event.link ? 'table-row-hover' : undefined}
              >
                <div
                  style={{
                    width: 64,
                    flexShrink: 0,
                    textAlign: 'center',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {formatDate(event.date)}
                </div>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color:
                      event.type === 'hearing' ? 'var(--accent-primary)' : 'var(--accent-amber)'
                  }}
                >
                  {event.type === 'hearing' ? <Gavel size={14} /> : <CheckSquare size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {event.title}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {event.detail}
                  </p>
                </div>
                <Badge variant={event.type === 'hearing' ? 'primary' : 'warning'}>
                  {event.type === 'hearing' ? t('calendar.hearing') : t('calendar.taskDue')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
