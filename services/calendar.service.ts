import { MOCK_TASKS } from '@/lib/mock-data'
import { Task } from '@/types'
import { fetchAssignedTasks } from './task.service'

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

  // Real data using unified fetch
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workerId)
  if (!isUUID) return {}
  
  const allTasks = await fetchAssignedTasks(workerId)

  const grouped: { [date: string]: Task[] } = {}
  
  allTasks.forEach((task: any) => {
    const rawDate = task.scheduled_date || task.due_at || task.created_at
    if (!rawDate) return
    
    // Convert timestamp to YYYY-MM-DD
    const date = rawDate.split('T')[0]
    const [taskYear, taskMonth] = date.split('-').map(Number)
    
    if (taskYear === year && taskMonth === month) {
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(task)
    }
  })

  return grouped
}