import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TitleBar } from './components/layout/TitleBar'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { Breadcrumb } from './components/ui/Breadcrumb'
import { Toaster } from './components/ui/Toaster'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { useTheme } from './hooks/useTheme'
import { useAnalytics } from './hooks/useAnalytics'
import { useUpdateStatus } from './hooks/useUpdateStatus'
import { useFirebaseAuth } from './hooks/useFirebaseAuth'
import { useLcmsSync } from './hooks/useLcmsSync'
import { usePermissionsSync } from './hooks/usePermissionsSync'
import { RequirePermission } from './components/layout/RequirePermission'
import { useAppStore } from './store/app.store'
import { useLcmsStore } from './store/lcms.store'

// Lazy-loaded views — each view is a separate chunk
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })))
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const Clients = lazy(() => import('./pages/Clients').then((m) => ({ default: m.Clients })))
const ClientDetail = lazy(() =>
  import('./pages/ClientDetail').then((m) => ({ default: m.ClientDetail }))
)
const CaseDetail = lazy(() => import('./pages/CaseDetail').then((m) => ({ default: m.CaseDetail })))
const Cases = lazy(() => import('./pages/Cases').then((m) => ({ default: m.Cases })))
const Hearings = lazy(() => import('./pages/Hearings').then((m) => ({ default: m.Hearings })))
const Calendar = lazy(() => import('./pages/Calendar').then((m) => ({ default: m.Calendar })))
const Tasks = lazy(() => import('./pages/Tasks').then((m) => ({ default: m.Tasks })))
const Documents = lazy(() => import('./pages/Documents').then((m) => ({ default: m.Documents })))
const BillingOverview = lazy(() =>
  import('./pages/BillingOverview').then((m) => ({ default: m.BillingOverview }))
)
const EvidenceManagement = lazy(() => import('./pages/EvidenceManagement').then((m) => ({ default: m.EvidenceManagement })))
const LegalResearch = lazy(() => import('./pages/LegalResearch').then((m) => ({ default: m.LegalResearch })))
const Contracts = lazy(() => import('./pages/Contracts').then((m) => ({ default: m.Contracts })))
const Affidavits = lazy(() => import('./pages/Affidavits').then((m) => ({ default: m.Affidavits })))
const Pleadings = lazy(() => import('./pages/Pleadings').then((m) => ({ default: m.Pleadings })))
const Motions = lazy(() => import('./pages/Motions').then((m) => ({ default: m.Motions })))
const CourtOrders = lazy(() => import('./pages/CourtOrders').then((m) => ({ default: m.CourtOrders })))
const TrustAccounts = lazy(() => import('./pages/TrustAccounts').then((m) => ({ default: m.TrustAccounts })))
const ExpenseTracking = lazy(() => import('./pages/ExpenseTracking').then((m) => ({ default: m.ExpenseTracking })))
const AuditTrail = lazy(() => import('./pages/AuditTrail').then((m) => ({ default: m.AuditTrail })))
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })))
const RoleAccess = lazy(() => import('./pages/RoleAccess').then((m) => ({ default: m.RoleAccess })))
const Lawyers = lazy(() => import('./pages/Lawyers').then((m) => ({ default: m.Lawyers })))
const Branches = lazy(() => import('./pages/Branches').then((m) => ({ default: m.Branches })))

function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '2px solid var(--border-default)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 0.7s linear infinite',
          boxShadow: '0 0 12px var(--accent-primary-glow)'
        }}
      />
    </motion.div>
  )
}

function useAutoNotifications() {
  const hearings = useLcmsStore((s) => s.hearings)
  const tasks = useLcmsStore((s) => s.tasks)
  const cases = useLcmsStore((s) => s.cases)
  const addNotification = useAppStore((s) => s.addNotification)
  const clearNotifications = useAppStore((s) => s.clearNotifications)

  useEffect(() => {
    clearNotifications()

    const today = new Date(new Date().toISOString().slice(0, 10))

    for (const h of hearings) {
      if (h.status === 'Cancelled' || h.status === 'Completed') continue
      const target = new Date(h.date)
      const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diff < 0 || diff > 3) continue
      const caseData = cases.find((c) => c.id === h.caseId)
      const label = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : `in ${diff} days`
      addNotification({
        type: 'warning',
        message: `Hearing ${label}: ${h.hearingType}${caseData ? ` — ${caseData.caseTitle}` : ''} at ${h.time}, ${h.courtBranch}`
      })
    }

    for (const task of tasks) {
      if (task.status === 'Done') continue
      const target = new Date(task.dueDate)
      const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diff < 0 || diff > 3) continue
      const label = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : `in ${diff} days`
      addNotification({
        type: diff === 0 ? 'error' : 'warning',
        message: `Task due ${label}: ${task.title}`
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

function AuthenticatedShell() {
  useAutoNotifications()

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="app-body">
        <Sidebar />
        <main className="app-content">
          <Breadcrumb />
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/clients"
                  element={
                    <RequirePermission permission="view:clients">
                      <Clients />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/clients/:clientId"
                  element={
                    <RequirePermission permission="view:clients">
                      <ClientDetail />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/clients/:clientId/cases/:caseId"
                  element={
                    <RequirePermission permission="view:cases">
                      <CaseDetail />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/cases"
                  element={
                    <RequirePermission permission="view:cases">
                      <Cases />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/hearings"
                  element={
                    <RequirePermission permission="view:cases">
                      <Hearings />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <RequirePermission permission="view:cases">
                      <Calendar />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <RequirePermission permission="view:cases">
                      <Tasks />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <RequirePermission permission="view:documents">
                      <Documents />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <RequirePermission permission="view:billing">
                      <BillingOverview />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/evidence"
                  element={
                    <RequirePermission permission="view:cases">
                      <EvidenceManagement />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/legal-research"
                  element={
                    <RequirePermission permission="view:cases">
                      <LegalResearch />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/contracts"
                  element={
                    <RequirePermission permission="view:documents">
                      <Contracts />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/affidavits"
                  element={
                    <RequirePermission permission="view:documents">
                      <Affidavits />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/pleadings"
                  element={
                    <RequirePermission permission="view:documents">
                      <Pleadings />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/motions"
                  element={
                    <RequirePermission permission="view:documents">
                      <Motions />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/court-orders"
                  element={
                    <RequirePermission permission="view:documents">
                      <CourtOrders />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/trust-accounts"
                  element={
                    <RequirePermission permission="view:billing">
                      <TrustAccounts />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <RequirePermission permission="view:billing">
                      <ExpenseTracking />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/audit-trail"
                  element={
                    <RequirePermission permission="view:reports">
                      <AuditTrail />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <RequirePermission permission="view:reports">
                      <Reports />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/role-access"
                  element={
                    <RequirePermission permission="manage:users">
                      <RoleAccess />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/lawyers"
                  element={
                    <RequirePermission permission="manage:settings">
                      <Lawyers />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/branches"
                  element={
                    <RequirePermission permission="manage:settings">
                      <Branches />
                    </RequirePermission>
                  }
                />
                <Route path="/settings" element={<Settings />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </main>
      </div>
      <StatusBar />
    </div>
  )
}

function UnauthenticatedShell() {
  return (
    <div className="app-shell">
      <TitleBar />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  )
}

function AppInner() {
  useTheme()
  useAnalytics()
  useUpdateStatus()
  useFirebaseAuth()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const authChecked = useAppStore((s) => s.authChecked)
  useLcmsSync(isAuthenticated)
  usePermissionsSync(isAuthenticated)

  if (!authChecked) {
    return (
      <div className="app-shell">
        <TitleBar />
        <PageLoader />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        {isAuthenticated ? <AuthenticatedShell key="app" /> : <UnauthenticatedShell key="login" />}
      </AnimatePresence>
      <Toaster />
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  )
}
