import { supabase } from '@/lib/supabase'
import { isMockMode } from '@/lib/mock-auth'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import type { Notification } from '@/types'

export async function fetchNotifications(workerId: string): Promise<Notification[]> {
  if (isMockMode()) return [...MOCK_NOTIFICATIONS]
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (isMockMode()) {
    const n = MOCK_NOTIFICATIONS.find(x => x.id === notificationId)
    if (n) n.is_read = true
    return
  }
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw new Error(error.message)
}

export async function markAllRead(workerId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('worker_id', workerId)
    .eq('is_read', false)

  if (error) throw new Error(error.message)
}

export async function getUnreadCount(workerId: string): Promise<number> {
  if (isMockMode()) {
    return MOCK_NOTIFICATIONS.filter(n => !n.is_read).length
  }
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('worker_id', workerId)
    .eq('is_read', false)

  if (error) throw new Error(error.message)
  return count || 0
}
