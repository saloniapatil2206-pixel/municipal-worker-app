'use client'
import Link from 'next/link'
import { MapPin, Clock, AlertCircle } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatDueDate, isOverdue } from '@/utils/formatDate'
import { priorityDotClasses, priorityBadgeClasses } from '@/utils/statusColors'
import type { Task } from '@/types'
import clsx from 'clsx'

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const overdue = isOverdue(task.due_at, task.status)

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all duration-150">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={clsx('w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5', priorityDotClasses[task.priority])} />
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{task.title}</h3>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {/* Category + Priority */}
        <div className="flex items-center gap-2 mb-3">
          {task.category && (
            <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{task.category}</span>
          )}
          <span className={clsx('text-xs rounded-full px-2 py-0.5 font-medium', priorityBadgeClasses[task.priority])}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>

        {/* Location */}
        {task.location_address && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{task.location_address}</span>
          </div>
        )}

        {/* Due date */}
        <div className={clsx('flex items-center gap-1.5 text-xs', overdue ? 'text-red-600 font-semibold' : 'text-gray-500')}>
          {overdue ? <AlertCircle size={12} className="flex-shrink-0" /> : <Clock size={12} className="flex-shrink-0" />}
          <span>{overdue ? 'OVERDUE · ' : ''}{formatDueDate(task.due_at)}</span>
        </div>
      </div>
    </Link>
  )
}
