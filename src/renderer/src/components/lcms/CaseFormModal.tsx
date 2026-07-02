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
import { searchByPrefix } from '../../lib/firestore-sync'
import { getFullName } from '../../lib/utils'
import { CASE_STATUSES, type Case, type Client } from '../../types/lcms.types'

const caseSchema = z.object({
  clientId: z.string().min(1, 'Required'),
  caStation: z.string().min(1, 'Required'),
  caseNumber: z.string().min(1, 'Required'),
  status: z.enum(['WITH DECISION / RESOLUTION', 'PENDING', 'ON APPEAL', 'DISMISSED', 'CLOSED']),
  caseTitle: z.string().min(1, 'Required'),
  partiesInvolved: z.string().min(1, 'Required'),
  rulingOnLegalIssue: z.string().optional(),
  clientNarrative: z.string().optional()
})

type CaseFormValues = z.infer<typeof caseSchema>

interface CaseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, locks the case to this client (used inside a client's detail page) */
  clientId?: string
  caseData?: Case
}

const statusOptions = CASE_STATUSES.map((v) => ({ value: v, label: v }))

const emptyValues = (clientId?: string): CaseFormValues => ({
  clientId: clientId ?? '',
  caStation: '',
  caseNumber: '',
  status: 'PENDING',
  caseTitle: '',
  partiesInvolved: '',
  rulingOnLegalIssue: '',
  clientNarrative: ''
})

export function CaseFormModal({ open, onOpenChange, clientId, caseData }: CaseFormModalProps) {
  const { t } = useTranslation()
  const clients = useLcmsStore((s) => s.clients)
  const addCase = useLcmsStore((s) => s.addCase)
  const updateCase = useLcmsStore((s) => s.updateCase)
  const toast = useToast()

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: c.id,
        label: getFullName(c.firstName, c.middleName ?? '', c.lastName)
      })),
    [clients]
  )

  const searchClients = useCallback(async (q: string) => {
    const results = await searchByPrefix<Client>('clients', 'searchName', q.toLowerCase(), 10)
    return results.map((c) => ({
      value: c.id,
      label: getFullName(c.firstName, c.middleName ?? '', c.lastName)
    }))
  }, [])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: emptyValues(clientId)
  })

  useEffect(() => {
    if (!open) return
    reset(
      caseData
        ? {
            clientId: caseData.clientId,
            caStation: caseData.caStation,
            caseNumber: caseData.caseNumber,
            status: caseData.status,
            caseTitle: caseData.caseTitle,
            partiesInvolved: caseData.partiesInvolved,
            rulingOnLegalIssue: caseData.rulingOnLegalIssue,
            clientNarrative: caseData.clientNarrative
          }
        : emptyValues(clientId)
    )
  }, [open, caseData, clientId, reset])

  const onSubmit = async (data: CaseFormValues) => {
    const payload = {
      ...data,
      rulingOnLegalIssue: data.rulingOnLegalIssue ?? '',
      clientNarrative: data.clientNarrative ?? ''
    }
    try {
      if (caseData) {
        await updateCase(caseData.id, payload)
      } else {
        await addCase(payload)
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
      title={caseData ? t('cases.editCase') : t('cases.addCase')}
      size="lg"
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
        {!clientId && (
          <FormField label={t('globalCases.client')} required error={errors.clientId?.message}>
            <Controller
              control={control}
              name="clientId"
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={clientOptions}
                  onSearch={searchClients}
                  placeholder={t('globalCases.client')}
                  searchPlaceholder={t('globalCases.client')}
                  error={!!errors.clientId}
                />
              )}
            />
          </FormField>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <FormField label={t('cases.caStation')} required error={errors.caStation?.message}>
            <FieldInput {...register('caStation')} error={!!errors.caStation} />
          </FormField>
          <FormField label={t('cases.caseNumber')} required error={errors.caseNumber?.message}>
            <FieldInput {...register('caseNumber')} error={!!errors.caseNumber} />
          </FormField>
          <FormField label={t('cases.status')} required>
            <Controller
              control={control}
              name="status"
              render={({ field }) => <FieldSelect {...field} options={statusOptions} />}
            />
          </FormField>
        </div>
        <FormField label={t('cases.caseTitle')} required error={errors.caseTitle?.message}>
          <FieldInput {...register('caseTitle')} error={!!errors.caseTitle} />
        </FormField>
        <FormField
          label={t('cases.partiesInvolved')}
          required
          error={errors.partiesInvolved?.message}
        >
          <FieldInput {...register('partiesInvolved')} error={!!errors.partiesInvolved} />
        </FormField>
        <FormField label={t('cases.rulingOnLegalIssue')}>
          <FieldTextArea {...register('rulingOnLegalIssue')} rows={4} />
        </FormField>
        <FormField label={t('cases.clientNarrative')}>
          <FieldTextArea {...register('clientNarrative')} rows={4} />
        </FormField>
      </form>
    </Modal>
  )
}
