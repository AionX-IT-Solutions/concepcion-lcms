import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Plus, FileText, Pencil, Trash2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { FormField, FieldInput } from '../ui/FormField'
import { DataTable, type Column } from '../ui/DataTable'
import { FileDropzone } from './FileDropzone'
import { useLcmsStore } from '../../store/lcms.store'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../lib/utils'
import { uploadFile, deleteFileRef } from '../../lib/storage'
import type { Case, CaseDecision, MockFileRef } from '../../types/lcms.types'

const decisionSchema = z.object({
  dateOfPromulgation: z.string().min(1, 'Required'),
  action: z.string().min(1, 'Required')
})

type DecisionFormValues = z.infer<typeof decisionSchema>

const emptyValues: DecisionFormValues = { dateOfPromulgation: '', action: '' }

function DecisionModal({
  open,
  onOpenChange,
  caseId,
  decision
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
  decision?: CaseDecision
}) {
  const { t } = useTranslation()
  const addDecision = useLcmsStore((s) => s.addDecision)
  const updateDecision = useLcmsStore((s) => s.updateDecision)
  const toast = useToast()
  const [fileRef, setFileRef] = useState<MockFileRef | undefined>(undefined)
  const [originalFileRef, setOriginalFileRef] = useState<MockFileRef | undefined>(undefined)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    setFileRef(decision?.fileRef)
    setOriginalFileRef(decision?.fileRef)
    reset(
      decision
        ? { dateOfPromulgation: decision.dateOfPromulgation, action: decision.action }
        : emptyValues
    )
  }, [open, decision, reset])

  const onSubmit = async (data: DecisionFormValues) => {
    try {
      if (decision) {
        await updateDecision(decision.id, { ...data, fileRef })
      } else {
        await addDecision({ ...data, caseId, fileRef })
      }
      if (originalFileRef?.storagePath && originalFileRef.storagePath !== fileRef?.storagePath) {
        await deleteFileRef(originalFileRef)
      }
      toast.success(t('lcms.saved'))
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={decision ? t('lcms.edit') : t('cases.addDecision')}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={uploading}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <FormField
          label={t('cases.dateOfPromulgation')}
          required
          error={errors.dateOfPromulgation?.message}
        >
          <FieldInput
            type="date"
            {...register('dateOfPromulgation')}
            error={!!errors.dateOfPromulgation}
          />
        </FormField>
        <FormField label={t('cases.action')} required error={errors.action?.message}>
          <FieldInput {...register('action')} error={!!errors.action} />
        </FormField>
        <FormField label={t('cases.viewPdf')}>
          <FileDropzone
            value={fileRef}
            uploading={uploading}
            onSelect={async (file) => {
              setUploading(true)
              try {
                setFileRef(await uploadFile(`cases/${caseId}/decisions`, file))
              } catch (err) {
                toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
              } finally {
                setUploading(false)
              }
            }}
            onClear={() => setFileRef(undefined)}
          />
        </FormField>
      </form>
    </Modal>
  )
}

export function CaseBackgroundTab({ caseData }: { caseData: Case }) {
  const { t } = useTranslation()
  const toast = useToast()
  const allDecisions = useLcmsStore((s) => s.caseDecisions)
  const deleteDecision = useLcmsStore((s) => s.deleteDecision)
  const decisions = useMemo(
    () => allDecisions.filter((d) => d.caseId === caseData.id),
    [allDecisions, caseData.id]
  )
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<CaseDecision | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<CaseDecision | null>(null)
  const [deleting, setDeleting] = useState(false)

  const onDeleteDecision = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDecision(deleteTarget.id)
      toast.success(t('lcms.saved'))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<CaseDecision>[] = [
    {
      key: 'dateOfPromulgation',
      header: t('cases.dateOfPromulgation'),
      render: (row) => formatDate(row.dateOfPromulgation)
    },
    { key: 'action', header: t('cases.action') },
    {
      key: 'fileRef',
      header: t('cases.viewPdf'),
      sortable: false,
      render: (row) => {
        const fileRef = row.fileRef
        return fileRef?.url ? (
          <button
            onClick={() => window.open(fileRef.url, '_blank', 'noopener')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              fontSize: 13,
              padding: 0
            }}
          >
            <FileText size={13} /> {t('cases.viewPdf')}
          </button>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>{t('cases.noFile')}</span>
        )
      }
    },
    {
      key: 'id',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => setEditing(row)}>
            {t('lcms.edit')}
          </Button>
          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => setDeleteTarget(row)}>
            {t('lcms.delete')}
          </Button>
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        header={<h2 style={{ fontSize: 14, fontWeight: 600 }}>{t('cases.partiesInvolved')}</h2>}
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {caseData.partiesInvolved || '-'}
        </p>
      </Card>

      <Card
        header={<h2 style={{ fontSize: 14, fontWeight: 600 }}>{t('cases.clientNarrative')}</h2>}
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {caseData.clientNarrative || '-'}
        </p>
      </Card>

      <Card
        header={<h2 style={{ fontSize: 14, fontWeight: 600 }}>{t('cases.rulingOnLegalIssue')}</h2>}
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {caseData.rulingOnLegalIssue || '-'}
        </p>
      </Card>

      {/* Decisions / Resolutions — button above, no title inside card */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={13} />}
            onClick={() => setAddOpen(true)}
          >
            {t('cases.addDecision')}
          </Button>
        </div>
        <Card padding="0">
          <DataTable columns={columns} data={decisions} emptyMessage={t('lcms.noRecords')} />
        </Card>
      </div>

      <DecisionModal open={addOpen} onOpenChange={setAddOpen} caseId={caseData.id} />
      <DecisionModal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
        caseId={caseData.id}
        decision={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Decision"
        message={deleteTarget ? `Delete this decision (${formatDate(deleteTarget.dateOfPromulgation)})? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDeleteDecision}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
