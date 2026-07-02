import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react'
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

interface Affidavit {
  id: string
  title: string
  affiant: string
  caseTitle: string
  dateDrafted: string
  dateNotarized: string
  type: string
  status: 'Draft' | 'Notarized' | 'Filed'
}

const TYPES = ['Complaint-Affidavit', 'Counter-Affidavit', 'Judicial Affidavit', 'Affidavit of Desistance', 'Affidavit of Witnesses', 'Other']
const STATUS_OPTS = ['Draft', 'Notarized', 'Filed']

const schema = z.object({
  title: z.string().min(1, 'Required'),
  affiant: z.string().min(1, 'Required'),
  caseTitle: z.string().min(1, 'Required'),
  dateDrafted: z.string().min(1, 'Required'),
  dateNotarized: z.string().optional(),
  type: z.string().min(1, 'Required'),
  status: z.enum(['Draft', 'Notarized', 'Filed'])
})
type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  title: '', affiant: '', caseTitle: '', dateDrafted: '', dateNotarized: '', type: 'Complaint-Affidavit', status: 'Draft'
}

const statusVariant: Record<Affidavit['status'], 'default' | 'warning' | 'success'> = {
  Draft: 'default', Notarized: 'warning', Filed: 'success'
}

function AffidavitModal({
  open,
  onOpenChange,
  affidavit,
  onCreate,
  onUpdate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  affidavit?: Affidavit
  onCreate: (data: Omit<Affidavit, 'id'>) => Promise<string>
  onUpdate: (id: string, patch: Partial<Omit<Affidavit, 'id'>>) => Promise<void>
}) {
  const toast = useToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      affidavit
        ? {
            title: affidavit.title,
            affiant: affidavit.affiant,
            caseTitle: affidavit.caseTitle,
            dateDrafted: affidavit.dateDrafted,
            dateNotarized: affidavit.dateNotarized,
            type: affidavit.type,
            status: affidavit.status
          }
        : emptyValues
    )
  }, [open, affidavit, reset])

  const onSubmit = async (data: FormValues) => {
    const payload = { ...data, dateNotarized: data.dateNotarized ?? '' }
    try {
      if (affidavit) {
        await onUpdate(affidavit.id, payload)
      } else {
        await onCreate(payload)
      }
      toast.success('Saved successfully')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={affidavit ? 'Edit Affidavit' : 'Add Affidavit'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Title" required error={errors.title?.message}><FieldInput {...register('title')} error={!!errors.title} /></FormField>
        <FormField label="Affiant" required error={errors.affiant?.message}><FieldInput {...register('affiant')} error={!!errors.affiant} /></FormField>
        <FormField label="Case Title" required error={errors.caseTitle?.message}><FieldInput {...register('caseTitle')} error={!!errors.caseTitle} /></FormField>
        <FormField label="Type" required><FieldSelect {...register('type')} options={TYPES.map(t => ({ value: t, label: t }))} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Date Drafted" required error={errors.dateDrafted?.message}><FieldInput type="date" {...register('dateDrafted')} error={!!errors.dateDrafted} /></FormField>
          <FormField label="Date Notarized"><FieldInput type="date" {...register('dateNotarized')} /></FormField>
        </div>
        <FormField label="Status" required><FieldSelect {...register('status')} options={STATUS_OPTS.map(s => ({ value: s, label: s }))} /></FormField>
      </form>
    </Modal>
  )
}

export function Affidavits() {
  const toast = useToast()
  const { items, loading, create, update, remove } = useFirestoreResource<Affidavit>('affidavits')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Affidavit | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Affidavit | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = items.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    return !q || r.title.toLowerCase().includes(q) || r.affiant.toLowerCase().includes(q) || r.caseTitle.toLowerCase().includes(q)
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

  const columns: Column<Affidavit>[] = [
    { key: 'title', header: 'Title' },
    { key: 'affiant', header: 'Affiant' },
    { key: 'caseTitle', header: 'Case' },
    { key: 'type', header: 'Type' },
    { key: 'dateDrafted', header: 'Date Drafted', render: r => formatDate(r.dateDrafted) },
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
    <motion.div key="affidavits" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<FileText size={20} />} title="Affidavits" subtitle="Draft and track affidavits per case."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Affidavit</button>} />

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search affidavits..." total={filtered.length}
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={<ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))]} />} />

      <Card padding="0">
        <DataTable columns={columns} data={filtered} hiddenColumns={hiddenColumns} loading={loading} emptyMessage="No affidavits yet." />
      </Card>

      <AffidavitModal open={addOpen} onOpenChange={setAddOpen} onCreate={create} onUpdate={update} />
      <AffidavitModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        affidavit={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Affidavit"
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
