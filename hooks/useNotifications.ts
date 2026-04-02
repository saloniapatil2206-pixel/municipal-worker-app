'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  fetchNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
} from '@/services/notification.service'
import type { Notification } from '@/types'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  refetch: () => void
}

export function useNotifications(workerId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workerId) { setLoading(false); return }
    setLoading(true)
    try {
      const [notifs, count] = await Promise.all([
        fetchNotifications(workerId),
        getUnreadCount(workerId),
      ])
      setNotifications(notifs)
      setUnreadCount(count)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [workerId])

  useEffect(() => { load() }, [load])

  const markRead = async (id: string) => {
    await markNotificationRead(id, workerId)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const markAllNotificationsRead = async () => {
    if (!workerId) return
    await markAllRead(workerId)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, loading, markRead, markAllNotificationsRead, refetch: load }
}
