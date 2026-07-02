import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Download, TrendingUp, Users, Briefcase, CheckSquare } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useLcmsStore } from '../store/lcms.store'
import { useToast } from '../hooks/useToast'
import { formatCurrency } from '../lib/utils'
import { CASE_STATUSES } from '../types/lcms.types'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CASE_STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  'WITH DECISION / RESOLUTION': '#10b981',
  'ON APPEAL': '#3b82f6',
  DISMISSED: '#ef4444',
  CLOSED: '#8888aa'
}

const reportOptions = [
  { label: 'Client Summary Report', description: 'List of all clients with case counts and billing status' },
  { label: 'Case Status Report', description: 'Overview of all active and resolved cases by status' },
  { label: 'Billing & Revenue Report', description: 'Monthly revenue breakdown, collections, and outstanding balances' },
  { label: 'Hearing Schedule Report', description: 'Upcoming hearings within the next 30 days' },
  { label: 'Task Completion Report', description: 'Task completion rates by assignee and priority' },
  { label: 'Expense Report', description: 'Itemized expenses by case and category' }
]

export function Reports() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview')
  const clients = useLcmsStore((s) => s.clients)
  const cases = useLcmsStore((s) => s.cases)
  const tasks = useLcmsStore((s) => s.tasks)
  const payments = useLcmsStore((s) => s.payments)

  const today = new Date().toISOString().slice(0, 10)
  const currentYear = new Date().getFullYear()

  const activeCases = useMemo(
    () => cases.filter((c) => c.status !== 'CLOSED' && c.status !== 'DISMISSED').length,
    [cases]
  )
  const tasksCompleted = useMemo(() => tasks.filter((t) => t.status === 'Done').length, [tasks])

  const paymentsThisYear = useMemo(
    () => payments.filter((p) => new Date(p.date).getFullYear() === currentYear),
    [payments, currentYear]
  )
  const revenueYTD = useMemo(() => paymentsThisYear.reduce((s, p) => s + p.amount, 0), [paymentsThisYear])

  const summaryStats = [
    { label: 'Total Clients', value: String(clients.length), icon: <Users size={18} />, color: 'var(--accent-primary)', bg: 'var(--accent-primary-subtle)' },
    { label: 'Active Cases', value: String(activeCases), icon: <Briefcase size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Tasks Completed', value: String(tasksCompleted), icon: <CheckSquare size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Revenue YTD', value: formatCurrency(revenueYTD), icon: <TrendingUp size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' }
  ]

  const monthlyRevenue = useMemo(() => {
    const totals = new Array(12).fill(0)
    for (const p of paymentsThisYear) {
      totals[new Date(p.date).getMonth()] += p.amount
    }
    return MONTHS.map((month, i) => ({ month, amount: totals[i] }))
  }, [paymentsThisYear])
  const maxRevenue = Math.max(1, ...monthlyRevenue.map((r) => r.amount))

  const casesByStatus = useMemo(
    () =>
      CASE_STATUSES.map((status) => ({
        type: status,
        count: cases.filter((c) => c.status === status).length,
        color: CASE_STATUS_COLORS[status] ?? '#8888aa'
      })),
    [cases]
  )
  const maxCasesForBar = Math.max(1, cases.length)

  const tasksByStatus = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'Done').length
    const inProgressUpcoming = tasks.filter((t) => t.status === 'In Progress' && t.dueDate >= today).length
    const pendingUpcoming = tasks.filter((t) => t.status === 'Pending' && t.dueDate >= today).length
    const overdue = tasks.filter((t) => t.status !== 'Done' && t.dueDate < today).length
    return [
      { status: 'Done', count: done, color: '#10b981' },
      { status: 'In Progress', count: inProgressUpcoming, color: '#3b82f6' },
      { status: 'Pending', count: pendingUpcoming, color: '#f59e0b' },
      { status: 'Overdue', count: overdue, color: '#ef4444' }
    ]
  }, [tasks, today])

  return (
    <motion.div key="reports" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="page-wrapper">
      <PageHeader icon={<BarChart3 size={20} />} title="Reports & Analytics" subtitle="Monitor law firm performance and generate printable reports." />

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--surface-2)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['overview', 'reports'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              background: activeTab === tab ? 'var(--surface-3)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {tab === 'overview' ? 'Analytics Overview' : 'Generate Reports'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {summaryStats.map(s => (
              <Card key={s.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Monthly Revenue ({currentYear})</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
                {monthlyRevenue.map(r => (
                  <div key={r.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatCurrency(r.amount).replace('₱', '').trim()}</span>
                    <div style={{ width: '100%', height: (r.amount / maxRevenue) * 100, background: 'var(--accent-primary)', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.month}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Cases by Status</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {casesByStatus.map(c => (
                  <div key={c.type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.type}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{c.count}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${(c.count / maxCasesForBar) * 100}%`, background: c.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Task Status Summary</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {tasksByStatus.map(t => (
                <div key={t.status} style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                  <p style={{ fontSize: 24, fontWeight: 700, color: t.color }}>{t.count}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.status}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {activeTab === 'reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {reportOptions.map(r => (
            <Card key={r.label} hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{r.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.description}</p>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Download size={13} />} onClick={() => toast.info(`Export for "${r.label}" is coming soon.`)} style={{ flexShrink: 0, marginLeft: 12 }}>
                  Export
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}
