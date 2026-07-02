import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ScrollText, Plus, Pencil, Trash2 } from 'lucide-react'
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

interface Pleading {
  id: string
  title: string
  type: string
  caseTitle: string
  dateFiled: string
  filedBy: string
  status: 'Draft' | 'Filed' | 'Admitted' | 'Denied'
}

const TYPES = ['Complaint', 'Answer', 'Reply', 'Rejoinder', 'Pre-Trial Brief', 'Position Paper', 'Memorandum', 'Other']
const STATUS_OPTS = ['Draft', 'Filed', 'Admitted', 'Denied']

const schema = z.object({
  title: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  caseTitle: z.string().min(1, 'Required'),
  dateFiled: z.string().min(1, 'Required'),
  filedBy: z.string().min(1, 'Required'),
  status: z.enum(['Draft', 'Filed', 'Admitted', 'Denied'])
})
type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = { title: '', type: 'Complaint', caseTitle: '', dateFiled: '', filedBy: '', status: 'Draft' }

const statusVariant: Record<Pleading['status'], 'default' | 'warning' | 'success' | 'danger'> = {
  Draft: 'default', Filed: 'warning', Admitted: 'success', Denied: 'danger'
}

function PleadingModal({
  open,
  onOpenChange,
  pleading,
  onCreate,
  onUpdate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pleading?: Pleading
  onCreate: (data: Omit<Pleading, 'id'>) => Promise<string>
  onUpdate: (id: string, patch: Partial<Omit<Pleading, 'id'>>) => Promise<void>
}) {
  const toast = useToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      pleading
        ? {
            title: pleading.title,
            type: pleading.type,
            caseTitle: pleading.caseTitle,
            dateFiled: pleading.dateFiled,
            filedBy: pleading.filedBy,
            status: pleading.status
          }
        : emptyValues
    )
  }, [open, pleading, reset])

  const onSubmit = async (data: FormValues) => {
    try {
      if (pleading) {
        await onUpdate(pleading.id, data)
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
    <Modal open={open} onOpenChange={onOpenChange} title={pleading ? 'Edit Pleading' : 'Add Pleading'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Title" required error={errors.title?.message}><FieldInput {...register('title')} error={!!errors.title} /></FormField>
        <FormField label="Type" required><FieldSelect {...register('type')} options={TYPES.map(t => ({ value: t, label: t }))} /></FormField>
        <FormField label="Case Title" required error={errors.caseTitle?.message}><FieldInput {...register('caseTitle')} error={!!errors.caseTitle} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Date Filed" required error={errors.dateFiled?.message}><FieldInput type="date" {...register('dateFiled')} error={!!errors.dateFiled} /></FormField>
          <FormField label="Filed By" required error={errors.filedBy?.message}><FieldInput {...register('filedBy')} error={!!errors.filedBy} /></FormField>
        </div>
        <FormField label="Status" required><FieldSelect {...register('status')} options={STATUS_OPTS.map(s => ({ value: s, label: s }))} /></FormField>
      </form>
    </Modal>
  )
}

export function Pleadings() {
  const toast = useToast()
  const { items, loading, create, update, remove } = useFirestoreResource<Pleading>('pleadings')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Pleading | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Pleading | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = items.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    return !q || r.title.toLowerCase().includes(q) || r.caseTitle.toLowerCase().includes(q)
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

  const columns: Column<Pleading>[] = [
    { key: 'title', header: 'Title' },
    { key: 'type', header: 'Type' },
    { key: 'caseTitle', header: 'Case' },
    { key: 'dateFiled', header: 'Date Filed', render: r => formatDate(r.dateFiled) },
    { key: 'filedBy', header: 'Filed By' },
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
    <motion.div key="pleadings" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<ScrollText size={20} />} title="Pleadings" subtitle="Draft and track pleadings filed per case."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Pleading</button>} />

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search pleadings..." total={filtered.length}
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={<ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))]} />} />

      <Card padding="0">
        <DataTable columns={columns} data={filtered} hiddenColumns={hiddenColumns} loading={loading} emptyMessage="No pleadings yet." />
      </Card>

      <PleadingModal open={addOpen} onOpenChange={setAddOpen} onCreate={create} onUpdate={update} />
      <PleadingModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        pleading={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Pleading"
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
