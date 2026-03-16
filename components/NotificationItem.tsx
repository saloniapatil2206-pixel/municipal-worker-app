import { Bell, AlertTriangle, Clock, CheckCircle2, FileText, Info } from 'lucide-react'
import { formatTimeAgo } from '@/utils/formatDate'
import type { Notification } from '@/types'
import clsx from 'clsx'

const typeConfig = {
  new_task: { icon: Bell, bg: 'bg-blue-100', color: 'text-blue-600' },
  due_soon: { icon: Clock, bg: 'bg-amber-100', color: 'text-amber-600' },
  overdue: { icon: AlertTriangle, bg: 'bg-red-100', color: 'text-red-600' },
  admin_note: { icon: Info, bg: 'bg-indigo-100', color: 'text-indigo-600' },
  task_closure: { icon: CheckCircle2, bg: 'bg-green-100', color: 'text-green-600' },
}

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
}

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  return (
    <button
      onClick={() => !notification.is_read && onRead(notification.id)}
      className={clsx(
        'w-full text-left flex items-start gap-3 p-4 border-b border-gray-100 transition-colors',
        notification.is_read ? 'bg-white' : 'bg-blue-50/50'
      )}
    >
      <div className={clsx('w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center', config.bg)}>
        <Icon size={18} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={clsx('text-sm font-semibold', notification.is_read ? 'text-gray-700' : 'text-gray-900')}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="w-2 h-2 bg-[#0F4C81] rounded-full flex-shrink-0 mt-1.5" />
          )}
        </div>
        {notification.body && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-1">{formatTimeAgo(notification.created_at)}</p>
      </div>
    </button>
  )
}
