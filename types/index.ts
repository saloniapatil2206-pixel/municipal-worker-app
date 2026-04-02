export interface Profile {
  id: string
  role: 'worker' | 'admin'
  full_name: string | null
  email: string | null
  phone: string | null
  profile_photo: string | null
  created_at: string
}

export interface Worker {
  id: string
  profile_id: string
  department: string | null
  sector: string | null
  is_active: boolean
  worker_code: string | null
  profile?: Profile
}

export type TaskStatus = 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'delayed' | 'pending_review' | 'approved' | 'rejected'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  title: string
  description: string | null
  category: string | null
  sector: string | null
  location_address: string | null
  latitude: number | null
  longitude: number | null
  priority: TaskPriority
  severity: string | null
  created_by_admin_id: string | null
  due_at: string | null
  status: TaskStatus
  admin_note: string | null
  citizen_complaint_ref: string | null
  staff_id: string | null
  before_photo_url: string | null
  before_photo_metadata: any | null
  before_photo_taken_at: string | null
  after_photo_url: string | null
  after_photo_metadata: any | null
  after_photo_taken_at: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

export interface TaskAssignment {
  id: string
  task_id: string
  worker_id: string
  assigned_at: string
  accepted_at: string | null
  task?: Task
}

export interface TaskUpdate {
  id: string
  task_id: string
  worker_id: string
  status: TaskStatus | null
  note: string | null
  created_at: string
}

export interface TaskPhoto {
  id: string
  task_id: string
  worker_id: string
  photo_url: string
  photo_type: 'before' | 'after'
  caption: string | null
  created_at: string
}

export interface DelayReport {
  id: string
  task_id: string
  worker_id: string
  reason_type: string
  custom_reason: string | null
  created_at: string
}

export interface Notification {
  id: string
  worker_id: string
  title: string
  body: string | null
  type: 'new_task' | 'due_soon' | 'overdue' | 'admin_note' | 'task_closure'
  is_read: boolean
  created_at: string
}

export interface WorkerReport {
  total_assigned: number
  total_completed: number
  total_pending: number
  total_delayed: number
  total_under_review: number
  completion_rate: number
  completed_this_week: number
  completed_this_month: number
  recent_completed: Task[]
  recent_delayed: Task[]
  recent_under_review: Task[]
  all_tasks: Task[]
}
