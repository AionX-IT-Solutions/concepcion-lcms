import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Receipt, Plus, Pencil, Trash2 } from 'lucide-react'
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
import { formatDate, formatCurrency } from '../lib/utils'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface Expense {
  id: string
  date: string
  caseTitle: string
  category: string
  description: string
  amount: number
  reimbursable: boolean
  status: 'Pending' | 'Approved' | 'Reimbursed'
}

const CATEGORIES = ['Filing Fee', 'Transportation', 'Photocopying', 'Communication', 'Research', 'Notarial Fee', 'Miscellaneous']
const STATUS_OPTS = ['Pending', 'Approved', 'Reimbursed']

const schema = z.object({
  date: z.string().min(1, 'Required'),
  caseTitle: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  amount: z.coerce.number().positive('Must be > 0'),
  reimbursable: z.boolean(),
  status: z.enum(['Pending', 'Approved', 'Reimbursed'])
})
type FormValues = z.infer<typeof schema>

const emptyValues = {
  date: '', caseTitle: '', category: 'Filing Fee', description: '', amount: 0, reimbursable: true, status: 'Pending' as const
}

const statusVariant: Record<Expense['status'], 'warning' | 'success' | 'default'> = {
  Pending: 'warning', Approved: 'success', Reimbursed: 'default'
}

function ExpenseModal({
  open,
  onOpenChange,
  expense,
  onCreate,
  onUpdate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense
  onCreate: (data: Omit<Expense, 'id'>) => Promise<string>
  onUpdate: (id: string, patch: Partial<Omit<Expense, 'id'>>) => Promise<void>
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
      expense
        ? {
            date: expense.date,
            caseTitle: expense.caseTitle,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            reimbursable: expense.reimbursable,
            status: expense.status
          }
        : emptyValues
    )
  }, [open, expense, reset])

  const onSubmit = async (data: FormValues) => {
    try {
      if (expense) {
        await onUpdate(expense.id, data)
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
    <Modal open={open} onOpenChange={onOpenChange} title={expense ? 'Edit Expense' : 'Add Expense'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Date" required error={errors.date?.message}><FieldInput type="date" {...register('date')} error={!!errors.date} /></FormField>
          <FormField label="Category" required><FieldSelect {...register('category')} options={CATEGORIES.map(c => ({ value: c, label: c }))} /></FormField>
        </div>
        <FormField label="Case Title" required error={errors.caseTitle?.message}><FieldInput {...register('caseTitle')} error={!!errors.caseTitle} /></FormField>
        <FormField label="Description" required error={errors.description?.message}><FieldInput {...register('description')} error={!!errors.description} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Amount (₱)" required error={errors.amount?.message}><FieldInput type="number" min="0" {...register('amount')} error={!!errors.amount} /></FormField>
          <FormField label="Status" required><FieldSelect {...register('status')} options={STATUS_OPTS.map(s => ({ value: s, label: s }))} /></FormField>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="reimbursable" {...register('reimbursable')} style={{ width: 15, height: 15 }} />
          <label htmlFor="reimbursable" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Reimbursable by client</label>
        </div>
      </form>
    </Modal>
  )
}

export function ExpenseTracking() {
  const toast = useToast()
  const { items, loading, create, update, remove } = useFirestoreResource<Expense>('expenses')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = items.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    return !q || r.description.toLowerCase().includes(q) || r.caseTitle.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
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

  const totalExpenses = items.reduce((s, r) => s + r.amount, 0)
  const totalPending = items.filter(r => r.status === 'Pending').reduce((s, r) => s + r.amount, 0)

  const columns: Column<Expense>[] = [
    { key: 'date', header: 'Date', render: r => formatDate(r.date) },
    { key: 'caseTitle', header: 'Case' },
    { key: 'category', header: 'Category' },
    { key: 'description', header: 'Description' },
    { key: 'amount', header: 'Amount', render: r => formatCurrency(r.amount) },
    { key: 'reimbursable', header: 'Reimbursable', render: r => <Badge variant={r.reimbursable ? 'success' : 'default'}>{r.reimbursable ? 'Yes' : 'No'}</Badge> },
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
    <motion.div key="expense-tracking" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<Receipt size={20} />} title="Expense Tracking" subtitle="Track billable and non-billable litigation expenses."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Expense</button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 16 }}>
        <Card>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Expenses</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(totalExpenses)}</p>
        </Card>
        <Card>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Pending Approval</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-warning)' }}>{formatCurrency(totalPending)}</p>
        </Card>
      </div>

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search expenses..." total={filtered.length}
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={<ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))]} />} />

      <Card padding="0">
        <DataTable columns={columns} data={filtered} hiddenColumns={hiddenColumns} loading={loading} emptyMessage="No expenses yet." />
      </Card>

      <ExpenseModal open={addOpen} onOpenChange={setAddOpen} onCreate={create} onUpdate={update} />
      <ExpenseModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        expense={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Expense"
        message={deleteTarget ? `Delete "${deleteTarget.description}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  )
}
