import type { TaskStatus, TaskPriority } from '@/types'

export const statusBadgeClasses: Record<TaskStatus, string> = {
  assigned: 'bg-blue-100 text-blue-800',
  accepted: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  delayed: 'bg-red-100 text-red-800',
}

export const statusLabels: Record<TaskStatus, string> = {
  assigned: 'Assigned',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  delayed: 'Delayed',
}

export const priorityBadgeClasses: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export const priorityDotClasses: Record<TaskPriority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-500',
  critical: 'bg-red-600',
}
