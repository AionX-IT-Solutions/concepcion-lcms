import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Plus, FileText, Pencil, Trash2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { FormField, FieldInput, FieldSelect } from '../ui/FormField'
import { DataTable, type Column } from '../ui/DataTable'
import { FileDropzone } from './FileDropzone'
import { useLcmsStore } from '../../store/lcms.store'
import { useToast } from '../../hooks/useToast'
import { formatDate, sortByField } from '../../lib/utils'
import { uploadFile, deleteFileRef } from '../../lib/storage'
import {
  CASE_DEV_DOC_TYPES,
  type CaseDevelopmentEntry,
  type MockFileRef
} from '../../types/lcms.types'

const entrySchema = z.object({
  date: z.string().min(1, 'Required'),
  documentType: z.enum([
    'Filed Complaint',
    'Answer Received',
    'Reply Filed',
    'Pre-Trial',
    'Motion',
    'Order',
    'Other'
  ]),
  description: z.string().min(1, 'Required')
})

type EntryFormValues = z.infer<typeof entrySchema>

const docTypeOptions = CASE_DEV_DOC_TYPES.map((v) => ({ value: v, label: v }))

const emptyValues: EntryFormValues = { date: '', documentType: 'Filed Complaint', description: '' }

function EntryModal({
  open,
  onOpenChange,
  caseId,
  entry
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
  entry?: CaseDevelopmentEntry
}) {
  const { t } = useTranslation()
  const addCaseDevEntry = useLcmsStore((s) => s.addCaseDevEntry)
  const updateCaseDevEntry = useLcmsStore((s) => s.updateCaseDevEntry)
  const toast = useToast()
  const [fileRef, setFileRef] = useState<MockFileRef | undefined>(undefined)
  const [originalFileRef, setOriginalFileRef] = useState<MockFileRef | undefined>(undefined)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    setFileRef(entry?.fileRef)
    setOriginalFileRef(entry?.fileRef)
    reset(
      entry
        ? { date: entry.date, documentType: entry.documentType, description: entry.description }
        : emptyValues
    )
  }, [open, entry, reset])

  const onSubmit = async (data: EntryFormValues) => {
    try {
      if (entry) {
        await updateCaseDevEntry(entry.id, { ...data, fileRef })
      } else {
        await addCaseDevEntry({ ...data, caseId, fileRef })
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
      title={entry ? t('lcms.edit') : t('caseDevelopment.addEntry')}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label={t('caseDevelopment.date')} required error={errors.date?.message}>
            <FieldInput type="date" {...register('date')} error={!!errors.date} />
          </FormField>
          <FormField label={t('caseDevelopment.documentType')} required>
            <Controller
              control={control}
              name="documentType"
              render={({ field }) => <FieldSelect {...field} options={docTypeOptions} />}
            />
          </FormField>
        </div>
        <FormField
          label={t('caseDevelopment.description')}
          required
          error={errors.description?.message}
        >
          <FieldInput {...register('description')} error={!!errors.description} />
        </FormField>
        <FormField label={t('caseDevelopment.uploadFile')}>
          <FileDropzone
            value={fileRef}
            uploading={uploading}
            onSelect={async (file) => {
              setUploading(true)
              try {
                setFileRef(await uploadFile(`cases/${caseId}/dev-entries`, file))
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

export function CaseDevelopmentTab({ caseId }: { caseId: string }) {
  const { t } = useTranslation()
  const toast = useToast()
  const allEntries = useLcmsStore((s) => s.caseDevEntries)
  const deleteCaseDevEntry = useLcmsStore((s) => s.deleteCaseDevEntry)
  const entries = useMemo(() => allEntries.filter((e) => e.caseId === caseId), [allEntries, caseId])
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<CaseDevelopmentEntry | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<CaseDevelopmentEntry | null>(null)
  const [deleting, setDeleting] = useState(false)

  const sortedEntries = useMemo(() => sortByField(entries, 'date', 'desc'), [entries])

  const onDeleteEntry = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCaseDevEntry(deleteTarget.id)
      toast.success(t('lcms.saved'))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<CaseDevelopmentEntry>[] = [
    { key: 'date', header: t('caseDevelopment.date'), render: (row) => formatDate(row.date) },
    { key: 'documentType', header: t('caseDevelopment.documentType') },
    { key: 'description', header: t('caseDevelopment.description') },
    {
      key: 'fileRef',
      header: t('caseDevelopment.uploadFile'),
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
            <FileText size={13} /> {fileRef.name}
          </button>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>{t('caseDevelopment.noFile')}</span>
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={13} />}
          onClick={() => setAddOpen(true)}
        >
          {t('caseDevelopment.addEntry')}
        </Button>
      </div>
      <Card padding="0">
        <DataTable
          columns={columns}
          data={sortedEntries}
          emptyMessage={t('caseDevelopment.noEntries')}
        />
      </Card>
      <EntryModal open={addOpen} onOpenChange={setAddOpen} caseId={caseId} />
      <EntryModal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
        caseId={caseId}
        entry={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Entry"
        message={deleteTarget ? `Delete this "${deleteTarget.documentType}" entry? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDeleteEntry}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
