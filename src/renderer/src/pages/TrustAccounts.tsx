import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Landmark, Plus, Pencil, Trash2 } from 'lucide-react'
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
import { formatDate, formatCurrency, sortByField } from '../lib/utils'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface TrustEntry {
  id: string
  date: string
  client: string
  caseTitle: string
  description: string
  type: 'Deposit' | 'Withdrawal'
  amount: number
}

interface TrustRow extends TrustEntry {
  balance: number
}

const TYPE_OPTS = ['Deposit', 'Withdrawal']

const schema = z.object({
  date: z.string().min(1, 'Required'),
  client: z.string().min(1, 'Required'),
  caseTitle: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  type: z.enum(['Deposit', 'Withdrawal']),
  amount: z.coerce.number().positive('Must be > 0')
})
type FormValues = z.infer<typeof schema>

const emptyValues = { date: '', client: '', caseTitle: '', description: '', type: 'Deposit' as const, amount: 0 }

function TrustEntryModal({
  open,
  onOpenChange,
  entry,
  onCreate,
  onUpdate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry?: TrustEntry
  onCreate: (data: Omit<TrustEntry, 'id'>) => Promise<string>
  onUpdate: (id: string, patch: Partial<Omit<TrustEntry, 'id'>>) => Promise<void>
}) {
  const toast = useToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<
    z.input<typeof schema>,
    unknown,
    FormValues
  >({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      entry
        ? {
            date: entry.date,
            client: entry.client,
            caseTitle: entry.caseTitle,
            description: entry.description,
            type: entry.type,
            amount: entry.amount
          }
        : emptyValues
    )
  }, [open, entry, reset])

  const onSubmit = async (data: FormValues) => {
    try {
      if (entry) {
        await onUpdate(entry.id, data)
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
    <Modal open={open} onOpenChange={onOpenChange} title={entry ? 'Edit Trust Account Entry' : 'Add Trust Account Entry'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Date" required error={errors.date?.message}><FieldInput type="date" {...register('date')} error={!!errors.date} /></FormField>
          <FormField label="Type" required><FieldSelect {...register('type')} options={TYPE_OPTS.map(t => ({ value: t, label: t }))} /></FormField>
        </div>
        <FormField label="Client" required error={errors.client?.message}><FieldInput {...register('client')} error={!!errors.client} /></FormField>
        <FormField label="Case Title" required error={errors.caseTitle?.message}><FieldInput {...register('caseTitle')} error={!!errors.caseTitle} /></FormField>
        <FormField label="Description" required error={errors.description?.message}><FieldInput {...register('description')} error={!!errors.description} /></FormField>
        <FormField label="Amount (₱)" required error={errors.amount?.message}><FieldInput type="number" min="0" {...register('amount')} error={!!errors.amount} /></FormField>
      </form>
    </Modal>
  )
}

export function TrustAccounts() {
  const toast = useToast()
  const { items, loading, create, update, remove } = useFirestoreResource<TrustEntry>('trustAccountEntries')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<TrustEntry | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<TrustEntry | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const rows: TrustRow[] = useMemo(() => {
    const sorted = sortByField(items, 'date', 'asc')
    let running = 0
    return sorted.map((entry) => {
      running = entry.type === 'Deposit' ? running + entry.amount : running - entry.amount
      return { ...entry, balance: running }
    })
  }, [items])

  const filtered = rows.filter(r => {
    if (typeFilter && r.type !== typeFilter) return false
    const q = search.trim().toLowerCase()
    return !q || r.client.toLowerCase().includes(q) || r.caseTitle.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
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

  const columns: Column<TrustRow>[] = [
    { key: 'date', header: 'Date', render: r => formatDate(r.date) },
    { key: 'client', header: 'Client' },
    { key: 'caseTitle', header: 'Case' },
    { key: 'description', header: 'Description' },
    { key: 'type', header: 'Type', render: r => <Badge variant={r.type === 'Deposit' ? 'success' : 'danger'}>{r.type}</Badge> },
    { key: 'amount', header: 'Amount', render: r => formatCurrency(r.amount) },
    { key: 'balance', header: 'Running Balance', render: r => formatCurrency(r.balance) },
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

  const totalBalance = rows.length ? rows[rows.length - 1].balance : 0

  return (
    <motion.div key="trust-accounts" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<Landmark size={20} />} title="Trust Accounts" subtitle="Manage client trust account ledger and disbursements."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Entry</button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        {[
          { label: 'Total Deposits', val: formatCurrency(items.filter(r => r.type === 'Deposit').reduce((s, r) => s + r.amount, 0)), color: 'var(--color-success)' },
          { label: 'Total Withdrawals', val: formatCurrency(items.filter(r => r.type === 'Withdrawal').reduce((s, r) => s + r.amount, 0)), color: 'var(--color-danger)' },
          { label: 'Current Balance', val: formatCurrency(totalBalance), color: 'var(--accent-primary)' }
        ].map(s => (
          <Card key={s.label}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</p>
          </Card>
        ))}
      </div>

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search entries..." total={filtered.length}
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={<ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={[{ value: '', label: 'All Types' }, ...TYPE_OPTS.map(s => ({ value: s, label: s }))]} />} />

      <Card padding="0">
        <DataTable columns={columns} data={filtered} hiddenColumns={hiddenColumns} loading={loading} emptyMessage="No trust account entries yet." />
      </Card>

      <TrustEntryModal open={addOpen} onOpenChange={setAddOpen} onCreate={create} onUpdate={update} />
      <TrustEntryModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        entry={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Entry"
        message={deleteTarget ? `Delete this entry of ${formatCurrency(deleteTarget.amount)}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  )
}
