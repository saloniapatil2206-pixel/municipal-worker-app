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
  const { data, error } = await supabase
    .from('task_assignments')
    .select('task:tasks(*)')
    .eq('worker_id', workerId)
  if (error) throw new Error(error.message)
  return (data?.map((d: any) => d.task).filter(Boolean) || []) as Task[]
}

export async function fetchTaskById(taskId: string, workerId: string): Promise<TaskDetail> {
  if (isMock()) {
    const task = MOCK_TASKS.find(t => t.id === taskId)
    if (!task) throw new Error('Task not found')
    return {
      ...task,
      updates: MOCK_TASK_UPDATES[taskId] || [],
      photos: []
    }
  }
  const { supabase } = await import('@/lib/supabase')
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()
  if (error) throw new Error(error.message)
  const { data: updates } = await supabase
    .from('task_updates')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  const { data: photos } = await supabase
    .from('task_photos')
    .select('*')
    .eq('task_id', taskId)
  return { ...data, updates: updates || [], photos: photos || [] }
}

export async function acceptTask(taskId: string, workerId: string) {
  if (isMock()) {
    const task = MOCK_TASKS.find(t => t.id === taskId)
    if (task) task.status = 'accepted'
    return task
  }
  const { supabase } = await import('@/lib/supabase')
  await supabase.from('tasks').update({ status: 'accepted' }).eq('id', taskId)
  await supabase.from('task_assignments').update({ accepted_at: new Date().toISOString() }).eq('task_id', taskId).eq('worker_id', workerId)
  await supabase.from('task_updates').insert({ task_id: taskId, worker_id: workerId, status: 'accepted', note: 'Task accepted', created_at: new Date().toISOString() })
}

export async function startTask(taskId: string, workerId: string) {
  if (isMock()) {
    const task = MOCK_TASKS.find(t => t.id === taskId)
    if (task) task.status = 'in_progress'
    return task
  }
  const { supabase } = await import('@/lib/supabase')
  await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', taskId)
  await supabase.from('task_updates').insert({ task_id: taskId, worker_id: workerId, status: 'in_progress', note: 'Task started', created_at: new Date().toISOString() })
}

export async function updateTaskStatus(taskId: string, workerId: string, status: TaskStatus, note?: string) {
  if (isMock()) {
    const task = MOCK_TASKS.find(t => t.id === taskId)
    if (task) task.status = status
    return task
  }
  const { supabase } = await import('@/lib/supabase')
  await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId)
  await supabase.from('task_updates').insert({ task_id: taskId, worker_id: workerId, status, note: note || null, created_at: new Date().toISOString() })
}

export async function completeTask(taskId: string, workerId: string, note?: string) {
  if (isMock()) {
    const task = MOCK_TASKS.find(t => t.id === taskId)
    if (task) task.status = 'completed'
    return task
  }
  const { supabase } = await import('@/lib/supabase')
  const { data: photos } = await supabase
    .from('task_photos')
    .select('id')
    .eq('task_id', taskId)
    .eq('photo_type', 'after')
  if (!photos || photos.length === 0) {
    throw new Error('Please upload an after photo before completing the task')
  }
  await supabase.from('tasks').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', taskId)
  await supabase.from('task_updates').insert({ task_id: taskId, worker_id: workerId, status: 'completed', note: note || 'Task completed', created_at: new Date().toISOString() })
}

export async function addWorkNote(taskId: string, workerId: string, note: string) {
  if (isMock()) {
    const updates = MOCK_TASK_UPDATES[taskId] || []
    updates.push({
      id: `upd-${Date.now()}`,
      task_id: taskId,
      worker_id: workerId,
      status: null,
      note,
      created_at: new Date().toISOString()
    })
    MOCK_TASK_UPDATES[taskId] = updates
    return { success: true }
  }
  const { supabase } = await import('@/lib/supabase')
  const { error } = await supabase
    .from('task_updates')
    .insert({
      task_id: taskId,
      worker_id: workerId,
      status: null,
      note,
      created_at: new Date().toISOString()
    })
  if (error) throw new Error(error.message)
}