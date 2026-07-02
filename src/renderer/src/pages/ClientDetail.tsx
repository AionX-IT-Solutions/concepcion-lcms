import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2, User } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Tabs } from '../components/lcms/Tabs'
import { ClientFormModal } from '../components/lcms/ClientFormModal'
import { CaseFormModal } from '../components/lcms/CaseFormModal'
import { useLcmsStore } from '../store/lcms.store'
import { useToast } from '../hooks/useToast'
import { formatDate, getFullName } from '../lib/utils'
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

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 4
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{value || '-'}</p>
    </div>
  )
}

export function ClientDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { clientId } = useParams<{ clientId: string }>()
  const client = useLcmsStore((s) => s.clients.find((c) => c.id === clientId))
  const allCases = useLcmsStore((s) => s.cases)
  const lcmsLoading = useLcmsStore((s) => s.loading)
  const deleteClient = useLcmsStore((s) => s.deleteClient)
  const cases = useMemo(() => allCases.filter((c) => c.clientId === clientId), [allCases, clientId])
  const [tab, setTab] = useState<'profile' | 'cases'>('profile')
  const [editOpen, setEditOpen] = useState(false)
  const [addCaseOpen, setAddCaseOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const onDeleteClient = async () => {
    if (!client) return
    setDeleting(true)
    try {
      await deleteClient(client.id)
      toast.success(t('lcms.saved'))
      navigate('/clients')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
      setDeleting(false)
    }
  }

  const columns: Column<Case>[] = useMemo(
    () => [
      { key: 'caseNumber', header: t('cases.caseNumber') },
      { key: 'caseTitle', header: t('cases.caseTitle') },
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
    ],
    [t]
  )

  if (!client) {
    return (
      <motion.div
        className="page-wrapper"
        initial="initial"
        animate="animate"
        variants={pageVariants}
      >
        {lcmsLoading ? (
          <Card loading skeletonRows={4} />
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>{t('clients.noClients')}</p>
        )}
      </motion.div>
    )
  }

  const fullName = getFullName(client.firstName, client.middleName ?? '', client.lastName)

  return (
    <motion.div
      key="client-detail"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      <PageHeader
        icon={<User size={20} />}
        title={fullName}
        subtitle={client.contactNumber}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setEditOpen(true)}>
              <Pencil size={14} />
              {t('lcms.edit')}
            </button>
            <button className="btn-danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} />
              {t('lcms.delete')}
            </button>
          </>
        }
      />

      <Tabs
        tabs={[
          { id: 'profile', label: t('clients.profile') },
          { id: 'cases', label: t('clients.cases') }
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as 'profile' | 'cases')}
      />

      {tab === 'profile' && (
        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 18
            }}
          >
            <ProfileField label={t('clients.lastName')} value={client.lastName} />
            <ProfileField label={t('clients.firstName')} value={client.firstName} />
            <ProfileField label={t('clients.middleName')} value={client.middleName ?? ''} />
            <ProfileField label={t('clients.dateOfBirth')} value={formatDate(client.dateOfBirth)} />
            <ProfileField label={t('clients.civilStatus')} value={client.civilStatus} />
            {client.civilStatus === 'Married' && (
              <ProfileField label={t('clients.spouseName')} value={client.spouseName ?? ''} />
            )}
            <ProfileField label={t('clients.occupation')} value={client.occupation} />
            <ProfileField label={t('clients.contactNumber')} value={client.contactNumber} />
            <ProfileField label={t('clients.emailAddress')} value={client.emailAddress} />
            <ProfileField label={t('clients.validIdType')} value={client.validIdType} />
            <ProfileField label={t('clients.completeAddress')} value={client.completeAddress} />
          </div>
        </Card>
      )}

      {tab === 'cases' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setAddCaseOpen(true)}>
              <Plus size={14} />
              {t('cases.addCase')}
            </button>
          </div>
          <Card padding="0">
            <DataTable
              columns={columns}
              data={cases}
              emptyMessage={t('cases.noCases')}
              onRowClick={(row) => navigate(`/clients/${client.id}/cases/${row.id}`)}
            />
          </Card>
        </>
      )}

      <ClientFormModal open={editOpen} onOpenChange={setEditOpen} client={client} />
      <CaseFormModal open={addCaseOpen} onOpenChange={setAddCaseOpen} clientId={client.id} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Client"
        message={`Delete ${fullName}? This also deletes all ${cases.length} case(s) under this client, along with their hearings, tasks, billing, payments, decisions, and documents. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDeleteClient}
        onCancel={() => setDeleteOpen(false)}
      />
    </motion.div>
  )
}
