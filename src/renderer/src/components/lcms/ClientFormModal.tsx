import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { FormField, FieldInput, FieldSelect } from '../ui/FormField'
import { FileDropzone } from './FileDropzone'
import { useLcmsStore } from '../../store/lcms.store'
import { useToast } from '../../hooks/useToast'
import { toInputDate } from '../../lib/utils'
import { uploadFile, deleteFileRef } from '../../lib/storage'
import type { Client, MockFileRef } from '../../types/lcms.types'

const clientSchema = z
  .object({
    lastName: z.string().min(1, 'Required'),
    firstName: z.string().min(1, 'Required'),
    middleName: z.string().optional(),
    dateOfBirth: z.string().min(1, 'Required'),
    civilStatus: z.enum(['Single', 'Married', 'Widowed', 'Separated', 'Divorced']),
    spouseName: z.string().optional(),
    occupation: z.string().min(1, 'Required'),
    completeAddress: z.string().min(1, 'Required'),
    contactNumber: z.string().min(1, 'Required'),
    emailAddress: z.string().email('Invalid email'),
    validIdType: z.string().min(1, 'Required')
  })
  .refine((d) => d.civilStatus !== 'Married' || !!d.spouseName?.trim(), {
    message: 'Spouse name is required when civil status is Married',
    path: ['spouseName']
  })

type ClientFormValues = z.infer<typeof clientSchema>

interface ClientFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client
}

const civilStatusOptions = ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'].map((v) => ({
  value: v,
  label: v
}))

export function ClientFormModal({ open, onOpenChange, client }: ClientFormModalProps) {
  const { t } = useTranslation()
  const addClient = useLcmsStore((s) => s.addClient)
  const updateClient = useLcmsStore((s) => s.updateClient)
  const toast = useToast()
  const [idFile, setIdFile] = useState<MockFileRef | undefined>(undefined)
  const [originalIdFile, setOriginalIdFile] = useState<MockFileRef | undefined>(undefined)
  const [uploadingId, setUploadingId] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      middleName: '',
      dateOfBirth: '',
      civilStatus: 'Single',
      spouseName: '',
      occupation: '',
      completeAddress: '',
      contactNumber: '',
      emailAddress: '',
      validIdType: ''
    }
  })

  useEffect(() => {
    if (!open) return
    setIdFile(client?.validIdReference)
    setOriginalIdFile(client?.validIdReference)
    if (client) {
      reset({
        lastName: client.lastName,
        firstName: client.firstName,
        middleName: client.middleName ?? '',
        dateOfBirth: toInputDate(client.dateOfBirth),
        civilStatus: client.civilStatus,
        spouseName: client.spouseName ?? '',
        occupation: client.occupation,
        completeAddress: client.completeAddress,
        contactNumber: client.contactNumber,
        emailAddress: client.emailAddress,
        validIdType: client.validIdType
      })
    } else {
      reset({
        lastName: '',
        firstName: '',
        middleName: '',
        dateOfBirth: '',
        civilStatus: 'Single',
        spouseName: '',
        occupation: '',
        completeAddress: '',
        contactNumber: '',
        emailAddress: '',
        validIdType: ''
      })
    }
  }, [open, client, reset])

  const civilStatus = watch('civilStatus')

  const onSubmit = async (data: ClientFormValues) => {
    try {
      if (client) {
        await updateClient(client.id, { ...data, validIdReference: idFile })
      } else {
        await addClient({ ...data, validIdReference: idFile })
      }
      if (originalIdFile?.storagePath && originalIdFile.storagePath !== idFile?.storagePath) {
        await deleteFileRef(originalIdFile)
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
      title={client ? t('clients.editClient') : t('clients.addClient')}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={uploadingId}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14
        }}
      >
        <FormField label={t('clients.lastName')} required error={errors.lastName?.message}>
          <FieldInput {...register('lastName')} error={!!errors.lastName} />
        </FormField>
        <FormField label={t('clients.firstName')} required error={errors.firstName?.message}>
          <FieldInput {...register('firstName')} error={!!errors.firstName} />
        </FormField>
        <FormField label={t('clients.middleName')}>
          <FieldInput {...register('middleName')} />
        </FormField>
        <FormField label={t('clients.dateOfBirth')} required error={errors.dateOfBirth?.message}>
          <FieldInput type="date" {...register('dateOfBirth')} error={!!errors.dateOfBirth} />
        </FormField>
        <FormField label={t('clients.civilStatus')} required>
          <Controller
            control={control}
            name="civilStatus"
            render={({ field }) => <FieldSelect {...field} options={civilStatusOptions} />}
          />
        </FormField>
        <FormField
          label={t('clients.spouseName')}
          required={civilStatus === 'Married'}
          error={errors.spouseName?.message}
        >
          <FieldInput {...register('spouseName')} error={!!errors.spouseName} />
        </FormField>
        <FormField label={t('clients.occupation')} required error={errors.occupation?.message}>
          <FieldInput {...register('occupation')} error={!!errors.occupation} />
        </FormField>
        <FormField
          label={t('clients.contactNumber')}
          required
          error={errors.contactNumber?.message}
        >
          <FieldInput {...register('contactNumber')} error={!!errors.contactNumber} />
        </FormField>
        <FormField label={t('clients.emailAddress')} required error={errors.emailAddress?.message}>
          <FieldInput type="email" {...register('emailAddress')} error={!!errors.emailAddress} />
        </FormField>
        <FormField label={t('clients.validIdType')} required error={errors.validIdType?.message}>
          <FieldInput
            {...register('validIdType')}
            error={!!errors.validIdType}
            placeholder="e.g. Driver's License"
          />
        </FormField>
        <FormField
          label={t('clients.completeAddress')}
          required
          error={errors.completeAddress?.message}
          className="col-span-2"
        >
          <FieldInput {...register('completeAddress')} error={!!errors.completeAddress} />
        </FormField>
        <div style={{ gridColumn: '1 / -1' }}>
          <FormField label={`${t('clients.validIdType')} — ${t('caseDevelopment.uploadFile')}`}>
            <FileDropzone
              value={idFile}
              uploading={uploadingId}
              onSelect={async (file) => {
                setUploadingId(true)
                try {
                  setIdFile(await uploadFile('clients/valid-ids', file))
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
                } finally {
                  setUploadingId(false)
                }
              }}
              onClear={() => setIdFile(undefined)}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
