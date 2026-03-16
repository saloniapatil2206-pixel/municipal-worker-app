'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, MapPin, Clock, AlertTriangle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { MOCK_TASKS } from '@/lib/mock-data'
import { Task } from '@/types'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'delayed', label: 'Delayed' },
]

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-700'
    case 'high': return 'bg-orange-100 text-orange-700'
    case 'medium': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700'
    case 'delayed': return 'bg-red-100 text-red-700'
    case 'in_progress': return 'bg-amber-100 text-amber-700'
    case 'accepted': return 'bg-indigo-100 text-indigo-700'
    default: return 'bg-blue-100 text-blue-700'
  }
}

function isOverdue(task: Task) {
  return task.due_at &&
    new Date(task.due_at) < new Date() &&
    task.status !== 'completed'
}

function TasksContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlFilter = searchParams.get('filter') || 'all'

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState(urlFilter)

  // Sync filter from URL when it changes
  useEffect(() => {
    const filter = searchParams.get('filter') || 'all'
    setActiveFilter(filter)
  }, [searchParams])

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      setLoading(true)
      const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
      if (isMock) {
        await new Promise(r => setTimeout(r, 300))
        setTasks(MOCK_TASKS)
        return
      }
      const { fetchAssignedTasks } = await import('@/services/task.service')
      const session = JSON.parse(localStorage.getItem('mock_session') || '{}')
      const data = await fetchAssignedTasks(session?.user?.id)
      setTasks(data)
    } catch (err: any) {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch =
      search === '' ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.id.toLowerCase().includes(search.toLowerCase()) ||
      (task.category || '').toLowerCase().includes(search.toLowerCase())

    // Status filter
    let matchesStatus = true
    if (activeFilter === 'pending') {
      matchesStatus = ['assigned', 'accepted'].includes(task.status)
    } else if (activeFilter === 'in_progress') {
      matchesStatus = task.status === 'in_progress'
    } else if (activeFilter === 'completed') {
      matchesStatus = task.status === 'completed'
    } else if (activeFilter === 'delayed') {
      matchesStatus = task.status === 'delayed'
    } else if (activeFilter === 'today') {
      const todayStr = new Date().toDateString()
      matchesStatus = !!task.due_at && new Date(task.due_at).toDateString() === todayStr
    } else {
      matchesStatus = true // 'all'
    }

    return matchesSearch && matchesStatus
  })

  // Sort: overdue first, then by due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aOverdue = isOverdue(a) ? 0 : 1
    const bOverdue = isOverdue(b) ? 0 : 1
    if (aOverdue !== bOverdue) return aOverdue - bOverdue
    if (!a.due_at) return 1
    if (!b.due_at) return -1
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
  })

  return (
    <div className="p-4 pb-24">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-400">{sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''} {activeFilter !== 'all' ? `· ${activeFilter.replace('_', ' ')}` : ''}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${activeFilter === tab.key
              ? 'bg-[#0F4C81] text-white'
              : 'bg-white text-gray-600 border border-gray-200'
              }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1 opacity-70">
                ({tasks.filter(t => {
                  if (tab.key === 'pending') return ['assigned', 'accepted'].includes(t.status)
                  if (tab.key === 'today') return t.due_at && new Date(t.due_at).toDateString() === new Date().toDateString()
                  return t.status === tab.key
                }).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F4C81]" />
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-500 font-medium">No tasks found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'Try a different search term' : `No ${activeFilter.replace('_', ' ')} tasks`}
          </p>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="mt-3 text-sm text-[#0F4C81] font-medium"
            >
              View all tasks
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map(task => (
            <div
              key={task.id}
              onClick={() => router.push(`/tasks/${task.id}`)}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer active:bg-gray-50 hover:border-[#0F4C81]/30 transition"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    {isOverdue(task) && (
                      <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium">
                        <AlertTriangle className="w-3 h-3" /> OVERDUE
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{task.title}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>

              {/* Category + Priority */}
              <div className="flex items-center gap-2 mb-2">
                {task.category && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {task.category}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              {/* Location */}
              {task.location_address && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{task.location_address}</span>
                </div>
              )}

              {/* Due date */}
              {task.due_at && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span className={isOverdue(task) ? 'text-red-400 font-medium' : ''}>
                    Due: {new Date(task.due_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F4C81]" />
      </div>
    }>
      <TasksContent />
    </Suspense>
  )
}