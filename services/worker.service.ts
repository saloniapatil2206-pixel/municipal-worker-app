import { supabase } from '@/lib/supabase'
import { Task, TaskStatus } from '@/types'

const isMock = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export const workerService = {
  /**
   * Get all tasks assigned to the current worker that are either 'assigned', 'accepted', or 'in_progress'.
   */
  async getAssignedTasks(workerId: string): Promise<Task[]> {
    if (isMock()) {
      const { MOCK_TASKS } = await import('@/lib/mock-data')
      return MOCK_TASKS.filter(t => ['assigned', 'accepted', 'in_progress', 'delayed'].includes(t.status))
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_worker_id', workerId) // Adjusted to match user's requested column name if migration run
      .in('status', ['assigned', 'accepted', 'in_progress', 'delayed'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Task[]
  },

  /**
   * Submit the "Before Work" photo.
   * Updates task status to 'in_progress'.
   */
  /**
   * Submit the "Before Work" photo.
   * Updates task status to 'in_progress'.
   */
  async submitBeforePhoto(taskId: string, workerId: string, photoDataUrl: string, metadata: any) {
    if (isMock()) {
      const { MOCK_TASKS, MOCK_TASK_UPDATES } = await import('@/lib/mock-data')
      const task = MOCK_TASKS.find(t => t.id === taskId)
      if (task) {
        task.status = 'in_progress'
        task.before_photo_url = photoDataUrl
        task.before_photo_metadata = metadata
        task.before_photo_taken_at = new Date().toISOString()
        task.updated_at = new Date().toISOString()
        
        // Add update record
        const updates = MOCK_TASK_UPDATES[taskId] || []
        updates.push({
          id: `upd-${Date.now()}`,
          task_id: taskId,
          worker_id: workerId,
          status: 'in_progress',
          note: 'Started work with "Before" photo capture',
          created_at: new Date().toISOString()
        })
        MOCK_TASK_UPDATES[taskId] = updates
      }
      return { success: true }
    }

    // Convert data URL to Blob manually for better compatibility
    const [header, base64] = photoDataUrl.split(',')
    const mime = header.match(/:(.*?);/)![1]
    const bstr = atob(base64)
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    const blob = new Blob([u8arr], { type: mime })

    // Upload photo
    const { uploadTaskPhoto } = await import('./photo.service')
    const file = new File([blob], `before_${taskId}.jpg`, { type: 'image/jpeg' })
    const photo = await uploadTaskPhoto(taskId, workerId, 'before', file)

    // Update task record with specific columns from user request
    const { error } = await supabase
      .from('tasks')
      .update({
        before_photo_url: photo.photo_url,
        before_photo_metadata: metadata,
        before_photo_taken_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .eq('id', taskId)

    if (error) throw error
    return { success: true }
  },

  /**
   * Submit the "After Work" photo and resolution notes.
   * Updates task status to 'completed'.
   */
  async submitAfterPhoto(taskId: string, workerId: string, photoDataUrl: string, metadata: any, resolutionNotes: string) {
    if (isMock()) {
      const { MOCK_TASKS, MOCK_TASK_UPDATES } = await import('@/lib/mock-data')
      const task = MOCK_TASKS.find(t => t.id === taskId)
      if (task) {
        task.status = 'completed'
        task.after_photo_url = photoDataUrl
        task.after_photo_metadata = metadata
        task.after_photo_taken_at = new Date().toISOString()
        task.resolved_at = new Date().toISOString()
        task.resolution_notes = resolutionNotes
        task.updated_at = new Date().toISOString()

        // Add update record
        const updates = MOCK_TASK_UPDATES[taskId] || []
        updates.push({
          id: `upd-${Date.now()}`,
          task_id: taskId,
          worker_id: workerId,
          status: 'completed',
          note: `Completed work: ${resolutionNotes}`,
          created_at: new Date().toISOString()
        })
        MOCK_TASK_UPDATES[taskId] = updates
      }
      return { success: true }
    }

    // Convert data URL to Blob manually for better compatibility
    const [header, base64] = photoDataUrl.split(',')
    const mime = header.match(/:(.*?);/)![1]
    const bstr = atob(base64)
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    const blob = new Blob([u8arr], { type: mime })

    // Upload photo
    const { uploadTaskPhoto } = await import('./photo.service')
    const file = new File([blob], `after_${taskId}.jpg`, { type: 'image/jpeg' })
    const photo = await uploadTaskPhoto(taskId, workerId, 'after', file)

    // Update task record
    const { error } = await supabase
      .from('tasks')
      .update({
        after_photo_url: photo.photo_url,
        after_photo_metadata: metadata,
        after_photo_taken_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes, // Using user's suggested column names
        status: 'completed'
      })
      .eq('id', taskId)

    if (error) throw error
    return { success: true }
  },

  /**
   * Get completed tasks for history.
   */
  async getCompletedTasks(workerId: string): Promise<Task[]> {
    if (isMock()) {
      const { MOCK_TASKS } = await import('@/lib/mock-data')
      return MOCK_TASKS.filter(t => t.status === 'completed')
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_worker_id', workerId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data as Task[]
  }
}
