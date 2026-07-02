import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Gavel, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, type Column, useColumnVisibility, ColumnsButton } from '../components/ui/DataTable'
import { TableToolbar, ToolbarSelect } from '../components/ui/TableToolbar'
import { HearingFormModal } from '../components/lcms/HearingFormModal'
import { useLcmsStore } from '../store/lcms.store'
import { useToast } from '../hooks/useToast'
import { formatDate, sortByField } from '../lib/utils'
import type { Hearing } from '../types/lcms.types'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface HearingRow extends Hearing {
  caseTitle: string
  caseNumber: string
  clientId: string
}

const statusVariant: Record<Hearing['status'], 'success' | 'warning' | 'danger' | 'default'> = {
  Scheduled: 'success',
  Postponed: 'warning',
  Cancelled: 'danger',
  Completed: 'default'
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Postponed', label: 'Postponed' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
]

export function Hearings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const hearings = useLcmsStore((s) => s.hearings)
  const cases = useLcmsStore((s) => s.cases)
  const lcmsLoading = useLcmsStore((s) => s.loading)
  const deleteHearing = useLcmsStore((s) => s.deleteHearing)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Hearing | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Hearing | null>(null)
  const [deleting, setDeleting] = useState(false)

  const onDeleteHearing = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteHearing(deleteTarget.id)
      toast.success(t('lcms.saved'))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const rows: HearingRow[] = useMemo(() => {
    const withCase = hearings.map((h) => {
      const caseData = cases.find((c) => c.id === h.caseId)
      return {
        ...h,
        caseTitle: caseData?.caseTitle ?? '-',
        caseNumber: caseData?.caseNumber ?? '-',
        clientId: caseData?.clientId ?? ''
      }
    })
    return sortByField(withCase, 'date', 'asc')
  }, [hearings, cases])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (!q) return true
      return (
        r.caseTitle.toLowerCase().includes(q) ||
        r.hearingType.toLowerCase().includes(q) ||
        r.courtBranch.toLowerCase().includes(q)
      )
    })
  }, [rows, search, statusFilter])

  const columns: Column<HearingRow>[] = [
    { key: 'date', header: t('hearings.date'), render: (row) => formatDate(row.date) },
    { key: 'time', header: t('hearings.time') },
    { key: 'caseTitle', header: t('hearings.case') },
    { key: 'courtBranch', header: t('hearings.courtBranch') },
    { key: 'hearingType', header: t('hearings.hearingType') },
    {
      key: 'status',
      header: t('hearings.status'),
      render: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
    },
    {
      key: 'id',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={12} />}
          onClick={(e) => {
            e.stopPropagation()
            setDeleteTarget(row)
          }}
        >
          {t('lcms.delete')}
        </Button>
      )
    }
  ]
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)

  return (
    <motion.div
      key="hearings"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      <PageHeader
        icon={<Gavel size={20} />}
        title={t('hearings.title')}
        subtitle={t('hearings.subtitle')}
        actions={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={14} />
            {t('hearings.addHearing')}
          </button>
        }
      />

      <TableToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search hearings..."
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={
          <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        }
      />

      <Card padding="0">
        <DataTable
          columns={columns}
          data={filteredRows}
          hiddenColumns={hiddenColumns}
          loading={lcmsLoading}
          emptyMessage={t('hearings.noHearings')}
          onRowClick={(row) => setEditing(row)}
          onRowDoubleClick={(row) =>
            row.clientId && navigate(`/clients/${row.clientId}/cases/${row.caseId}`)
          }
        />
      </Card>

      <HearingFormModal open={addOpen} onOpenChange={setAddOpen} />
      <HearingFormModal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
        hearing={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Hearing"
        message={
          deleteTarget
            ? `Delete the ${deleteTarget.hearingType} hearing on ${formatDate(deleteTarget.date)}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDeleteHearing}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  )
}
