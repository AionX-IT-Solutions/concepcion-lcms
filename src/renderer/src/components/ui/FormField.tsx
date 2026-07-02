import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from 'react'
import { cn } from '../../lib/utils'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="label">
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>{error}</p>}
    </div>
  )
}

/* ── Input ──────────────────────────────────────────────────── */
interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function FieldInput({ className, error, ...props }: FieldInputProps) {
  return (
    <input
      className={cn(
        'input-field',
        error &&
          'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
        className
      )}
      {...props}
    />
  )
}

/* ── Select ─────────────────────────────────────────────────── */
interface FieldSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export function FieldSelect({
  options,
  placeholder,
  error,
  className,
  ...props
}: FieldSelectProps) {
  return (
    <select className={cn('input-field', error && 'border-red-500/60', className)} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/* ── TextArea ───────────────────────────────────────────────── */
interface FieldTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function FieldTextArea({ className, error, ...props }: FieldTextAreaProps) {
  return (
    <textarea
      className={cn('input-field resize-none', error && 'border-red-500/60', className)}
      rows={3}
      {...props}
    />
  )
}
