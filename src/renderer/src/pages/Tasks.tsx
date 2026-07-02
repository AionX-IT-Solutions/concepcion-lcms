import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CheckSquare, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, type Column, useColumnVisibility, ColumnsButton } from '../components/ui/DataTable'
import { TableToolbar, ToolbarSelect } from '../components/ui/TableToolbar'
import { TaskFormModal } from '../components/lcms/TaskFormModal'
import { useLcmsStore } from '../store/lcms.store'
import { useToast } from '../hooks/useToast'
import { formatDate, sortByField } from '../lib/utils'
import type { Task } from '../types/lcms.types'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

interface TaskRow extends Task {
  caseTitle: string
}

const statusVariant: Record<Task['status'], 'default' | 'primary' | 'success'> = {
  Pending: 'default',
  'In Progress': 'primary',
  Done: 'success'
}

const priorityVariant: Record<Task['priority'], 'default' | 'warning' | 'danger'> = {
  Low: 'default',
  Medium: 'warning',
  High: 'danger'
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' }
]

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' }
]

export function Tasks() {
  const { t } = useTranslation()
  const toast = useToast()
  const tasks = useLcmsStore((s) => s.tasks)
  const cases = useLcmsStore((s) => s.cases)
  const lcmsLoading = useLcmsStore((s) => s.loading)
  const deleteTask = useLcmsStore((s) => s.deleteTask)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

  const onDeleteTask = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTask(deleteTarget.id)
      toast.success(t('lcms.saved'))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const rows: TaskRow[] = useMemo(() => {
    const withCase = tasks.map((task) => ({
      ...task,
      caseTitle: task.caseId ? (cases.find((c) => c.id === task.caseId)?.caseTitle ?? '-') : '-'
    }))
    return sortByField(withCase, 'dueDate', 'asc')
  }, [tasks, cases])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (priorityFilter && r.priority !== priorityFilter) return false
      if (!q) return true
      return r.title.toLowerCase().includes(q) || r.caseTitle.toLowerCase().includes(q)
    })
  }, [rows, search, statusFilter, priorityFilter])

  const columns: Column<TaskRow>[] = [
    { key: 'title', header: t('tasks.taskTitle') },
    { key: 'caseTitle', header: t('tasks.relatedCase') },
    { key: 'dueDate', header: t('tasks.dueDate'), render: (row) => formatDate(row.dueDate) },
    {
      key: 'priority',
      header: t('tasks.priority'),
      render: (row) => <Badge variant={priorityVariant[row.priority]}>{row.priority}</Badge>
    },
    {
      key: 'status',
      header: t('tasks.status'),
      render: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
    },
    {
      key: 'id',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={12} />}
          onClick={(e) => {
            e.stopPropagation()
            setDeleteTarget(row)
          }}
        >
          {t('lcms.delete')}
        </Button>
      )
    }
  ]
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)

  return (
    <motion.div
      key="tasks"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      <PageHeader
        icon={<CheckSquare size={20} />}
        title={t('tasks.title')}
        subtitle={t('tasks.subtitle')}
        actions={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={14} />
            {t('tasks.addTask')}
          </button>
        }
      />

      <TableToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search tasks..."
        columnsButton={<ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />}
        filters={
          <>
            <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
            <ToolbarSelect value={priorityFilter} onChange={setPriorityFilter} options={priorityOptions} />
          </>
        }
      />

      <Card padding="0">
        <DataTable
          columns={columns}
          data={filteredRows}
          hiddenColumns={hiddenColumns}
          loading={lcmsLoading}
          emptyMessage={t('tasks.noTasks')}
          onRowClick={(row) => setEditing(row)}
        />
      </Card>

      <TaskFormModal open={addOpen} onOpenChange={setAddOpen} />
      <TaskFormModal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
        task={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Task"
        message={deleteTarget ? `Delete "${deleteTarget.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDeleteTask}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  )
}
