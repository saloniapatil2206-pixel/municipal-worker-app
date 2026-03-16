import { Task, Worker, Profile, Notification, TaskUpdate, TaskPhoto } from '@/types'

export const MOCK_PROFILE: Profile = {
  id: 'mock-user-001',
  role: 'worker',
  full_name: 'Saloni Patil',
  email: 'worker@demo.com',
  phone: '+91 98765 43210',
  profile_photo: null,
  created_at: '2024-01-01T00:00:00Z'
}

export const MOCK_WORKER: Worker = {
  id: 'mock-worker-001',
  profile_id: 'mock-user-001',
  department: 'Roads & Infrastructure',
  sector: 'Zone A - Andheri West',
  is_active: true,
  worker_code: 'WRK001',
  profile: MOCK_PROFILE
}

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-001',
    title: 'Pothole Repair - SV Road',
    description: 'Large pothole near SV Road bus stop causing traffic issues. Immediate repair required.',
    category: 'Road Repair',
    sector: 'Zone A',
    location_address: 'SV Road, Andheri West, Mumbai 400058',
    latitude: 19.1136,
    longitude: 72.8697,
    priority: 'high',
    severity: 'Major',
    created_by_admin_id: 'admin-001',
    due_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hrs from now
    status: 'in_progress',
    admin_note: 'Use cold mix for temporary fix. Permanent fix scheduled next week.',
    citizen_complaint_ref: 'CMP-2024-0892',
    created_at: '2024-06-01T08:00:00Z',
    updated_at: '2024-06-01T10:00:00Z'
  },
  {
    id: 'task-002',
    title: 'Street Light Repair - Link Road',
    description: '3 street lights not working on Link Road stretch near D-Mart. Safety hazard at night.',
    category: 'Electrical',
    sector: 'Zone A',
    location_address: 'Link Road, Andheri West, Mumbai 400053',
    latitude: 19.1195,
    longitude: 72.8468,
    priority: 'medium',
    severity: 'Moderate',
    created_by_admin_id: 'admin-001',
    due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    status: 'accepted',
    admin_note: null,
    citizen_complaint_ref: 'CMP-2024-0901',
    created_at: '2024-06-01T09:00:00Z',
    updated_at: '2024-06-01T09:00:00Z'
  },
  {
    id: 'task-003',
    title: 'Drainage Cleaning - Lokhandwala',
    description: 'Blocked drain causing waterlogging in Lokhandwala Complex area.',
    category: 'Drainage',
    sector: 'Zone A',
    location_address: 'Lokhandwala Complex, Andheri West, Mumbai',
    latitude: 19.1307,
    longitude: 72.8314,
    priority: 'critical',
    severity: 'Critical',
    created_by_admin_id: 'admin-001',
    due_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hrs AGO = overdue
    status: 'delayed',
    admin_note: 'High priority — monsoon season. Escalate if blocked.',
    citizen_complaint_ref: 'CMP-2024-0876',
    created_at: '2024-05-30T08:00:00Z',
    updated_at: '2024-05-30T08:00:00Z'
  },
  {
    id: 'task-004',
    title: 'Park Bench Repair - Joggers Park',
    description: 'Two benches broken in Joggers Park. Wood replacement needed.',
    category: 'Parks & Gardens',
    sector: 'Zone A',
    location_address: 'Joggers Park, Bandra West, Mumbai 400050',
    latitude: 19.0596,
    longitude: 72.8295,
    priority: 'low',
    severity: 'Minor',
    created_by_admin_id: 'admin-001',
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // next week
    status: 'assigned',
    admin_note: null,
    citizen_complaint_ref: null,
    created_at: '2024-06-02T08:00:00Z',
    updated_at: '2024-06-02T08:00:00Z'
  },
  {
    id: 'task-005',
    title: 'Water Pipeline Leak - DN Nagar',
    description: 'Minor water pipeline leak near DN Nagar metro station.',
    category: 'Water Supply',
    sector: 'Zone A',
    location_address: 'DN Nagar, Andheri West, Mumbai 400053',
    latitude: 19.1067,
    longitude: 72.8437,
    priority: 'high',
    severity: 'Major',
    created_by_admin_id: 'admin-001',
    due_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago = overdue
    status: 'completed',
    admin_note: null,
    citizen_complaint_ref: 'CMP-2024-0845',
    created_at: '2024-05-28T08:00:00Z',
    updated_at: '2024-05-29T14:00:00Z'
  }
]

export const MOCK_TASK_UPDATES: Record<string, TaskUpdate[]> = {
  'task-001': [
    { id: 'upd-001', task_id: 'task-001', worker_id: 'mock-worker-001', status: 'accepted', note: 'Task accepted. On my way.', created_at: '2024-06-01T08:30:00Z' },
    { id: 'upd-002', task_id: 'task-001', worker_id: 'mock-worker-001', status: 'in_progress', note: 'Reached location. Starting repair work.', created_at: '2024-06-01T09:00:00Z' },
    { id: 'upd-003', task_id: 'task-001', worker_id: 'mock-worker-001', status: null, note: 'Cold mix applied. Waiting for it to set.', created_at: '2024-06-01T10:00:00Z' },
  ],
  'task-005': [
    { id: 'upd-004', task_id: 'task-005', worker_id: 'mock-worker-001', status: 'accepted', note: 'Accepted task.', created_at: '2024-05-28T09:00:00Z' },
    { id: 'upd-005', task_id: 'task-005', worker_id: 'mock-worker-001', status: 'in_progress', note: 'Pipeline inspection done. Repair started.', created_at: '2024-05-28T11:00:00Z' },
    { id: 'upd-006', task_id: 'task-005', worker_id: 'mock-worker-001', status: 'completed', note: 'Leak fixed. Area cleaned up.', created_at: '2024-05-29T14:00:00Z' },
  ]
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'notif-001', worker_id: 'mock-worker-001', title: 'New Task Assigned', body: 'Pothole Repair on SV Road has been assigned to you.', type: 'new_task', is_read: false, created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'notif-002', worker_id: 'mock-worker-001', title: 'Task Due Soon', body: 'Street Light Repair on Link Road is due in 2 hours.', type: 'due_soon', is_read: false, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-003', worker_id: 'mock-worker-001', title: 'Overdue Task', body: 'Drainage Cleaning at Lokhandwala is overdue. Please update status.', type: 'overdue', is_read: true, created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-004', worker_id: 'mock-worker-001', title: 'Admin Note Added', body: 'Admin added a note on Pothole Repair task.', type: 'admin_note', is_read: true, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-005', worker_id: 'mock-worker-001', title: 'Task Completed ✓', body: 'Water Pipeline Leak repair has been verified and closed.', type: 'task_closure', is_read: true, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
]
