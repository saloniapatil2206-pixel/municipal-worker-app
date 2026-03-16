import { supabase } from '@/lib/supabase'
import type { TaskPhoto } from '@/types'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function uploadTaskPhoto(
  taskId: string,
  workerId: string,
  photoType: 'before' | 'after',
  file: File
): Promise<TaskPhoto> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPG and PNG images are allowed')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File size must be under 5MB')
  }

  const ext = file.name.split('.').pop()
  const timestamp = Date.now()
  const path = `${workerId}/${taskId}/${photoType}/${timestamp}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('task-photos')
    .upload(path, file, { upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = supabase.storage
    .from('task-photos')
    .getPublicUrl(path)

  const publicUrl = urlData.publicUrl

  const { data: photo, error: insertError } = await supabase
    .from('task_photos')
    .insert({
      task_id: taskId,
      worker_id: workerId,
      photo_url: publicUrl,
      photo_type: photoType,
      caption: null,
    })
    .select()
    .single()

  if (insertError) throw new Error(insertError.message)
  return photo
}

export async function fetchTaskPhotos(taskId: string, workerId: string): Promise<TaskPhoto[]> {
  const { data, error } = await supabase
    .from('task_photos')
    .select('*')
    .eq('task_id', taskId)
    .eq('worker_id', workerId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}
