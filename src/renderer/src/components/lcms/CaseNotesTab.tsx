import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { FormField, FieldInput, FieldTextArea } from '../ui/FormField'
import { useLcmsStore } from '../../store/lcms.store'
import { useToast } from '../../hooks/useToast'
import { formatDate, sortByField } from '../../lib/utils'

const noteSchema = z.object({
  date: z.string().min(1, 'Required'),
  text: z.string().min(1, 'Required')
})

type NoteFormValues = z.infer<typeof noteSchema>

function AddNoteModal({
  open,
  onOpenChange,
  caseId
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
}) {
  const { t } = useTranslation()
  const addCaseNote = useLcmsStore((s) => s.addCaseNote)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10), text: '' }
  })

  const onSubmit = async (data: NoteFormValues) => {
    try {
      await addCaseNote({ ...data, caseId })
      toast.success(t('lcms.saved'))
      reset({ date: new Date().toISOString().slice(0, 10), text: '' })
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('caseNotes.addNote')}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
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
        <FormField label={t('hearings.date')} required error={errors.date?.message}>
          <FieldInput type="date" {...register('date')} error={!!errors.date} />
        </FormField>
        <FormField label={t('caseNotes.note')} required error={errors.text?.message}>
          <FieldTextArea {...register('text')} rows={5} error={!!errors.text} />
        </FormField>
      </form>
    </Modal>
  )
}

export function CaseNotesTab({ caseId }: { caseId: string }) {
  const { t } = useTranslation()
  const toast = useToast()
  const allNotes = useLcmsStore((s) => s.caseNotes)
  const deleteCaseNote = useLcmsStore((s) => s.deleteCaseNote)

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCaseNote(deleteTarget)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
    } finally {
      setDeleting(false)
    }
  }
  const notes = useMemo(
    () =>
      sortByField(
        allNotes.filter((n) => n.caseId === caseId),
        'date',
        'desc'
      ),
    [allNotes, caseId]
  )
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={13} />}
          onClick={() => setAddOpen(true)}
        >
          {t('caseNotes.addNote')}
        </Button>
      </div>
      <Card>
        {notes.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('caseNotes.noNotes')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notes.map((note) => (
              <div
                key={note.id}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  alignItems: 'flex-start'
                }}
              >
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    {formatDate(note.date)}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {note.text}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(note.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
      <AddNoteModal open={addOpen} onOpenChange={setAddOpen} caseId={caseId} />
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('caseNotes.deleteNote')}
        message={t('caseNotes.deleteNoteConfirm')}
        confirmLabel={t('common.delete')}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
