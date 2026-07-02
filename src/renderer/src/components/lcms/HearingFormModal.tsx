import { useCallback, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { FormField, FieldInput, FieldSelect, FieldTextArea } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'
import { useLcmsStore } from '../../store/lcms.store'
import { useToast } from '../../hooks/useToast'
import { toInputDate } from '../../lib/utils'
import { searchByPrefix } from '../../lib/firestore-sync'
import { HEARING_STATUSES, HEARING_TYPES, type Case, type Hearing } from '../../types/lcms.types'

const hearingSchema = z.object({
  caseId: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  time: z.string().min(1, 'Required'),
  courtBranch: z.string().min(1, 'Required'),
  hearingType: z.enum([
    'Arraignment',
    'Pre-Trial',
    'Trial',
    'Promulgation',
    'Motion Hearing',
    'Mediation',
    'Other'
  ]),
  status: z.enum(['Scheduled', 'Postponed', 'Cancelled', 'Completed']),
  notes: z.string().optional()
})

type HearingFormValues = z.infer<typeof hearingSchema>

interface HearingFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, locks the hearing to this case (used inside a case's tab) */
  caseId?: string
  hearing?: Hearing
}

const hearingTypeOptions = HEARING_TYPES.map((v) => ({ value: v, label: v }))
const hearingStatusOptions = HEARING_STATUSES.map((v) => ({ value: v, label: v }))

const emptyValues = (caseId?: string): HearingFormValues => ({
  caseId: caseId ?? '',
  date: '',
  time: '',
  courtBranch: '',
  hearingType: 'Pre-Trial',
  status: 'Scheduled',
  notes: ''
})

export function HearingFormModal({ open, onOpenChange, caseId, hearing }: HearingFormModalProps) {
  const { t } = useTranslation()
  const cases = useLcmsStore((s) => s.cases)
  const addHearing = useLcmsStore((s) => s.addHearing)
  const updateHearing = useLcmsStore((s) => s.updateHearing)
  const toast = useToast()

  const caseOptions = useMemo(
    () => cases.map((c) => ({ value: c.id, label: `${c.caseNumber} — ${c.caseTitle}` })),
    [cases]
  )

  const searchCases = useCallback(async (q: string) => {
    const results = await searchByPrefix<Case>('cases', 'searchTitle', q.toLowerCase(), 10)
    return results.map((c) => ({ value: c.id, label: `${c.caseNumber} — ${c.caseTitle}` }))
  }, [])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<HearingFormValues>({
    resolver: zodResolver(hearingSchema),
    defaultValues: emptyValues(caseId)
  })

  useEffect(() => {
    if (!open) return
    reset(
      hearing
        ? {
            caseId: hearing.caseId,
            date: toInputDate(hearing.date),
            time: hearing.time,
            courtBranch: hearing.courtBranch,
            hearingType: hearing.hearingType,
            status: hearing.status,
            notes: hearing.notes ?? ''
          }
        : emptyValues(caseId)
    )
  }, [open, hearing, caseId, reset])

  const onSubmit = async (data: HearingFormValues) => {
    const payload = { ...data, notes: data.notes ?? '' }
    try {
      if (hearing) {
        await updateHearing(hearing.id, payload)
      } else {
        await addHearing(payload)
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
      title={hearing ? t('hearings.editHearing') : t('hearings.addHearing')}
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
        {!caseId && (
          <FormField label={t('hearings.case')} required error={errors.caseId?.message}>
            <Controller
              control={control}
              name="caseId"
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={caseOptions}
                  onSearch={searchCases}
                  placeholder={t('hearings.case')}
                  searchPlaceholder={t('hearings.case')}
                  error={!!errors.caseId}
                />
              )}
            />
          </FormField>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label={t('hearings.date')} required error={errors.date?.message}>
            <FieldInput type="date" {...register('date')} error={!!errors.date} />
          </FormField>
          <FormField label={t('hearings.time')} required error={errors.time?.message}>
            <FieldInput type="time" {...register('time')} error={!!errors.time} />
          </FormField>
        </div>
        <FormField label={t('hearings.courtBranch')} required error={errors.courtBranch?.message}>
          <FieldInput {...register('courtBranch')} error={!!errors.courtBranch} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label={t('hearings.hearingType')} required>
            <Controller
              control={control}
              name="hearingType"
              render={({ field }) => <FieldSelect {...field} options={hearingTypeOptions} />}
            />
          </FormField>
          <FormField label={t('hearings.status')} required>
            <Controller
              control={control}
              name="status"
              render={({ field }) => <FieldSelect {...field} options={hearingStatusOptions} />}
            />
          </FormField>
        </div>
        <FormField label={t('hearings.notes')}>
          <FieldTextArea {...register('notes')} rows={3} />
        </FormField>
      </form>
    </Modal>
  )
}
