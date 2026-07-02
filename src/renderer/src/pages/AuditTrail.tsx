import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { TableToolbar, ToolbarSelect } from '../components/ui/TableToolbar'
import { useFirestoreResource } from '../lib/useFirestoreResource'
import { AUDIT_MODULES, type AuditEntry } from '../lib/audit'
import { sortByField } from '../lib/utils'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

const SEVERITY_OPTS = ['Info', 'Warning', 'Critical']

const severityVariant: Record<AuditEntry['severity'], 'default' | 'warning' | 'danger'> = {
  Info: 'default', Warning: 'warning', Critical: 'danger'
}

export function AuditTrail() {
  const { items, loading } = useFirestoreResource<AuditEntry>('auditLogs')
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')

  const sorted = sortByField(items, 'timestamp', 'desc')

  const filtered = sorted.filter(r => {
    if (moduleFilter && r.module !== moduleFilter) return false
    if (severityFilter && r.severity !== severityFilter) return false
    const q = search.trim().toLowerCase()
    return !q || r.user.toLowerCase().includes(q) || r.action.toLowerCase().includes(q) || r.target.toLowerCase().includes(q)
  })

  const columns: Column<AuditEntry>[] = [
    { key: 'timestamp', header: 'Timestamp', render: r => <span style={{ fontSize: 12 }}>{new Date(r.timestamp).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}</span> },
    { key: 'user', header: 'User' },
    { key: 'action', header: 'Action', render: r => <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>{r.action}</span> },
    { key: 'module', header: 'Module' },
    { key: 'target', header: 'Target' },
    { key: 'severity', header: 'Severity', render: r => <Badge variant={severityVariant[r.severity]}>{r.severity}</Badge> }
  ]

  return (
    <motion.div key="audit-trail" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<ShieldCheck size={20} />} title="Audit Trail" subtitle="View system activity logs and user action history." />

      <TableToolbar search={search} onSearch={setSearch} searchPlaceholder="Search logs..." total={filtered.length}
        filters={
          <>
            <ToolbarSelect value={moduleFilter} onChange={setModuleFilter} options={[{ value: '', label: 'All Modules' }, ...AUDIT_MODULES.map(m => ({ value: m, label: m }))]} />
            <ToolbarSelect value={severityFilter} onChange={setSeverityFilter} options={[{ value: '', label: 'All Severities' }, ...SEVERITY_OPTS.map(s => ({ value: s, label: s }))]} />
          </>
        } />

      <Card padding="0">
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No audit logs recorded yet." />
      </Card>
    </motion.div>
  )
}
