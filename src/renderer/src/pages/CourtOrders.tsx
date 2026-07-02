import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Gavel, Plus, Pencil, Trash2 } from 'lucide-react'
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

interface CourtOrder {
  id: string
  orderNumber: string
  caseTitle: string
  issuedBy: string
  type: string
  dateIssued: string
  compliance: string
  status: 'Pending Compliance' | 'Complied' | 'Appealed' | 'Vacated'
}

const ORDER_TYPES = ['Resolution', 'Order', 'Decision', 'Writ of Execution', 'Temporary Restraining Order', 'Injunction', 'Subpoena', 'Other']
const STATUS_OPTS = ['Pending Compliance', 'Complied', 'Appealed', 'Vacated']

const schema = z.object({
  orderNumber: z.string().min(1, 'Required'),
  caseTitle: z.string().min(1, 'Required'),
  issuedBy: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  dateIssued: z.string().min(1, 'Required'),
  compliance: z.string().min(1, 'Required'),
  status: z.enum(['Pending Compliance', 'Complied', 'Appealed', 'Vacated'])
})
type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  orderNumber: '', caseTitle: '', issuedBy: '', type: 'Resolution', dateIssued: '', compliance: '', status: 'Pending Compliance'
}

const statusVariant: Record<CourtOrder['status'], 'warning' | 'success' | 'danger' | 'default'> = {
  'Pending Compliance': 'warning', Complied: 'success', Appealed: 'danger', Vacated: 'default'
}

function CourtOrderModal({
  open,
  onOpenChange,
  order,
  onCreate,
  onUpdate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: CourtOrder
  onCreate: (data: Omit<CourtOrder, 'id'>) => Promise<string>
  onUpdate: (id: string, patch: Partial<Omit<CourtOrder, 'id'>>) => Promise<void>
}) {
  const toast = useToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      order
        ? {
            orderNumber: order.orderNumber,
            caseTitle: order.caseTitle,
            issuedBy: order.issuedBy,
            type: order.type,
            dateIssued: order.dateIssued,
            compliance: order.compliance,
            status: order.status
          }
        : emptyValues
    )
  }, [open, order, reset])

  const onSubmit = async (data: FormValues) => {
    try {
      if (order) {
        await onUpdate(order.id, data)
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
    <Modal open={open} onOpenChange={onOpenChange} title={order ? 'Edit Court Order' : 'Add Court Order'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Order Number" required error={errors.orderNumber?.message}><FieldInput {...register('orderNumber')} error={!!errors.orderNumber} /></FormField>
          <FormField label="Type" required><FieldSelect {...register('type')} options={ORDER_TYPES.map(t => ({ value: t, label: t }))} /></FormField>
        </div>
        <FormField label="Case Title" required error={errors.caseTitle?.message}><FieldInput {...register('caseTitle')} error={!!errors.caseTitle} /></FormField>
        <FormField label="Issued By (Judge)" required error={errors.issuedBy?.message}><FieldInput {...register('issuedBy')} error={!!errors.issuedBy} /></FormField>
        <FormField label="Date Issued" required error={errors.dateIssued?.message}><FieldInput type="date" {...register('dateIssued')} error={!!errors.dateIssued} /></FormField>
        <FormField label="Compliance Required" required error={errors.compliance?.message}><FieldInput {...register('compliance')} error={!!errors.compliance} /></FormField>
        <FormField label="Status" required><FieldSelect {...register('status')} options={STATUS_OPTS.map(s => ({ value: s, label: s }))} /></FormField>
      </form>
    </Modal>
  )
}

export function CourtOrders() {
  const toast = useToast()
  const { items, loading, create, update, remove } = useFirestoreResource<CourtOrder>('courtOrders')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<CourtOrder | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<CourtOrder | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = items.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    return !q || r.orderNumber.toLowerCase().includes(q) || r.caseTitle.toLowerCase().includes(q)
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

  const columns: Column<CourtOrder>[] = [
    { key: 'orderNumber', header: 'Order #' },
    { key: 'caseTitle', header: 'Case' },
    { key: 'type', header: 'Type' },
    { key: 'issuedBy', header: 'Issued By' },
    { key: 'dateIssued', header: 'Date Issued', render: r => formatDate(r.dateIssued) },
    { key: 'compliance', header: 'Compliance Required' },
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
    <motion.div key="court-orders" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<Gavel size={20} />} title="Court Orders" subtitle="Track resolutions, orders, and decisions from courts."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Order</button>} />

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search orders..." total={filtered.length}
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={<ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))]} />} />

      <Card padding="0">
        <DataTable columns={columns} data={filtered} hiddenColumns={hiddenColumns} loading={loading} emptyMessage="No court orders yet." />
      </Card>

      <CourtOrderModal open={addOpen} onOpenChange={setAddOpen} onCreate={create} onUpdate={update} />
      <CourtOrderModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        order={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Court Order"
        message={deleteTarget ? `Delete "${deleteTarget.orderNumber}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  )
}
