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
      total_under_review: MOCK_TASKS.filter(t => ['pending_review', 'resolved', 'done'].includes(t.status)).length,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed_this_week: completedThisWeek,
      completed_this_month: completedThisMonth,
      recent_completed: MOCK_TASKS.filter(t => ['completed', 'approved', 'closed'].includes(t.status)).slice(0, 5),
      recent_delayed: MOCK_TASKS.filter(t => t.status === 'delayed').slice(0, 5),
      recent_under_review: MOCK_TASKS.filter(t => ['pending_review', 'resolved', 'done'].includes(t.status)).slice(0, 5),
      all_tasks: MOCK_TASKS
    }
  }

  // Real data using unified fetch
  const { fetchAssignedTasks } = await import('./task.service')
  
  if (!workerId) throw new Error('Invalid worker ID')

  const tasks = await fetchAssignedTasks(workerId)
  
  const total = tasks.length
  const completedStatus = ['completed', 'approved', 'closed']
  const completed = tasks.filter((t: any) => completedStatus.includes(t.status)).length
  const delayed = tasks.filter((t: any) => t.status === 'delayed').length
  const pending = tasks.filter((t: any) =>
    ['assigned', 'accepted', 'in_progress', 'open', 'pending'].includes(t.status)
  ).length

  const underReviewStatus = ['pending_review', 'resolved', 'done']

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const completedTasks = tasks.filter((t: any) => completedStatus.includes(t.status))

  return {
    total_assigned: total,
    total_completed: completed,
    total_pending: pending,
    total_delayed: delayed,
    total_under_review: tasks.filter((t: any) => underReviewStatus.includes(t.status)).length,
    completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    completed_this_week: completedTasks.filter((t: any) =>
      new Date(t.updated_at || t.created_at) >= weekStart
    ).length,
    completed_this_month: completedTasks.filter((t: any) =>
      new Date(t.updated_at || t.created_at) >= monthStart
    ).length,
    recent_completed: completedTasks
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5),
    recent_delayed: tasks
      .filter((t: any) => t.status === 'delayed')
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5),
    recent_under_review: tasks
      .filter((t: any) => underReviewStatus.includes(t.status))
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5),
    all_tasks: tasks
  }
}