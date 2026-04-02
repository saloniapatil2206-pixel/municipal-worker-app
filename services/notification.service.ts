import { supabase } from '@/lib/supabase'
import { isMockMode } from '@/lib/mock-auth'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import type { Notification } from '@/types'

export async function fetchNotifications(workerId: string): Promise<any[]> {
  if (isMockMode()) return [...MOCK_NOTIFICATIONS]
  
  const { data: profile } = await supabase.from('profiles').select('sector, assigned_zone').eq('id', workerId).single()
  const workerSector = profile?.sector || profile?.assigned_zone

  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false })
  
  if (workerSector) {
    query = query.or(`target.eq.all,and(target.eq.sector,sector.eq.${workerSector})`)
  } else {
    query = query.eq('target', 'all')
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Map correctly and inject is_read
  return (data || []).map((n) => ({
    ...n,
    is_read: n.read_by ? n.read_by.includes(workerId) : false,
    body: n.message // Map message to body for backward compatibility
  }))
}

export async function markNotificationRead(notificationId: string, workerId: string): Promise<void> {
  if (isMockMode()) {
    const n = MOCK_NOTIFICATIONS.find(x => x.id === notificationId)
    if (n) n.is_read = true
    return
  }
  
  // We need to append the workerId to the read_by array
  // In Supabase SQL we could array_append, but here we fetch, append, and update for simplicity
  const { data } = await supabase.from('notifications').select('read_by').eq('id', notificationId).single()
  const readBy = data?.read_by || []
  if (!readBy.includes(workerId)) {
    readBy.push(workerId)
    const { error } = await supabase.from('notifications').update({ read_by: readBy }).eq('id', notificationId)
    if (error) throw new Error(error.message)
  }
}

export async function markAllRead(workerId: string): Promise<void> {
  // To avoid complex mass array appending across multiple rows, we fetch unread and update them
  const all = await fetchNotifications(workerId)
  const unreads = all.filter(n => !n.is_read)
  
  for (const n of unreads) {
    await markNotificationRead(n.id, workerId)
  }
}

export async function getUnreadCount(workerId: string): Promise<number> {
  if (isMockMode()) {
    return MOCK_NOTIFICATIONS.filter(n => !n.is_read).length
  }
  
  const notifications = await fetchNotifications(workerId)
  return notifications.filter(n => !n.is_read).length
}
