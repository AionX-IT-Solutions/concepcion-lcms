import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpen, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormField, FieldInput, FieldSelect, FieldTextArea } from '../components/ui/FormField'
import { DataTable, type Column, useColumnVisibility, ColumnsButton } from '../components/ui/DataTable'
import { TableToolbar, ToolbarSelect } from '../components/ui/TableToolbar'
import { useFirestoreResource } from '../lib/useFirestoreResource'
import { useToast } from '../hooks/useToast'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface ResearchItem {
  id: string
  title: string
  type: 'Jurisprudence' | 'Statute' | 'Regulation' | 'Article' | 'Other'
  citation: string
  notes: string
  url?: string
  savedDate: string
}

const RESEARCH_TYPES = ['Jurisprudence', 'Statute', 'Regulation', 'Article', 'Other']

const schema = z.object({
  title: z.string().min(1, 'Required'),
  type: z.enum(['Jurisprudence', 'Statute', 'Regulation', 'Article', 'Other']),
  citation: z.string().min(1, 'Required'),
  notes: z.string().optional(),
  url: z.string().optional()
})
type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = { title: '', type: 'Jurisprudence', citation: '', notes: '', url: '' }

const typeVariant: Record<ResearchItem['type'], 'primary' | 'success' | 'warning' | 'cyan' | 'default'> = {
  Jurisprudence: 'primary', Statute: 'success', Regulation: 'warning', Article: 'cyan', Other: 'default'
}

function ResearchModal({
  open,
  onOpenChange,
  item,
  onCreate,
  onUpdate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ResearchItem
  onCreate: (data: Omit<ResearchItem, 'id'>) => Promise<string>
  onUpdate: (id: string, patch: Partial<Omit<ResearchItem, 'id'>>) => Promise<void>
}) {
  const toast = useToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      item
        ? { title: item.title, type: item.type, citation: item.citation, notes: item.notes, url: item.url ?? '' }
        : emptyValues
    )
  }, [open, item, reset])

  const onSubmit = async (data: FormValues) => {
    const payload = { ...data, notes: data.notes ?? '' }
    try {
      if (item) {
        await onUpdate(item.id, payload)
      } else {
        await onCreate({ ...payload, savedDate: new Date().toISOString().slice(0, 10) })
      }
      toast.success('Saved successfully')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={item ? 'Edit Research Item' : 'Add Research Item'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Title" required error={errors.title?.message}><FieldInput {...register('title')} error={!!errors.title} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Type" required><FieldSelect {...register('type')} options={RESEARCH_TYPES.map(t => ({ value: t, label: t }))} /></FormField>
          <FormField label="Citation" required error={errors.citation?.message}><FieldInput {...register('citation')} error={!!errors.citation} /></FormField>
        </div>
        <FormField label="Notes"><FieldTextArea {...register('notes')} rows={3} /></FormField>
        <FormField label="URL / Link"><FieldInput {...register('url')} placeholder="https://..." /></FormField>
      </form>
    </Modal>
  )
}

export function LegalResearch() {
  const toast = useToast()
  const { items, loading, create, update, remove } = useFirestoreResource<ResearchItem>('legalResearch')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<ResearchItem | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<ResearchItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = items.filter(r => {
    if (typeFilter && r.type !== typeFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return r.title.toLowerCase().includes(q) || r.citation.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q)
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

  const columns: Column<ResearchItem>[] = [
    { key: 'title', header: 'Title' },
    { key: 'type', header: 'Type', render: (r) => <Badge variant={typeVariant[r.type]}>{r.type}</Badge> },
    { key: 'citation', header: 'Citation' },
    { key: 'notes', header: 'Notes' },
    { key: 'url', header: 'Link', sortable: false, render: (r) => r.url ? <button onClick={() => window.open(r.url, '_blank')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><ExternalLink size={12} /> Open</button> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'savedDate', header: 'Saved' },
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
    <motion.div key="legal-research" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<BookOpen size={20} />} title="Legal Research" subtitle="Save jurisprudence, statutes, and research notes for quick reference."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Research</button>} />

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search research..."
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={<ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={[{ value: '', label: 'All Types' }, ...RESEARCH_TYPES.map(t => ({ value: t, label: t }))]} />} />

      <Card padding="0">
        <DataTable columns={columns} data={filtered} hiddenColumns={hiddenColumns} loading={loading} emptyMessage="No research items yet." />
      </Card>

      <ResearchModal open={addOpen} onOpenChange={setAddOpen} onCreate={create} onUpdate={update} />
      <ResearchModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        item={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Research Item"
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
