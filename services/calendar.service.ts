import { MOCK_TASKS } from '@/lib/mock-data'
import { Task } from '@/types'

const isMock = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export async function fetchCalendarTasks(
  workerId: string,
  year: number,
  month: number
): Promise<{ [date: string]: Task[] }> {
  if (isMock()) {
    // Spread mock tasks across current month for demo
    const grouped: { [date: string]: Task[] } = {}
    const today = new Date()

    // Assign mock tasks to specific dates this month
    const assignments = [
      { task: MOCK_TASKS[0], day: today.getDate() },           // today
      { task: MOCK_TASKS[1], day: Math.min(today.getDate() + 1, 28) }, // tomorrow
      { task: MOCK_TASKS[2], day: Math.max(today.getDate() - 1, 1) },  // yesterday
      { task: MOCK_TASKS[3], day: Math.min(today.getDate() + 5, 28) }, // next week
      { task: MOCK_TASKS[4], day: Math.max(today.getDate() - 3, 1) },  // 3 days ago
    ]

    assignments.forEach(({ task, day }) => {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(task)
    })

    return grouped
  }

  // Real Supabase query
  const { supabase } = await import('@/lib/supabase')
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

  const { data, error } = await supabase
    .from('task_assignments')
    .select('*, task:tasks(*)')
    .eq('worker_id', workerId)
    .gte('task.due_at', startDate)
    .lte('task.due_at', endDate)

  if (error) throw new Error(error.message)

  const grouped: { [date: string]: Task[] } = {}
  data?.forEach((assignment: any) => {
    if (!assignment.task?.due_at) return
    const date = assignment.task.due_at.split('T')[0]
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(assignment.task)
  })

  return grouped
}