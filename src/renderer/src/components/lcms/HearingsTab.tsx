import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { DataTable, type Column } from '../ui/DataTable'
import { HearingFormModal } from './HearingFormModal'
import { useLcmsStore } from '../../store/lcms.store'
import { formatDate, sortByField } from '../../lib/utils'
import type { Hearing } from '../../types/lcms.types'

const statusVariant: Record<Hearing['status'], 'success' | 'warning' | 'danger' | 'default'> = {
  Scheduled: 'success',
  Postponed: 'warning',
  Cancelled: 'danger',
  Completed: 'default'
}

interface HearingsTabProps {
  caseId: string
  addOpen?: boolean
  onAddOpenChange?: (open: boolean) => void
}

export function HearingsTab({ caseId, addOpen = false, onAddOpenChange }: HearingsTabProps) {
  const { t } = useTranslation()
  const allHearings = useLcmsStore((s) => s.hearings)
  const hearings = useMemo(
    () =>
      sortByField(
        allHearings.filter((h) => h.caseId === caseId),
        'date',
        'desc'
      ),
    [allHearings, caseId]
  )
  const [editing, setEditing] = useState<Hearing | undefined>(undefined)

  const columns: Column<Hearing>[] = [
    { key: 'date', header: t('hearings.date'), render: (row) => formatDate(row.date) },
    { key: 'time', header: t('hearings.time') },
    { key: 'courtBranch', header: t('hearings.courtBranch') },
    { key: 'hearingType', header: t('hearings.hearingType') },
    {
      key: 'status',
      header: t('hearings.status'),
      render: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
    }
  ]

  return (
    <Card padding="0">
      <DataTable
        columns={columns}
        data={hearings}
        emptyMessage={t('hearings.noHearings')}
        onRowClick={(row) => setEditing(row)}
      />
      <HearingFormModal
        open={addOpen}
        onOpenChange={(open) => onAddOpenChange?.(open)}
        caseId={caseId}
      />
      <HearingFormModal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
        caseId={caseId}
        hearing={editing}
      />
    </Card>
  )
}
