import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Plus, MapPin, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormField, FieldInput, FieldSelect } from '../components/ui/FormField'
import { DataTable, type Column, useColumnVisibility, ColumnsButton } from '../components/ui/DataTable'
import { TableToolbar } from '../components/ui/TableToolbar'
import { useFirestoreResource } from '../lib/useFirestoreResource'
import { useToast } from '../hooks/useToast'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface Branch {
  id: string
  name: string
  address: string
  city: string
  contactNumber: string
  email: string
  headLawyer: string
  status: 'Active' | 'Inactive'
}

interface BranchRow extends Branch {
  lawyerCount: number
}

interface LawyerRef {
  id: string
  branch: string
}

const STATUS_OPTS = ['Active', 'Inactive']

const schema = z.object({
  name: z.string().min(1, 'Required'),
  address: z.string().min(1, 'Required'),
  city: z.string().min(1, 'Required'),
  contactNumber: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  headLawyer: z.string().min(1, 'Required'),
  status: z.enum(['Active', 'Inactive'])
})
type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = { name: '', address: '', city: '', contactNumber: '', email: '', headLawyer: '', status: 'Active' }

function BranchModal({
  open,
  onOpenChange,
  branch,
  onCreate,
  onUpdate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch?: Branch
  onCreate: (data: Omit<Branch, 'id'>) => Promise<string>
  onUpdate: (id: string, patch: Partial<Omit<Branch, 'id'>>) => Promise<void>
}) {
  const toast = useToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      branch
        ? {
            name: branch.name,
            address: branch.address,
            city: branch.city,
            contactNumber: branch.contactNumber,
            email: branch.email,
            headLawyer: branch.headLawyer,
            status: branch.status
          }
        : emptyValues
    )
  }, [open, branch, reset])

  const onSubmit = async (data: FormValues) => {
    try {
      if (branch) {
        await onUpdate(branch.id, data)
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
    <Modal open={open} onOpenChange={onOpenChange} title={branch ? 'Edit Branch' : 'Add Branch'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Branch Name" required error={errors.name?.message}><FieldInput {...register('name')} error={!!errors.name} /></FormField>
        <FormField label="Address" required error={errors.address?.message}><FieldInput {...register('address')} error={!!errors.address} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="City" required error={errors.city?.message}><FieldInput {...register('city')} error={!!errors.city} /></FormField>
          <FormField label="Contact Number" required error={errors.contactNumber?.message}><FieldInput {...register('contactNumber')} error={!!errors.contactNumber} /></FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Email" required error={errors.email?.message}><FieldInput type="email" {...register('email')} error={!!errors.email} /></FormField>
          <FormField label="Head Lawyer" required error={errors.headLawyer?.message}><FieldInput {...register('headLawyer')} error={!!errors.headLawyer} /></FormField>
        </div>
        <FormField label="Status" required><FieldSelect {...register('status')} options={STATUS_OPTS.map(s => ({ value: s, label: s }))} /></FormField>
      </form>
    </Modal>
  )
}

export function Branches() {
  const toast = useToast()
  const { items, loading, create, update, remove } = useFirestoreResource<Branch>('branches')
  const { items: lawyers } = useFirestoreResource<LawyerRef>('lawyers')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')

  const rows: BranchRow[] = useMemo(
    () => items.map((b) => ({ ...b, lawyerCount: lawyers.filter((l) => l.branch === b.name).length })),
    [items, lawyers]
  )

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase()
    return !q || r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) || r.headLawyer.toLowerCase().includes(q)
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

  const columns: Column<BranchRow>[] = [
    { key: 'name', header: 'Branch Name', render: r => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'city', header: 'City', render: r => <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} style={{ color: 'var(--text-muted)' }} />{r.city}</span> },
    { key: 'address', header: 'Address' },
    { key: 'contactNumber', header: 'Contact' },
    { key: 'email', header: 'Email' },
    { key: 'headLawyer', header: 'Head Lawyer' },
    { key: 'lawyerCount', header: 'Lawyers' },
    { key: 'status', header: 'Status', render: r => <Badge variant={r.status === 'Active' ? 'success' : 'default'}>{r.status}</Badge> },
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
    <motion.div key="branches" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<Building2 size={20} />} title="Branches" subtitle="Manage law firm branch offices and locations."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Branch</button>} />

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search branches..." total={filtered.length}
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        {rows.map(b => (
          <Card key={b.id} hoverable>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-primary-subtle)', border: '1px solid var(--accent-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <Building2 size={16} />
              </div>
              <Badge variant={b.status === 'Active' ? 'success' : 'default'}>{b.status}</Badge>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{b.name}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <MapPin size={11} />{b.address}, {b.city}
            </p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>{b.contactNumber}</span>
              <span>{b.lawyerCount} lawyers</span>
            </div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)', fontSize: 12, color: 'var(--text-muted)' }}>
              Head: <span style={{ color: 'var(--text-primary)' }}>{b.headLawyer}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="0">
        <DataTable columns={columns} data={filtered} hiddenColumns={hiddenColumns} loading={loading} emptyMessage="No branches yet." />
      </Card>

      <BranchModal open={addOpen} onOpenChange={setAddOpen} onCreate={create} onUpdate={update} />
      <BranchModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        branch={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Branch"
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
