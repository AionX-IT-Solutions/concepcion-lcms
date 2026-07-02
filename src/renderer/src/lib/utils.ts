import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function toInputDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return dateStr.trim()
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return ''
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export function getFullName(
  firstName: string,
  middleName: string,
  lastName: string,
  suffix?: string
): string {
  return [firstName, middleName, lastName, suffix].filter(Boolean).join(' ')
}

export function sortByField<T>(arr: T[], field: string, direction: 'asc' | 'desc'): T[] {
  return [...arr].sort((a, b) => {
    const av = String((a as Record<string, unknown>)[field] ?? '')
    const bv = String((b as Record<string, unknown>)[field] ?? '')
    const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
    return direction === 'desc' ? -cmp : cmp
  })
}

export function formatCurrency(amount: number): string {
  return (
    `₱${  amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  )
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const diff = Date.now() - d.getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    if (h < 24) return `${h}h ago`
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function nowDateString(): string {
  const now = new Date()
  const datePart = now.toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const timePart = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  return `${datePart} ${timePart}`
}
