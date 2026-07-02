import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Scale, Plus, Pencil, Trash2 } from 'lucide-react'
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

interface Lawyer {
  id: string
  name: string
  rollNumber: string
  specialization: string
  email: string
  mobile: string
  branch: string
  dateAdmitted: string
  status: 'Active' | 'On Leave' | 'Inactive'
}

const SPECIALIZATIONS = ['Criminal Law', 'Civil Law', 'Labor Law', 'Corporate Law', 'Family Law', 'Administrative Law', 'General Practice']
const STATUS_OPTS = ['Active', 'On Leave', 'Inactive']

const schema = z.object({
  name: z.string().min(1, 'Required'),
  rollNumber: z.string().min(1, 'Required'),
  specialization: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  mobile: z.string().min(11, 'Enter valid PH mobile'),
  branch: z.string().min(1, 'Required'),
  dateAdmitted: z.string().min(1, 'Required'),
  status: z.enum(['Active', 'On Leave', 'Inactive'])
})
type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  name: '', rollNumber: '', specialization: 'General Practice', email: '', mobile: '', branch: '', dateAdmitted: '', status: 'Active'
}

const statusVariant: Record<Lawyer['status'], 'success' | 'warning' | 'default'> = {
  Active: 'success', 'On Leave': 'warning', Inactive: 'default'
}

function LawyerModal({
  open,
  onOpenChange,
  lawyer,
  onCreate,
  onUpdate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lawyer?: Lawyer
  onCreate: (data: Omit<Lawyer, 'id'>) => Promise<string>
  onUpdate: (id: string, patch: Partial<Omit<Lawyer, 'id'>>) => Promise<void>
}) {
  const toast = useToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      lawyer
        ? {
            name: lawyer.name,
            rollNumber: lawyer.rollNumber,
            specialization: lawyer.specialization,
            email: lawyer.email,
            mobile: lawyer.mobile,
            branch: lawyer.branch,
            dateAdmitted: lawyer.dateAdmitted,
            status: lawyer.status
          }
        : emptyValues
    )
  }, [open, lawyer, reset])

  const onSubmit = async (data: FormValues) => {
    try {
      if (lawyer) {
        await onUpdate(lawyer.id, data)
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
    <Modal open={open} onOpenChange={onOpenChange} title={lawyer ? 'Edit Lawyer' : 'Add Lawyer'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Full Name" required error={errors.name?.message}><FieldInput placeholder="Atty. Juan dela Cruz" {...register('name')} error={!!errors.name} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="IBP Roll Number" required error={errors.rollNumber?.message}><FieldInput {...register('rollNumber')} error={!!errors.rollNumber} /></FormField>
          <FormField label="Specialization" required><FieldSelect {...register('specialization')} options={SPECIALIZATIONS.map(s => ({ value: s, label: s }))} /></FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Email" required error={errors.email?.message}><FieldInput type="email" {...register('email')} error={!!errors.email} /></FormField>
          <FormField label="Mobile" required error={errors.mobile?.message}><FieldInput placeholder="09XXXXXXXXX" {...register('mobile')} error={!!errors.mobile} /></FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Branch" required error={errors.branch?.message}><FieldInput {...register('branch')} error={!!errors.branch} /></FormField>
          <FormField label="Date Admitted to Bar" required error={errors.dateAdmitted?.message}><FieldInput type="date" {...register('dateAdmitted')} error={!!errors.dateAdmitted} /></FormField>
        </div>
        <FormField label="Status" required><FieldSelect {...register('status')} options={STATUS_OPTS.map(s => ({ value: s, label: s }))} /></FormField>
      </form>
    </Modal>
  )
}

export function Lawyers() {
  const toast = useToast()
  const { items, loading, create, update, remove } = useFirestoreResource<Lawyer>('lawyers')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Lawyer | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Lawyer | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = items.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    return !q || r.name.toLowerCase().includes(q) || r.specialization.toLowerCase().includes(q) || r.branch.toLowerCase().includes(q)
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

  const columns: Column<Lawyer>[] = [
    { key: 'name', header: 'Name', render: r => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'rollNumber', header: 'Roll No.' },
    { key: 'specialization', header: 'Specialization' },
    { key: 'email', header: 'Email' },
    { key: 'mobile', header: 'Mobile' },
    { key: 'branch', header: 'Branch' },
    { key: 'dateAdmitted', header: 'Date Admitted', render: r => formatDate(r.dateAdmitted) },
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
    <motion.div key="lawyers" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<Scale size={20} />} title="Lawyers" subtitle="Manage attorney profiles and practice specializations."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Lawyer</button>} />

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search lawyers..." total={filtered.length}
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={<ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))]} />} />

      <Card padding="0">
        <DataTable columns={columns} data={filtered} hiddenColumns={hiddenColumns} loading={loading} emptyMessage="No lawyers yet." />
      </Card>

      <LawyerModal open={addOpen} onOpenChange={setAddOpen} onCreate={create} onUpdate={update} />
      <LawyerModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        lawyer={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Lawyer"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  )
}
