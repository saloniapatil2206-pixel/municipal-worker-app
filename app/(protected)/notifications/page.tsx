'use client'
import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationItem from '@/components/NotificationItem'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { isToday, parseISO } from 'date-fns'

export default function NotificationsPage() {
  const { session } = useAuth()
  const { notifications, unreadCount, loading, markRead, markAllNotificationsRead } = useNotifications(session?.user?.id)

  const todayNotifs = notifications.filter((n) => isToday(parseISO(n.created_at)))
  const earlierNotifs = notifications.filter((n) => !isToday(parseISO(n.created_at)))

  return (
    <div className="py-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-xs font-semibold text-[#0F4C81] bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors"
          >
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} message="No notifications yet" subText="You'll see task updates and alerts here" />
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl mx-4 overflow-hidden">
          {todayNotifs.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Today</p>
              </div>
              {todayNotifs.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markRead} />
              ))}
            </>
          )}
          {earlierNotifs.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Earlier</p>
              </div>
              {earlierNotifs.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markRead} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
