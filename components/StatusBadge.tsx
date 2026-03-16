import { statusBadgeClasses, statusLabels } from '@/utils/statusColors'
import type { TaskStatus } from '@/types'
import clsx from 'clsx'

interface StatusBadgeProps {
  status: TaskStatus
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        statusBadgeClasses[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
