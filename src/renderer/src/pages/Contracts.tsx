import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileSignature, Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormField, FieldInput, FieldSelect } from '../components/ui/FormField'
import { DataTable, type Column, useColumnVisibility, ColumnsButton } from '../components/ui/DataTable'
import { TableToolbar, ToolbarSelect } from '../components/ui/TableToolbar'
import { useFirestoreResource } from '../lib/useFirestoreResource'
import { useToast } from '../hooks/useToast'
import { formatDate } from '../lib/utils'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface Contract {
  id: string
  title: string
  parties: string
  type: string
  dateExecuted: string
  expiryDate: string
  status: 'Active' | 'Expired' | 'Pending' | 'Terminated'
}

const CONTRACT_TYPES = ['Retainer Agreement', 'Engagement Letter', 'Contingency Agreement', 'Settlement Agreement', 'Other']
const STATUS_OPTS = ['Active', 'Expired', 'Pending', 'Terminated']

const schema = z.object({
  title: z.string().min(1, 'Required'),
  parties: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  dateExecuted: z.string().min(1, 'Required'),
  expiryDate: z.string().min(1, 'Required'),
  status: z.enum(['Active', 'Expired', 'Pending', 'Terminated'])
})
type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  title: '',
  parties: '',
  type: 'Retainer Agreement',
  dateExecuted: '',
  expiryDate: '',
  status: 'Active'
}

const statusVariant: Record<Contract['status'], 'success' | 'warning' | 'default' | 'danger'> = {
  Active: 'success', Pending: 'warning', Expired: 'default', Terminated: 'danger'
}

function ContractModal({
  open,
  onOpenChange,
  contract,
  onCreate,
  onUpdate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract?: Contract
  onCreate: (data: Omit<Contract, 'id'>) => Promise<string>
  onUpdate: (id: string, patch: Partial<Omit<Contract, 'id'>>) => Promise<void>
}) {
  const toast = useToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      contract
        ? {
            title: contract.title,
            parties: contract.parties,
            type: contract.type,
            dateExecuted: contract.dateExecuted,
            expiryDate: contract.expiryDate,
            status: contract.status
          }
        : emptyValues
    )
  }, [open, contract, reset])

  const onSubmit = async (data: FormValues) => {
    try {
      if (contract) {
        await onUpdate(contract.id, data)
      } else {
        await onCreate(data)
      }
      toast.success('Saved successfully')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={contract ? 'Edit Contract' : 'Add Contract'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Title" required error={errors.title?.message}><FieldInput {...register('title')} error={!!errors.title} /></FormField>
        <FormField label="Parties" required error={errors.parties?.message}><FieldInput {...register('parties')} error={!!errors.parties} /></FormField>
        <FormField label="Type" required><FieldSelect {...register('type')} options={CONTRACT_TYPES.map(t => ({ value: t, label: t }))} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Date Executed" required error={errors.dateExecuted?.message}><FieldInput type="date" {...register('dateExecuted')} error={!!errors.dateExecuted} /></FormField>
          <FormField label="Expiry Date" required error={errors.expiryDate?.message}><FieldInput type="date" {...register('expiryDate')} error={!!errors.expiryDate} /></FormField>
        </div>
        <FormField label="Status" required><FieldSelect {...register('status')} options={STATUS_OPTS.map(s => ({ value: s, label: s }))} /></FormField>
      </form>
    </Modal>
  )
}

export function Contracts() {
  const toast = useToast()
  const { items, loading, create, update, remove } = useFirestoreResource<Contract>('contracts')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Contract | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = items.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    return !q || r.title.toLowerCase().includes(q) || r.parties.toLowerCase().includes(q)
  })

  const onDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Saved successfully')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Contract>[] = [
    { key: 'title', header: 'Title' },
    { key: 'parties', header: 'Parties' },
    { key: 'type', header: 'Type' },
    { key: 'dateExecuted', header: 'Date Executed', render: r => formatDate(r.dateExecuted) },
    { key: 'expiryDate', header: 'Expiry Date', render: r => formatDate(r.expiryDate) },
    { key: 'status', header: 'Status', render: r => <Badge variant={statusVariant[r.status]}>{r.status}</Badge> },
    {
      key: 'id',
      header: 'Actions',
      sortable: false,
      render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => setEditing(r)}>Edit</Button>
          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => setDeleteTarget(r)}>Delete</Button>
        </div>
      )
    }
  ]
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)

  return (
    <motion.div key="contracts" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<FileSignature size={20} />} title="Contracts" subtitle="Manage engagement letters and contract templates."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Contract</button>} />

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search contracts..."
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={<ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))]} />} />

      <Card padding="0">
        <DataTable columns={columns} data={filtered} hiddenColumns={hiddenColumns} loading={loading} emptyMessage="No contracts yet." />
      </Card>

      <ContractModal open={addOpen} onOpenChange={setAddOpen} onCreate={create} onUpdate={update} />
      <ContractModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        contract={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Contract"
        message={deleteTarget ? `Delete "${deleteTarget.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  )
}
