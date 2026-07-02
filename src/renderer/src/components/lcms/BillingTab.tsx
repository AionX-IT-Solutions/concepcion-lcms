import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { FormField, FieldInput } from '../ui/FormField'
import { DataTable, type Column } from '../ui/DataTable'
import { useLcmsStore } from '../../store/lcms.store'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../lib/utils'
import type { BillingFees, Payment } from '../../types/lcms.types'

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const feesSchema = z.object({
  acceptanceFee: z.coerce.number().nonnegative(),
  perAppearanceFee: z.coerce.number().nonnegative(),
  depositForCost: z.coerce.number().nonnegative(),
  successFee: z.coerce.number().nonnegative()
})

type FeesFormValues = z.infer<typeof feesSchema>

function EditFeesModal({
  open,
  onOpenChange,
  caseId,
  fees
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
  fees: BillingFees
}) {
  const { t } = useTranslation()
  const upsertBillingFees = useLcmsStore((s) => s.upsertBillingFees)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<z.input<typeof feesSchema>, unknown, FeesFormValues>({
    resolver: zodResolver(feesSchema),
    defaultValues: fees
  })

  useEffect(() => {
    if (open) reset(fees)
  }, [open, fees, reset])

  const onSubmit = async (data: FeesFormValues) => {
    try {
      await upsertBillingFees({ caseId, ...data })
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
      title={t('billing.editFees')}
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
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
      >
        <FormField label={t('billing.acceptanceFee')}>
          <FieldInput type="number" step="0.01" {...register('acceptanceFee')} />
        </FormField>
        <FormField label={t('billing.perAppearanceFee')}>
          <FieldInput type="number" step="0.01" {...register('perAppearanceFee')} />
        </FormField>
        <FormField label={t('billing.depositForCost')}>
          <FieldInput type="number" step="0.01" {...register('depositForCost')} />
        </FormField>
        <FormField label={t('billing.successFee')}>
          <FieldInput type="number" step="0.01" {...register('successFee')} />
        </FormField>
      </form>
    </Modal>
  )
}

const paymentSchema = z.object({
  date: z.string().min(1, 'Required'),
  particulars: z.string().min(1, 'Required'),
  amount: z.coerce.number().positive('Must be greater than 0')
})

type PaymentFormValues = z.infer<typeof paymentSchema>

const emptyPaymentValues = { date: '', particulars: '', amount: 0 }

function PaymentModal({
  open,
  onOpenChange,
  caseId,
  payment
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
  payment?: Payment
}) {
  const { t } = useTranslation()
  const addPayment = useLcmsStore((s) => s.addPayment)
  const updatePayment = useLcmsStore((s) => s.updatePayment)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<z.input<typeof paymentSchema>, unknown, PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: emptyPaymentValues
  })

  useEffect(() => {
    if (!open) return
    reset(
      payment
        ? { date: payment.date, particulars: payment.particulars, amount: payment.amount }
        : emptyPaymentValues
    )
  }, [open, payment, reset])

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      if (payment) {
        await updatePayment(payment.id, data)
      } else {
        await addPayment({ ...data, caseId })
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
      title={payment ? t('lcms.edit') : t('billing.addPayment')}
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
        <FormField label={t('billing.date')} required error={errors.date?.message}>
          <FieldInput type="date" {...register('date')} error={!!errors.date} />
        </FormField>
        <FormField label={t('billing.particulars')} required error={errors.particulars?.message}>
          <FieldInput {...register('particulars')} error={!!errors.particulars} />
        </FormField>
        <FormField label={t('billing.amount')} required error={errors.amount?.message}>
          <FieldInput type="number" step="0.01" {...register('amount')} error={!!errors.amount} />
        </FormField>
      </form>
    </Modal>
  )
}

function FeeStat({
  label,
  value,
  multiplier
}: {
  label: string
  value: number
  /** When set, `value` is a per-unit rate — shown as "rate × count = total". */
  multiplier?: number
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)'
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 6
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
        {formatPeso(multiplier !== undefined ? value * multiplier : value)}
      </p>
      {multiplier !== undefined && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {formatPeso(value)} × {multiplier} {multiplier === 1 ? 'hearing' : 'hearings'}
        </p>
      )}
    </div>
  )
}

export function BillingTab({ caseId }: { caseId: string }) {
  const { t } = useTranslation()
  const toast = useToast()
  const fees = useLcmsStore((s) => s.getBillingFeesByCase(caseId))
  const allPayments = useLcmsStore((s) => s.payments)
  const deletePayment = useLcmsStore((s) => s.deletePayment)
  const payments = useMemo(
    () => allPayments.filter((p) => p.caseId === caseId),
    [allPayments, caseId]
  )
  const totalPaid = useLcmsStore((s) => s.getTotalPaid(caseId))
  const agreedTotal = useLcmsStore((s) => s.getAgreedTotal(caseId))
  const completedAppearances = useLcmsStore((s) => s.getCompletedAppearances(caseId))
  const [editFeesOpen, setEditFeesOpen] = useState(false)
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)
  const [deleting, setDeleting] = useState(false)

  const balance = Math.max(0, agreedTotal - totalPaid)
  const fullyPaid = agreedTotal > 0 && balance === 0

  const onDeletePayment = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePayment(deleteTarget.id)
      toast.success(t('lcms.saved'))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lcms.saveFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Payment>[] = [
    { key: 'date', header: t('billing.date'), render: (row) => formatDate(row.date) },
    { key: 'particulars', header: t('billing.particulars') },
    {
      key: 'amount',
      header: t('billing.amount'),
      align: 'right',
      render: (row) => formatPeso(row.amount)
    },
    {
      key: 'id',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => setEditingPayment(row)}>
            {t('lcms.edit')}
          </Button>
          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => setDeleteTarget(row)}>
            {t('lcms.delete')}
          </Button>
        </div>
      )
    }
  ]

  if (!fees) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Agreed Fees — Edit button above card, no title inside */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Pencil size={13} />}
            onClick={() => setEditFeesOpen(true)}
          >
            {t('billing.editFees')}
          </Button>
        </div>
        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 16
            }}
          >
            <FeeStat label={t('billing.acceptanceFee')} value={fees.acceptanceFee} />
            <FeeStat
              label={t('billing.perAppearanceFee')}
              value={fees.perAppearanceFee}
              multiplier={completedAppearances}
            />
            <FeeStat label={t('billing.depositForCost')} value={fees.depositForCost} />
            <FeeStat label={t('billing.successFee')} value={fees.successFee} />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)'
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {t('billing.agreedTotal')}:{' '}
              <b style={{ color: 'var(--text-primary)' }}>{formatPeso(agreedTotal)}</b>
              {'  ·  '}
              {t('billing.totalPaid')}:{' '}
              <b style={{ color: 'var(--text-primary)' }}>{formatPeso(totalPaid)}</b>
              {'  ·  '}
              {t('billing.balance')}:{' '}
              <b style={{ color: 'var(--text-primary)' }}>{formatPeso(balance)}</b>
            </span>
            <Badge variant={fullyPaid ? 'success' : 'warning'} dot>
              {fullyPaid ? t('billing.fullyPaid') : t('billing.balance')}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Payments — Add Payment button above card, no title inside */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={13} />}
            onClick={() => setAddPaymentOpen(true)}
          >
            {t('billing.addPayment')}
          </Button>
        </div>
        <Card padding="0">
          <DataTable columns={columns} data={payments} emptyMessage={t('billing.noPayments')} />
        </Card>
      </div>

      <EditFeesModal
        open={editFeesOpen}
        onOpenChange={setEditFeesOpen}
        caseId={caseId}
        fees={fees}
      />
      <PaymentModal open={addPaymentOpen} onOpenChange={setAddPaymentOpen} caseId={caseId} />
      <PaymentModal
        open={!!editingPayment}
        onOpenChange={(open) => !open && setEditingPayment(undefined)}
        caseId={caseId}
        payment={editingPayment}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Payment"
        message={deleteTarget ? `Delete this payment of ${formatPeso(deleteTarget.amount)}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={onDeletePayment}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
