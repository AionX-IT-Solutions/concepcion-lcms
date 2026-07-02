import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Briefcase, Plus } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column, useColumnVisibility, ColumnsButton } from '../components/ui/DataTable'
import { TableToolbar, ToolbarSelect } from '../components/ui/TableToolbar'
import { CaseFormModal } from '../components/lcms/CaseFormModal'
import { useLcmsStore } from '../store/lcms.store'
import { getFullName } from '../lib/utils'
import type { Case } from '../types/lcms.types'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface CaseRow extends Case {
  clientName: string
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'WITH DECISION / RESOLUTION', label: 'With Decision' },
  { value: 'ON APPEAL', label: 'On Appeal' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'CLOSED', label: 'Closed' }
]

export function Cases() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const cases = useLcmsStore((s) => s.cases)
  const clients = useLcmsStore((s) => s.clients)
  const lcmsLoading = useLcmsStore((s) => s.loading)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const rows: CaseRow[] = useMemo(
    () =>
      cases.map((c) => {
        const client = clients.find((cl) => cl.id === c.clientId)
        return {
          ...c,
          clientName: client
            ? getFullName(client.firstName, client.middleName ?? '', client.lastName)
            : '-'
        }
      }),
    [cases, clients]
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (!q) return true
      return (
        r.caseTitle.toLowerCase().includes(q) ||
        r.caseNumber.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q)
      )
    })
  }, [rows, search, statusFilter])

  const columns: Column<CaseRow>[] = [
    { key: 'caseNumber', header: t('cases.caseNumber') },
    { key: 'caseTitle', header: t('cases.caseTitle') },
    { key: 'clientName', header: t('globalCases.client') },
    { key: 'caStation', header: t('cases.caStation') },
    {
      key: 'status',
      header: t('cases.status'),
      render: (row) => (
        <Badge variant={row.status === 'WITH DECISION / RESOLUTION' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      )
    }
  ]
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)

  return (
    <motion.div
      key="cases"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      <PageHeader
        icon={<Briefcase size={20} />}
        subtitle={t('globalCases.subtitle')}
        actions={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> {t('cases.addCase')}
          </button>
        }
      />

      <TableToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder={t('globalCases.searchPlaceholder')}
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={
          <ToolbarSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        }
      />

      <Card padding="0">
        <DataTable
          columns={columns}
          data={filteredRows}
          hiddenColumns={hiddenColumns}
          loading={lcmsLoading}
          emptyMessage={t('cases.noCases')}
          onRowClick={(row) => navigate(`/clients/${row.clientId}/cases/${row.id}`)}
        />
      </Card>

      <CaseFormModal open={addOpen} onOpenChange={setAddOpen} />
    </motion.div>
  )
}
