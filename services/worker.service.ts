import { supabase } from '@/lib/supabase'
import { Task, TaskStatus } from '@/types'

const isMock = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export const workerService = {
  async dualUpdate(id: string, updates: any) {
    const { supabase } = await import('@/lib/supabase')
    const { data } = await supabase.from('tasks').select('id').eq('id', id).single()
    
    let targetStatus = updates.status

    if (data) {
      // === TASKS table: has all photo columns ===
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
      
      console.log('[dualUpdate] Updating TASK', id, cleanUpdates)
      const res = await supabase.from('tasks').update(cleanUpdates).eq('id', id)
      if (res.error) {
        console.error('[dualUpdate] Task update error:', res.error)
        throw new Error(res.error.message)
      }
      return res
    } else {
      // === ISSUES table: only has before_photo_url, after_photo_url, status, resolved_at, updated_at ===
      const issueUpdates: any = {}
      
      if (updates.before_photo_url !== undefined) issueUpdates.before_photo_url = updates.before_photo_url
      if (updates.after_photo_url !== undefined) issueUpdates.after_photo_url = updates.after_photo_url
      if (updates.resolved_at !== undefined) issueUpdates.resolved_at = updates.resolved_at
      if (updates.updated_at !== undefined) issueUpdates.updated_at = updates.updated_at
      
      if (['completed', 'done', 'resolved'].includes(targetStatus)) targetStatus = 'resolved'
      if (targetStatus) issueUpdates.status = targetStatus

      console.log('[dualUpdate] Updating ISSUE', id, issueUpdates)
      const res = await supabase.from('issues').update(issueUpdates).eq('id', id)
      if (res.error) {
        console.error('[dualUpdate] Issue update error:', res.error)
        throw new Error(res.error.message)
      }
      return res
    }
  },
  /**
   * Get all tasks assigned to the current worker that are either 'assigned', 'accepted', or 'in_progress'.
   */
  async getAssignedTasks(workerId: string): Promise<Task[]> {
    if (isMock()) {
      const { MOCK_TASKS } = await import('@/lib/mock-data')
      return MOCK_TASKS.filter(t => ['assigned', 'accepted', 'in_progress', 'delayed'].includes(t.status))
    }

    const { supabase } = await import('@/lib/supabase')
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workerId)
    if (!isUUID) return []

    const { data: profile } = await supabase.from('profiles').select('sector, assigned_zone').eq('id', workerId).single()
    const workerSector = profile?.sector || profile?.assigned_zone

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('staff_id', workerId)
      .in('status', ['assigned', 'accepted', 'in_progress', 'delayed'])

    let issuesQuery = supabase.from('issues').select('*').in('status', ['assigned', 'accepted', 'in_progress', 'delayed', 'open', 'pending'])
    if (workerSector) {
      issuesQuery = issuesQuery.or(`assigned_to.eq.${workerId},sector.eq.${workerSector}`)
    } else {
      issuesQuery = issuesQuery.eq('assigned_to', workerId)
    }
    const { data: issuesData } = await issuesQuery

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
      item_type: 'task'
    }))

    const unified = [...normalizedTasks, ...normalizedIssues]
    // sort by created_at desc
    unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    return unified as Task[]
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

    const [header, base64] = photoDataUrl.split(',')
    const mime = header.match(/:(.*?);/)![1]
    const bstr = atob(base64)
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    const blob = new Blob([u8arr], { type: mime })

    const { uploadTaskPhoto } = await import('./photo.service')
    const file = new File([blob], `before_${taskId}.jpg`, { type: 'image/jpeg' })
    const photo = await uploadTaskPhoto(taskId, workerId, 'before', file)

    await this.dualUpdate(taskId, {
      before_photo_url: photo.photo_url,
      before_photo_metadata: metadata,
      before_photo_taken_at: new Date().toISOString(),
      status: 'in_progress'
    })

    return { success: true }
  },

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

    const [header, base64] = photoDataUrl.split(',')
    const mime = header.match(/:(.*?);/)![1]
    const bstr = atob(base64)
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    const blob = new Blob([u8arr], { type: mime })

    const { uploadTaskPhoto } = await import('./photo.service')
    const file = new File([blob], `after_${taskId}.jpg`, { type: 'image/jpeg' })
    const photo = await uploadTaskPhoto(taskId, workerId, 'after', file)

    await this.dualUpdate(taskId, {
      after_photo_url: photo.photo_url,
      after_photo_metadata: metadata,
      after_photo_taken_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes,
      status: 'completed'
    })

    return { success: true }
  },

  async getCompletedTasks(workerId: string): Promise<Task[]> {
    if (isMock()) {
      const { MOCK_TASKS } = await import('@/lib/mock-data')
      return MOCK_TASKS.filter(t => t.status === 'completed')
    }
    const { supabase } = await import('@/lib/supabase')

    const { data: profile } = await supabase.from('profiles').select('sector, assigned_zone').eq('id', workerId).single()
    const workerSector = profile?.sector || profile?.assigned_zone

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('staff_id', workerId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(20)

    let issuesQuery = supabase.from('issues').select('*').in('status', ['resolved', 'completed', 'done', 'closed'])
    if (workerSector) {
      issuesQuery = issuesQuery.or(`assigned_to.eq.${workerId},sector.eq.${workerSector}`)
    } else {
      issuesQuery = issuesQuery.eq('assigned_to', workerId)
    }
    const { data: issuesData } = await issuesQuery

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
      item_type: 'task'
    }))

    const unified = [...normalizedTasks, ...normalizedIssues]
    unified.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    return unified.slice(0, 20) as Task[]
  },

  async completeTaskWithPhotos(
    taskId: string,
    workerId: string,
    before: { dataUrl: string; metadata: any } | null,
    after: { dataUrl: string; metadata: any; resolutionNotes: string }
  ) {
    if (isMock()) {
      const { MOCK_TASKS, MOCK_TASK_UPDATES } = await import('@/lib/mock-data')
      const task = MOCK_TASKS.find(t => t.id === taskId)
      if (task) {
        task.status = 'resolved'
        if (before) {
          task.before_photo_url = before.dataUrl
          task.before_photo_metadata = before.metadata
          task.before_photo_taken_at = new Date().toISOString()
        }
        task.after_photo_url = after.dataUrl
        task.after_photo_metadata = after.metadata
        task.after_photo_taken_at = new Date().toISOString()
        task.resolved_at = new Date().toISOString()
        task.resolution_notes = after.resolutionNotes
        task.updated_at = new Date().toISOString()

        const updates = MOCK_TASK_UPDATES[taskId] || []
        updates.push({
          id: `upd-${Date.now()}`,
          task_id: taskId,
          worker_id: workerId,
          status: 'resolved',
          note: `Completed work: ${after.resolutionNotes} (Pending Admin Review)`,
          created_at: new Date().toISOString()
        })
        MOCK_TASK_UPDATES[taskId] = updates
      }
      return { success: true }
    }

    console.log('[completeTaskWithPhotos] Starting for task:', taskId, 'worker:', workerId)

    const { uploadTaskPhoto } = await import('./photo.service')
    const parseDataUrl = (dataUrl: string, name: string) => {
      const [header, base64] = dataUrl.split(',')
      const mime = header.match(/:(.*?);/)![1]
      const bstr = atob(base64)
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) u8arr[n] = bstr.charCodeAt(n)
      return new File([new window.Blob([u8arr], { type: mime })], name, { type: 'image/jpeg' })
    }

    const updatePayload: any = {
      resolved_at: new Date().toISOString(),
      resolution_notes: after.resolutionNotes || '',
      completion_note: after.resolutionNotes || '',
      completed_at: new Date().toISOString(),
      status: 'done',
      updated_at: new Date().toISOString()
    }

    // Upload before photo if provided
    if (before) {
      try {
        console.log('[completeTaskWithPhotos] Uploading before photo...')
        const file = parseDataUrl(before.dataUrl, `before_${taskId}.jpg`)
        const photo = await uploadTaskPhoto(taskId, workerId, 'before', file)
        updatePayload.before_photo_url = photo.photo_url
        updatePayload.before_photo_metadata = before.metadata
        updatePayload.before_photo_taken_at = new Date().toISOString()
        console.log('[completeTaskWithPhotos] Before photo uploaded:', photo.photo_url)
      } catch (err: any) {
        console.error('[completeTaskWithPhotos] Before photo upload failed:', err.message)
        // Continue — before photo is optional
      }
    }

    // Upload after photo (required)
    try {
      console.log('[completeTaskWithPhotos] Uploading after photo...')
      const file = parseDataUrl(after.dataUrl, `after_${taskId}.jpg`)
      const photo = await uploadTaskPhoto(taskId, workerId, 'after', file)
      updatePayload.after_photo_url = photo.photo_url
      updatePayload.after_photo_metadata = after.metadata
      updatePayload.after_photo_taken_at = new Date().toISOString()
      console.log('[completeTaskWithPhotos] After photo uploaded:', photo.photo_url)
    } catch (err: any) {
      console.error('[completeTaskWithPhotos] After photo upload failed:', err.message)
      throw new Error('Failed to upload after photo: ' + err.message)
    }

    console.log('[completeTaskWithPhotos] Updating DB with payload:', updatePayload)
    await this.dualUpdate(taskId, updatePayload)
    console.log('[completeTaskWithPhotos] DB update complete')
    return { success: true }
  },

  /**
   * Get all verified works (completed status) in the worker's sector.
   */
  async getVerifiedTasksForSector(sector: string): Promise<Task[]> {
    if (isMock()) {
      const { MOCK_TASKS } = await import('@/lib/mock-data')
      return MOCK_TASKS.filter(
        t => ['completed', 'done', 'resolved', 'closed'].includes(t.status) &&
        t.sector === sector &&
        (t.before_photo_url || t.after_photo_url)
      )
    }

    const { supabase } = await import('@/lib/supabase')

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['completed', 'done', 'resolved', 'closed'])
      .eq('sector', sector)
      .not('after_photo_url', 'is', null) // Ensure there's a completion photo

    const { data: issuesData } = await supabase
      .from('issues')
      .select('*')
      .in('status', ['completed', 'done', 'resolved', 'closed'])
      .eq('sector', sector)
      .not('after_photo_url', 'is', null)

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
      item_type: 'task'
    }))

    const unified = [...normalizedTasks, ...normalizedIssues]
    unified.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    
    return unified as Task[]
  }
}
