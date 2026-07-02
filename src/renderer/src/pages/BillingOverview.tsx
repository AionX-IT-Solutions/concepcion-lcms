import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Wallet } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column, useColumnVisibility, ColumnsButton } from '../components/ui/DataTable'
import { TableToolbar, ToolbarSelect } from '../components/ui/TableToolbar'
import { useLcmsStore } from '../store/lcms.store'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface BillingRow {
  id: string
  clientId: string
  caseTitle: string
  caseNumber: string
  agreedTotal: number
  totalPaid: number
  balance: number
  status: 'Paid' | 'Partial' | 'Unpaid'
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Unpaid', label: 'Unpaid' }
]

export function BillingOverview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const cases = useLcmsStore((s) => s.cases)
  const billingFees = useLcmsStore((s) => s.billingFees)
  const payments = useLcmsStore((s) => s.payments)
  const lcmsLoading = useLcmsStore((s) => s.loading)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const rows: BillingRow[] = useMemo(
    () =>
      cases.map((c) => {
        const fees = billingFees.find((b) => b.caseId === c.id)
        const agreedTotal = fees
          ? fees.acceptanceFee + fees.perAppearanceFee + fees.depositForCost + fees.successFee
          : 0
        const totalPaid = payments
          .filter((p) => p.caseId === c.id)
          .reduce((sum, p) => sum + p.amount, 0)
        const balance = Math.max(0, agreedTotal - totalPaid)
        const status: BillingRow['status'] =
          agreedTotal === 0 ? 'Unpaid' : balance === 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid'
        return { id: c.id, clientId: c.clientId, caseTitle: c.caseTitle, caseNumber: c.caseNumber, agreedTotal, totalPaid, balance, status }
      }),
    [cases, billingFees, payments]
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (!q) return true
      return r.caseTitle.toLowerCase().includes(q) || r.caseNumber.toLowerCase().includes(q)
    })
  }, [rows, search, statusFilter])

  const columns: Column<BillingRow>[] = [
    { key: 'caseNumber', header: t('cases.caseNumber') },
    { key: 'caseTitle', header: t('cases.caseTitle') },
    { key: 'agreedTotal', header: t('globalBilling.agreedTotal'), align: 'right', render: (row) => formatPeso(row.agreedTotal) },
    { key: 'totalPaid', header: t('globalBilling.totalPaid'), align: 'right', render: (row) => formatPeso(row.totalPaid) },
    {
      key: 'balance',
      header: t('globalBilling.balance'),
      align: 'right',
      render: (row) => <Badge variant={row.balance === 0 ? 'success' : 'warning'}>{formatPeso(row.balance)}</Badge>
    }
  ]
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)

  return (
    <motion.div
      key="billing-overview"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      <PageHeader
        icon={<Wallet size={20} />}
        title={t('globalBilling.title')}
        subtitle={t('globalBilling.subtitle')}
      />

      <TableToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by case title or number..."
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
          emptyMessage={t('cases.noCases')}
          onRowClick={(row) => navigate(`/clients/${row.clientId}/cases/${row.id}`)}
        />
      </Card>
    </motion.div>
  )
}
