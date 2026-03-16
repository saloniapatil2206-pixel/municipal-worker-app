import { MOCK_TASKS, MOCK_WORKER } from '@/lib/mock-data'
import { WorkerReport } from '@/types'

const isMock = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export async function fetchWorkerReport(workerId: string): Promise<WorkerReport> {
  if (isMock()) {
    const total = MOCK_TASKS.length
    const completed = MOCK_TASKS.filter(t => t.status === 'completed').length
    const delayed = MOCK_TASKS.filter(t => t.status === 'delayed').length
    const pending = MOCK_TASKS.filter(t =>
      ['assigned', 'accepted', 'in_progress'].includes(t.status)
    ).length

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const completedTasks = MOCK_TASKS.filter(t => t.status === 'completed')

    const completedThisWeek = completedTasks.filter(t =>
      new Date(t.updated_at) >= weekStart
    ).length

    const completedThisMonth = completedTasks.filter(t =>
      new Date(t.updated_at) >= monthStart
    ).length

    return {
      total_assigned: total,
      total_completed: completed,
      total_pending: pending,
      total_delayed: delayed,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed_this_week: completedThisWeek,
      completed_this_month: completedThisMonth,
      recent_completed: MOCK_TASKS.filter(t => t.status === 'completed').map(t => ({
        id: `assign-${t.id}`,
        task_id: t.id,
        worker_id: workerId,
        assigned_at: t.created_at,
        accepted_at: t.created_at,
        task: t
      })),
      recent_delayed: MOCK_TASKS.filter(t => t.status === 'delayed').map(t => ({
        id: `assign-${t.id}`,
        task_id: t.id,
        worker_id: workerId,
        assigned_at: t.created_at,
        accepted_at: null,
        task: t
      }))
    }
  }

  // Real Supabase query
  const { supabase } = await import('@/lib/supabase')
  const { data: assignments, error } = await supabase
    .from('task_assignments')
    .select('*, task:tasks(*)')
    .eq('worker_id', workerId)
  if (error) throw new Error(error.message)

  const tasks = assignments?.map((a: any) => a.task).filter(Boolean) || []
  const total = tasks.length
  const completed = tasks.filter((t: any) => t.status === 'completed').length
  const delayed = tasks.filter((t: any) => t.status === 'delayed').length
  const pending = tasks.filter((t: any) =>
    ['assigned', 'accepted', 'in_progress'].includes(t.status)
  ).length

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    total_assigned: total,
    total_completed: completed,
    total_pending: pending,
    total_delayed: delayed,
    completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    completed_this_week: tasks.filter((t: any) =>
      t.status === 'completed' && new Date(t.updated_at) >= weekStart
    ).length,
    completed_this_month: tasks.filter((t: any) =>
      t.status === 'completed' && new Date(t.updated_at) >= monthStart
    ).length,
    recent_completed: assignments?.filter((a: any) => a.task?.status === 'completed').slice(0, 5) || [],
    recent_delayed: assignments?.filter((a: any) => a.task?.status === 'delayed').slice(0, 5) || []
  }
}