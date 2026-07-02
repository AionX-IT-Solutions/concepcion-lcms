import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Microscope, Plus, Pencil, Trash2 } from 'lucide-react'
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

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface Evidence {
  id: string
  caseTitle: string
  itemDescription: string
  type: string
  collectedDate: string
  custodian: string
  status: 'Preserved' | 'Submitted' | 'Returned' | 'Destroyed'
}

const EVIDENCE_TYPES = ['Physical', 'Documentary', 'Testimonial', 'Digital', 'Real', 'Other']
const STATUS_OPTIONS = ['Preserved', 'Submitted', 'Returned', 'Destroyed']

const schema = z.object({
  caseTitle: z.string().min(1, 'Required'),
  itemDescription: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  collectedDate: z.string().min(1, 'Required'),
  custodian: z.string().min(1, 'Required'),
  status: z.enum(['Preserved', 'Submitted', 'Returned', 'Destroyed'])
})
type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = { caseTitle: '', itemDescription: '', type: 'Physical', collectedDate: '', custodian: '', status: 'Preserved' }

const statusVariant: Record<Evidence['status'], 'success' | 'warning' | 'danger' | 'default'> = {
  Preserved: 'success', Submitted: 'primary' as 'default', Returned: 'warning', Destroyed: 'danger'
}

function EvidenceModal({
  open,
  onOpenChange,
  evidence,
  onCreate,
  onUpdate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  evidence?: Evidence
  onCreate: (data: Omit<Evidence, 'id'>) => Promise<string>
  onUpdate: (id: string, patch: Partial<Omit<Evidence, 'id'>>) => Promise<void>
}) {
  const toast = useToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      evidence
        ? {
            caseTitle: evidence.caseTitle,
            itemDescription: evidence.itemDescription,
            type: evidence.type,
            collectedDate: evidence.collectedDate,
            custodian: evidence.custodian,
            status: evidence.status
          }
        : emptyValues
    )
  }, [open, evidence, reset])

  const onSubmit = async (data: FormValues) => {
    try {
      if (evidence) {
        await onUpdate(evidence.id, data)
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
    <Modal open={open} onOpenChange={onOpenChange} title={evidence ? 'Edit Evidence Item' : 'Add Evidence Item'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Case Title" required error={errors.caseTitle?.message}><FieldInput {...register('caseTitle')} error={!!errors.caseTitle} /></FormField>
        <FormField label="Item Description" required error={errors.itemDescription?.message}><FieldInput {...register('itemDescription')} error={!!errors.itemDescription} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Type" required><FieldSelect {...register('type')} options={EVIDENCE_TYPES.map(t => ({ value: t, label: t }))} /></FormField>
          <FormField label="Collected Date" required error={errors.collectedDate?.message}><FieldInput type="date" {...register('collectedDate')} error={!!errors.collectedDate} /></FormField>
        </div>
        <FormField label="Custodian" required error={errors.custodian?.message}><FieldInput {...register('custodian')} error={!!errors.custodian} /></FormField>
        <FormField label="Status" required><FieldSelect {...register('status')} options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))} /></FormField>
      </form>
    </Modal>
  )
}

export function EvidenceManagement() {
  const toast = useToast()
  const { items, loading, create, update, remove } = useFirestoreResource<Evidence>('evidenceItems')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Evidence | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Evidence | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = items.filter(r => {
    if (typeFilter && r.type !== typeFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return r.itemDescription.toLowerCase().includes(q) || r.caseTitle.toLowerCase().includes(q)
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

  const columns: Column<Evidence>[] = [
    { key: 'caseTitle', header: 'Case' },
    { key: 'itemDescription', header: 'Item Description' },
    { key: 'type', header: 'Type' },
    { key: 'collectedDate', header: 'Collected Date' },
    { key: 'custodian', header: 'Custodian' },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge> },
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
    <motion.div key="evidence" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<Microscope size={20} />} title="Evidence Management" subtitle="Track exhibits, chain of custody, and evidence files per case."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Evidence</button>} />

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search evidence..."
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={<ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={[{ value: '', label: 'All Types' }, ...EVIDENCE_TYPES.map(t => ({ value: t, label: t }))]} />} />

      <Card padding="0">
        <DataTable columns={columns} data={filtered} hiddenColumns={hiddenColumns} loading={loading} emptyMessage="No evidence records yet." />
      </Card>

      <EvidenceModal open={addOpen} onOpenChange={setAddOpen} onCreate={create} onUpdate={update} />
      <EvidenceModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        evidence={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Evidence"
        message={deleteTarget ? `Delete "${deleteTarget.itemDescription}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  )
}
