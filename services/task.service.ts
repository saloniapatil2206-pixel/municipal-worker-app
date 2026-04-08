import { MOCK_TASKS, MOCK_TASK_UPDATES } from '@/lib/mock-data'
import { Task, TaskStatus, TaskPriority } from '@/types'

const isMock = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export type TaskDetail = Task & {
  updates: {
    id: string
    task_id: string
    worker_id: string
    status: TaskStatus | null
    note: string | null
    created_at: string
  }[]
  photos: {
    id: string
    task_id: string
    worker_id: string
    photo_url: string
    photo_type: 'before' | 'after'
    caption: string | null
    created_at: string
  }[]
}

export async function fetchAssignedTasks(workerId: string): Promise<Task[]> {
  if (isMock()) {
    await new Promise(r => setTimeout(r, 300))
    return MOCK_TASKS
  }
  const { supabase } = await import('@/lib/supabase')
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workerId)
  if (!isUUID) return []

  const { data: profile } = await supabase.from('profiles').select('sector, assigned_zone').eq('id', workerId).single()

  let tasksQuery = supabase.from('tasks').select('*')
  let issuesQuery = supabase.from('issues').select('*')

  const workerSector = profile?.sector || profile?.assigned_zone

  if (workerSector) {
    // Tasks: staff_id = workerId OR sector = workerSector
    tasksQuery = tasksQuery.or(`staff_id.eq.${workerId},sector.eq.${workerSector}`)
    // Issues: assigned_to = workerId OR sector = workerSector
    issuesQuery = issuesQuery.or(`assigned_to.eq.${workerId},sector.eq.${workerSector}`)
  } else {
    // Fallback if no sector: Only fetch personal explicitly assigned tasks
    tasksQuery = tasksQuery.eq('staff_id', workerId)
    issuesQuery = issuesQuery.eq('assigned_to', workerId)
  }

  const { data: tasksData, error: tasksError } = await tasksQuery
  const { data: issuesData, error: issuesError } = await issuesQuery

  if (tasksError) throw new Error(tasksError.message)
  if (issuesError) throw new Error(issuesError.message)

  const normalizedIssues = (issuesData || []).map((issue: any) => ({
    ...issue,
    title: issue.issue_type || 'Citizen Issue',
    category: issue.issue_type,
    location_address: issue.location_address || issue.address,
    staff_id: issue.assigned_to,
    due_at: issue.created_at,
    item_type: 'issue'
  }))

  const normalizedTasks = (tasksData || []).map((task: any) => ({
    ...task,
    due_at: task.due_at || task.scheduled_start || task.scheduled_date || task.created_at,
    item_type: 'task'
  }))

  return [...normalizedTasks, ...normalizedIssues] as Task[]
}

export async function fetchTaskById(taskId: string, workerId: string): Promise<TaskDetail> {
  if (isMock()) {
    // Keep mock logic as is
    const task = MOCK_TASKS.find(t => t.id === taskId)
    if (!task) throw new Error('Task not found')
    const photos: any[] = []
    if (task.before_photo_url) photos.push({ id: 'p-before', task_id: taskId, worker_id: workerId, photo_url: task.before_photo_url, photo_type: 'before', created_at: task.before_photo_taken_at || task.created_at })
    if (task.after_photo_url) photos.push({ id: 'p-after', task_id: taskId, worker_id: workerId, photo_url: task.after_photo_url, photo_type: 'after', created_at: task.after_photo_taken_at || task.updated_at })
    return { ...task, updates: MOCK_TASK_UPDATES[taskId] || [], photos }
  }
  
  const { supabase } = await import('@/lib/supabase')
  
  let { data: taskData } = await supabase.from('tasks').select('*').eq('id', taskId).single()
  let itemType = 'task'

  if (!taskData) {
    const { data: issueData, error: issueError } = await supabase.from('issues').select('*').eq('id', taskId).single()
    if (issueError || !issueData) throw new Error('Task not found')
    taskData = {
      ...issueData,
      title: issueData.issue_type || 'Citizen Issue',
      category: issueData.issue_type,
      location_address: issueData.location_address || issueData.address,
      staff_id: issueData.assigned_to,
      due_at: issueData.created_at
    }
    itemType = 'issue'
  }

  taskData.item_type = itemType

  const updates: any[] = []
  const photos: any[] = []
  if (taskData.before_photo_url) photos.push({ id: 'before', task_id: taskId, worker_id: workerId, photo_url: taskData.before_photo_url, photo_type: 'before', created_at: taskData.before_photo_taken_at || taskData.created_at })
  if (taskData.after_photo_url) photos.push({ id: 'after', task_id: taskId, worker_id: workerId, photo_url: taskData.after_photo_url, photo_type: 'after', created_at: taskData.after_photo_taken_at || taskData.updated_at })

  return { ...taskData, updates, photos }
}

async function dualUpdate(taskId: string, updates: any) {
  const { supabase } = await import('@/lib/supabase')
  const { data } = await supabase.from('tasks').select('id').eq('id', taskId).single()
  
  let targetStatus = updates.status

  if (data) {
    // === TASKS table ===
    const cleanUpdates: any = {}
    
    if (updates.before_photo_url !== undefined) cleanUpdates.before_photo_url = updates.before_photo_url
    if (updates.before_photo_metadata !== undefined) cleanUpdates.before_photo_metadata = updates.before_photo_metadata
    if (updates.before_photo_taken_at !== undefined) cleanUpdates.before_photo_taken_at = updates.before_photo_taken_at
    if (updates.after_photo_url !== undefined) cleanUpdates.after_photo_url = updates.after_photo_url
    if (updates.after_photo_metadata !== undefined) cleanUpdates.after_photo_metadata = updates.after_photo_metadata
    if (updates.after_photo_taken_at !== undefined) cleanUpdates.after_photo_taken_at = updates.after_photo_taken_at
    if (updates.resolution_notes !== undefined) cleanUpdates.resolution_notes = updates.resolution_notes
    if (updates.resolved_at !== undefined) cleanUpdates.resolved_at = updates.resolved_at
    if (updates.completed_at !== undefined) cleanUpdates.completed_at = updates.completed_at
    if (updates.completion_note !== undefined) cleanUpdates.completion_note = updates.completion_note
    if (updates.updated_at !== undefined) cleanUpdates.updated_at = updates.updated_at
    
    if (['completed', 'resolved', 'done'].includes(targetStatus)) targetStatus = 'done'
    if (targetStatus) cleanUpdates.status = targetStatus
    
    const res = await supabase.from('tasks').update(cleanUpdates).eq('id', taskId)
    if (res.error) throw new Error(res.error.message)
    return res
  } else {
    // === ISSUES table ===
    const issueUpdates: any = {}
    
    if (updates.before_photo_url !== undefined) issueUpdates.before_photo_url = updates.before_photo_url
    if (updates.after_photo_url !== undefined) issueUpdates.after_photo_url = updates.after_photo_url
    if (updates.resolved_at !== undefined) issueUpdates.resolved_at = updates.resolved_at
    if (updates.updated_at !== undefined) issueUpdates.updated_at = updates.updated_at
    
    if (['completed', 'done', 'resolved'].includes(targetStatus)) targetStatus = 'resolved'
    if (targetStatus) issueUpdates.status = targetStatus

    const res = await supabase.from('issues').update(issueUpdates).eq('id', taskId)
    if (res.error) throw new Error(res.error.message)
    return res
  }
}

export async function acceptTask(taskId: string, workerId: string) {
  if (isMock()) return
  await dualUpdate(taskId, { status: 'accepted' })
}

export async function startTask(taskId: string, workerId: string) {
  if (isMock()) return
  await dualUpdate(taskId, { status: 'in_progress' })
}

export async function updateTaskStatus(taskId: string, workerId: string, status: TaskStatus, note?: string) {
  if (isMock()) return
  await dualUpdate(taskId, { status, updated_at: new Date().toISOString() })
}

export async function completeTask(taskId: string, workerId: string, note?: string) {
  if (isMock()) return
  // We'll let workerService.completeTaskWithPhotos handle actual photo requirements and final completion state
  await dualUpdate(taskId, { status: 'completed', updated_at: new Date().toISOString() })
}

export async function addWorkNote(taskId: string, workerId: string, note: string) {
  return { success: true }
}