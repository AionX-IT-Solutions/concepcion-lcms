import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pencil, Scale, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Tabs } from '../components/lcms/Tabs'
import { CaseFormModal } from '../components/lcms/CaseFormModal'
import { CaseBackgroundTab } from '../components/lcms/CaseBackgroundTab'
import { BillingTab } from '../components/lcms/BillingTab'
import { CaseDevelopmentTab } from '../components/lcms/CaseDevelopmentTab'
import { HearingsTab } from '../components/lcms/HearingsTab'
import { HearingFormModal } from '../components/lcms/HearingFormModal'
import { CaseNotesTab } from '../components/lcms/CaseNotesTab'
import { CaseTimelineTab } from '../components/lcms/CaseTimelineTab'
import { Card } from '../components/ui/Card'
import { useLcmsStore } from '../store/lcms.store'
import { useToast } from '../hooks/useToast'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

type TabId = 'background' | 'hearings' | 'billing' | 'development' | 'notes' | 'timeline'

export function CaseDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { caseId } = useParams<{ clientId: string; caseId: string }>()
  const caseData = useLcmsStore((s) => s.cases.find((c) => c.id === caseId))
  const lcmsLoading = useLcmsStore((s) => s.loading)
  const deleteCase = useLcmsStore((s) => s.deleteCase)
  const [tab, setTab] = useState<TabId>('background')
  const [editOpen, setEditOpen] = useState(false)
  const [addHearingOpen, setAddHearingOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const onDeleteCase = async () => {
    if (!caseData) return
    setDeleting(true)
    try {
      await deleteCase(caseData.id)
      toast.success(t('lcms.saved'))
      navigate(`/clients/${caseData.clientId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
      setDeleting(false)
    }
  }

  if (!caseData) {
    return (
      <motion.div
        className="page-wrapper"
        initial="initial"
        animate="animate"
        variants={pageVariants}
      >
        {lcmsLoading ? (
          <Card loading skeletonRows={4} />
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>{t('cases.noCases')}</p>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      key="case-detail"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      <PageHeader
        icon={<Scale size={20} />}
        title={caseData.caseTitle}
        subtitle={`${caseData.caStation} · ${caseData.caseNumber}`}
        actions={
          <>
            <Badge
              variant={caseData.status === 'WITH DECISION / RESOLUTION' ? 'success' : 'warning'}
            >
              {caseData.status}
            </Badge>
            <button className="btn-primary" onClick={() => setAddHearingOpen(true)}>
              <Plus size={14} />
              {t('hearings.addHearing')}
            </button>
            <button className="btn-secondary" onClick={() => setEditOpen(true)}>
              <Pencil size={14} />
              {t('lcms.edit')}
            </button>
            <button className="btn-danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} />
              {t('lcms.delete')}
            </button>
          </>
        }
      />

      <Tabs
        tabs={[
          { id: 'background', label: t('cases.title') },
          { id: 'hearings', label: t('hearings.title') },
          { id: 'billing', label: t('billing.title') },
          { id: 'development', label: t('caseDevelopment.title') },
          { id: 'notes', label: t('caseNotes.title') },
          { id: 'timeline', label: t('timeline.title') }
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === 'background' && <CaseBackgroundTab caseData={caseData} />}
      {tab === 'hearings' && (
        <HearingsTab
          caseId={caseData.id}
          addOpen={addHearingOpen}
          onAddOpenChange={setAddHearingOpen}
        />
      )}
      {tab === 'billing' && <BillingTab caseId={caseData.id} />}
      {tab === 'development' && <CaseDevelopmentTab caseId={caseData.id} />}
      {tab === 'notes' && <CaseNotesTab caseId={caseData.id} />}
      {tab === 'timeline' && <CaseTimelineTab caseId={caseData.id} />}

      <CaseFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        clientId={caseData.clientId}
        caseData={caseData}
      />

      {/* Add Hearing modal — always mounted so it can open from any tab */}
      {tab !== 'hearings' && (
        <HearingFormModal
          open={addHearingOpen}
          onOpenChange={setAddHearingOpen}
          caseId={caseData.id}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Case"
        message={`Delete "${caseData.caseTitle}"? This also deletes all its hearings, tasks, billing, payments, decisions, and documents. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDeleteCase}
        onCancel={() => setDeleteOpen(false)}
      />
    </motion.div>
  )
}
