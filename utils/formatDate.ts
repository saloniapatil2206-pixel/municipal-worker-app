import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'No date'
  const date = parseISO(dateStr)
  return format(date, 'MMM d, yyyy')
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'No date'
  const date = parseISO(dateStr)
  return format(date, 'MMM d, yyyy h:mm a')
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = parseISO(dateStr)
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`
  if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatDueDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'No due date'
  const date = parseISO(dateStr)
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`
  return format(date, 'EEE, MMM d, yyyy h:mm a')
}

export function isOverdue(dateStr: string | null | undefined, status: string): boolean {
  if (!dateStr || status === 'completed') return false
  return new Date(dateStr) < new Date()
}

export function formatTimeAgo(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
}

export function toDateKey(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy-MM-dd')
}
