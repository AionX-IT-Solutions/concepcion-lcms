import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Users } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { DataTable, type Column, useColumnVisibility, ColumnsButton } from '../components/ui/DataTable'
import { TableToolbar } from '../components/ui/TableToolbar'
import { ClientFormModal } from '../components/lcms/ClientFormModal'
import { useLcmsStore } from '../store/lcms.store'
import { getFullName } from '../lib/utils'
import type { Client } from '../types/lcms.types'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface ClientRow extends Client {
  fullName: string
}

export function Clients() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clients = useLcmsStore((s) => s.clients)
  const lcmsLoading = useLcmsStore((s) => s.loading)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const rows: ClientRow[] = useMemo(
    () =>
      clients.map((c) => ({
        ...c,
        fullName: getFullName(c.firstName, c.middleName ?? '', c.lastName)
      })),
    [clients]
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.emailAddress.toLowerCase().includes(q) ||
        r.contactNumber.toLowerCase().includes(q)
    )
  }, [rows, search])

  const columns: Column<ClientRow>[] = [
    { key: 'fullName', header: t('clients.name') },
    { key: 'contactNumber', header: t('clients.contactNumber') },
    { key: 'emailAddress', header: t('clients.emailAddress') }
  ]
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)

  return (
    <motion.div
      key="clients"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      <PageHeader
        icon={<Users size={20} />}
        title={t('clients.title')}
        subtitle={t('clients.subtitle')}
        actions={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={14} />
            {t('clients.addClient')}
          </button>
        }
      />

      <TableToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder={t('clients.searchPlaceholder')}
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
      />

      <Card padding="0">
        <DataTable
          columns={columns}
          data={filteredRows}
          hiddenColumns={hiddenColumns}
          loading={lcmsLoading}
          emptyMessage={t('clients.noClients')}
          onRowClick={(row) => navigate(`/clients/${row.id}`)}
        />
      </Card>

      <ClientFormModal open={addOpen} onOpenChange={setAddOpen} />
    </motion.div>
  )
}
