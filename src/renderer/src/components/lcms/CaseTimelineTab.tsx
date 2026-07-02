import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Gavel, FileText, ScrollText, Scale } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { useLcmsStore } from '../../store/lcms.store'
import { formatDate } from '../../lib/utils'

type TimelineEventType = 'decision' | 'document' | 'hearing' | 'note'

interface TimelineEvent {
  id: string
  date: string
  type: TimelineEventType
  title: string
  detail?: string
}

const typeIcon: Record<TimelineEventType, typeof Gavel> = {
  decision: Scale,
  document: FileText,
  hearing: Gavel,
  note: ScrollText
}

const typeBadge: Record<TimelineEventType, 'primary' | 'cyan' | 'success' | 'default'> = {
  decision: 'primary',
  document: 'cyan',
  hearing: 'success',
  note: 'default'
}

export function CaseTimelineTab({ caseId }: { caseId: string }) {
  const { t } = useTranslation()
  const decisions = useLcmsStore((s) => s.caseDecisions)
  const devEntries = useLcmsStore((s) => s.caseDevEntries)
  const hearings = useLcmsStore((s) => s.hearings)
  const notes = useLcmsStore((s) => s.caseNotes)

  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = []
    for (const d of decisions) {
      if (d.caseId !== caseId) continue
      list.push({
        id: `decision-${d.id}`,
        date: d.dateOfPromulgation,
        type: 'decision',
        title: d.action
      })
    }
    for (const e of devEntries) {
      if (e.caseId !== caseId) continue
      list.push({
        id: `doc-${e.id}`,
        date: e.date,
        type: 'document',
        title: e.documentType,
        detail: e.description
      })
    }
    for (const h of hearings) {
      if (h.caseId !== caseId) continue
      list.push({
        id: `hearing-${h.id}`,
        date: h.date,
        type: 'hearing',
        title: `${h.hearingType} — ${h.status}`,
        detail: h.courtBranch
      })
    }
    for (const n of notes) {
      if (n.caseId !== caseId) continue
      list.push({
        id: `note-${n.id}`,
        date: n.date,
        type: 'note',
        title: t('caseNotes.note'),
        detail: n.text
      })
    }
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [decisions, devEntries, hearings, notes, caseId, t])

  return (
    <Card header={<h2 style={{ fontSize: 14, fontWeight: 600 }}>{t('timeline.title')}</h2>}>
      {events.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('timeline.noEvents')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.map((event, i) => {
            const Icon = typeIcon[event.type]
            return (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  gap: 14,
                  paddingBottom: i < events.length - 1 ? 18 : 0,
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-primary)',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  {i < events.length - 1 && (
                    <div
                      style={{
                        width: 1,
                        flex: 1,
                        background: 'var(--border-default)',
                        marginTop: 4
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatDate(event.date)}
                    </span>
                    <Badge variant={typeBadge[event.type]}>{event.type}</Badge>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {event.title}
                  </p>
                  {event.detail && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        marginTop: 2,
                        lineHeight: 1.5
                      }}
                    >
                      {event.detail}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
