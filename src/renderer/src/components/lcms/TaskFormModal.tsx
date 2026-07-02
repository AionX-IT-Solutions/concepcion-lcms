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
import { TASK_PRIORITIES, TASK_STATUSES, type Case, type Task } from '../../types/lcms.types'

const taskSchema = z.object({
  title: z.string().min(1, 'Required'),
  caseId: z.string().optional(),
  dueDate: z.string().min(1, 'Required'),
  status: z.enum(['Pending', 'In Progress', 'Done']),
  priority: z.enum(['Low', 'Medium', 'High']),
  notes: z.string().optional()
})

type TaskFormValues = z.infer<typeof taskSchema>

interface TaskFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task
}

const statusOptions = TASK_STATUSES.map((v) => ({ value: v, label: v }))
const priorityOptions = TASK_PRIORITIES.map((v) => ({ value: v, label: v }))

const emptyValues: TaskFormValues = {
  title: '',
  caseId: '',
  dueDate: '',
  status: 'Pending',
  priority: 'Medium',
  notes: ''
}

export function TaskFormModal({ open, onOpenChange, task }: TaskFormModalProps) {
  const { t } = useTranslation()
  const cases = useLcmsStore((s) => s.cases)
  const addTask = useLcmsStore((s) => s.addTask)
  const updateTask = useLcmsStore((s) => s.updateTask)
  const toast = useToast()

  const caseOptions = useMemo(
    () => [
      { value: '', label: t('tasks.none') },
      ...cases.map((c) => ({ value: c.id, label: `${c.caseNumber} — ${c.caseTitle}` }))
    ],
    [cases, t]
  )

  const searchCases = useCallback(
    async (q: string) => {
      const results = await searchByPrefix<Case>('cases', 'searchTitle', q.toLowerCase(), 10)
      const mapped = results.map((c) => ({ value: c.id, label: `${c.caseNumber} — ${c.caseTitle}` }))
      return [{ value: '', label: t('tasks.none') }, ...mapped]
    },
    [t]
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      task
        ? {
            title: task.title,
            caseId: task.caseId ?? '',
            dueDate: toInputDate(task.dueDate),
            status: task.status,
            priority: task.priority,
            notes: task.notes ?? ''
          }
        : emptyValues
    )
  }, [open, task, reset])

  const onSubmit = async (data: TaskFormValues) => {
    const payload = {
      ...data,
      caseId: data.caseId || undefined,
      notes: data.notes ?? ''
    }
    try {
      if (task) {
        await updateTask(task.id, payload)
      } else {
        await addTask(payload)
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
      title={task ? t('tasks.editTask') : t('tasks.addTask')}
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
        <FormField label={t('tasks.taskTitle')} required error={errors.title?.message}>
          <FieldInput {...register('title')} error={!!errors.title} />
        </FormField>
        <FormField label={t('tasks.relatedCase')}>
          <Controller
            control={control}
            name="caseId"
            render={({ field }) => (
              <SearchableSelect
                value={field.value ?? ''}
                onChange={field.onChange}
                options={caseOptions}
                onSearch={searchCases}
                placeholder={t('tasks.none')}
                searchPlaceholder={t('tasks.relatedCase')}
              />
            )}
          />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <FormField label={t('tasks.dueDate')} required error={errors.dueDate?.message}>
            <FieldInput type="date" {...register('dueDate')} error={!!errors.dueDate} />
          </FormField>
          <FormField label={t('tasks.status')} required>
            <Controller
              control={control}
              name="status"
              render={({ field }) => <FieldSelect {...field} options={statusOptions} />}
            />
          </FormField>
          <FormField label={t('tasks.priority')} required>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => <FieldSelect {...field} options={priorityOptions} />}
            />
          </FormField>
        </div>
        <FormField label={t('tasks.notes')}>
          <FieldTextArea {...register('notes')} rows={3} />
        </FormField>
      </form>
    </Modal>
  )
}
