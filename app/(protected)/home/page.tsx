'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, AlertCircle, Calendar, ArrowRight, MapPin, Bell } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { MOCK_TASKS, MOCK_PROFILE, MOCK_WORKER, MOCK_TASK_UPDATES } from '@/lib/mock-data'
import { Task } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [workerName, setWorkerName] = useState('Worker')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
      if (isMock) {
        setTasks(MOCK_TASKS)
        setWorkerName(MOCK_PROFILE.full_name || 'Worker')
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

  const today = new Date()
  const todayStr = today.toDateString()

  const todayTasks = tasks.filter(t => t.due_at && new Date(t.due_at).toDateString() === todayStr)
  const pendingTasks = tasks.filter(t => ['assigned', 'accepted'].includes(t.status))
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const delayedTasks = tasks.filter(t => t.status === 'delayed')

  const nextDueTask = tasks
    .filter(t => t.due_at && new Date(t.due_at) > today && t.status !== 'completed')
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())[0]

  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const recentUpdates = Object.values(MOCK_TASK_UPDATES).flat()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  function goToTasksWithFilter(filter: string) {
    router.push(`/tasks?filter=${filter}`)
  }

  const metrics = [
    {
      label: "Today's Tasks",
      value: todayTasks.length,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
      filter: 'today'
    },
    {
      label: 'Pending',
      value: pendingTasks.length,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-600',
      filter: 'pending'
    },
    {
      label: 'In Progress',
      value: inProgressTasks.length,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-indigo-50 text-indigo-600',
      filter: 'in_progress'
    },
    {
      label: 'Completed',
      value: completedTasks.length,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600',
      filter: 'completed'
    },
  ]

  return (
    <div className="p-4 pb-24">
      <Toaster position="top-center" />

      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm text-gray-500">{greeting},</p>
        <h1 className="text-2xl font-bold text-gray-900">{workerName.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Metric Cards — clickable */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {metrics.map(m => (
          <button
            key={m.label}
            onClick={() => goToTasksWithFilter(m.filter)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:border-[#0F4C81]/30 active:bg-gray-50 transition"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${m.color}`}>
              {m.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
          </button>
        ))}
      </div>

      {/* Next Due Task */}
      {nextDueTask && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Next Due Task</h2>
          <div
            onClick={() => router.push(`/tasks/${nextDueTask.id}`)}
            className="bg-[#0F4C81] rounded-2xl p-4 cursor-pointer active:opacity-90"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{nextDueTask.title}</p>
                {nextDueTask.location_address && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-white/60" />
                    <p className="text-white/70 text-xs">{nextDueTask.location_address}</p>
                  </div>
                )}
                {nextDueTask.due_at && (
                  <p className="text-white/70 text-xs mt-1">
                    Due: {new Date(nextDueTask.due_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              <ArrowRight className="w-5 h-5 text-white/60 shrink-0 mt-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* Delayed Tasks Warning */}
      {delayedTasks.length > 0 && (
        <div
          onClick={() => goToTasksWithFilter('delayed')}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {delayedTasks.length} Delayed Task{delayedTasks.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-500">Tap to view and update</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-red-400" />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
          <button
            onClick={() => router.push('/tasks')}
            className="text-xs text-[#0F4C81] font-medium"
          >
            View all
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {recentUpdates.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">No recent activity</p>
          ) : (
            recentUpdates.map(update => {
              const task = MOCK_TASKS.find(t => t.id === update.task_id)
              return (
                <div
                  key={update.id}
                  onClick={() => task && router.push(`/tasks/${task.id}`)}
                  className="flex items-start gap-3 p-3 cursor-pointer active:bg-gray-50"
                >
                  <div className="w-2 h-2 rounded-full bg-[#0F4C81] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {task?.title || 'Task'}
                    </p>
                    <p className="text-xs text-gray-400">{update.note}</p>
                  </div>
                  <p className="text-xs text-gray-300 shrink-0">
                    {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/tasks')}
          className="bg-[#0F4C81] text-white rounded-xl py-3 text-sm font-medium"
        >
          View All Tasks
        </button>
        <button
          onClick={() => router.push('/calendar')}
          className="bg-white border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium"
        >
          View Calendar
        </button>
      </div>
    </div>
  )
}