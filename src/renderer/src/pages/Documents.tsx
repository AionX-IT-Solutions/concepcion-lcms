import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { DataTable, type Column, useColumnVisibility, ColumnsButton } from '../components/ui/DataTable'
import { TableToolbar, ToolbarSelect } from '../components/ui/TableToolbar'
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

interface DocumentRow {
  id: string
  date: string
  documentType: string
  description: string
  caseTitle: string
  clientId: string
  caseId: string
  hasFile: boolean
  fileUrl?: string
}

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'Decision / Resolution', label: 'Decision / Resolution' },
  { value: 'Filed Complaint', label: 'Filed Complaint' },
  { value: 'Answer Received', label: 'Answer Received' },
  { value: 'Reply Filed', label: 'Reply Filed' },
  { value: 'Pre-Trial', label: 'Pre-Trial' },
  { value: 'Motion', label: 'Motion' },
  { value: 'Order', label: 'Order' },
  { value: 'Other', label: 'Other' }
]

export function Documents() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const devEntries = useLcmsStore((s) => s.caseDevEntries)
  const decisions = useLcmsStore((s) => s.caseDecisions)
  const cases = useLcmsStore((s) => s.cases)
  const lcmsLoading = useLcmsStore((s) => s.loading)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const rows: DocumentRow[] = useMemo(() => {
    const list: DocumentRow[] = []
    for (const e of devEntries) {
      const caseData = cases.find((c) => c.id === e.caseId)
      list.push({
        id: `doc-${e.id}`,
        date: e.date,
        documentType: e.documentType,
        description: e.description,
        caseTitle: caseData?.caseTitle ?? '-',
        clientId: caseData?.clientId ?? '',
        caseId: e.caseId,
        hasFile: !!e.fileRef,
        fileUrl: e.fileRef?.url
      })
    }
    for (const d of decisions) {
      const caseData = cases.find((c) => c.id === d.caseId)
      list.push({
        id: `decision-${d.id}`,
        date: d.dateOfPromulgation,
        documentType: 'Decision / Resolution',
        description: d.action,
        caseTitle: caseData?.caseTitle ?? '-',
        clientId: caseData?.clientId ?? '',
        caseId: d.caseId,
        hasFile: !!d.fileRef,
        fileUrl: d.fileRef?.url
      })
    }
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [devEntries, decisions, cases])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (typeFilter && r.documentType !== typeFilter) return false
      if (!q) return true
      return (
        r.documentType.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.caseTitle.toLowerCase().includes(q)
      )
    })
  }, [rows, search, typeFilter])

  const columns: Column<DocumentRow>[] = [
    { key: 'date', header: t('caseDevelopment.date'), render: (row) => formatDate(row.date) },
    { key: 'documentType', header: t('caseDevelopment.documentType') },
    { key: 'description', header: t('caseDevelopment.description') },
    { key: 'caseTitle', header: t('hearings.case') }
  ]
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)

  return (
    <motion.div
      key="documents"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      <PageHeader
        icon={<FileText size={20} />}
        title={t('globalDocuments.title')}
        subtitle={t('globalDocuments.subtitle')}
      />

      <TableToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder={t('globalDocuments.searchPlaceholder')}
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={
          <ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
        }
      />

      <Card padding="0">
        <DataTable
          columns={columns}
          data={filteredRows}
          hiddenColumns={hiddenColumns}
          loading={lcmsLoading}
          emptyMessage={t('lcms.noRecords')}
          onRowClick={(row) =>
            row.clientId && navigate(`/clients/${row.clientId}/cases/${row.caseId}`)
          }
        />
      </Card>
    </motion.div>
  )
}
