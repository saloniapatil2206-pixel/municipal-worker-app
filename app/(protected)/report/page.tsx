'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, AlertCircle, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { MOCK_TASKS } from '@/lib/mock-data'

export default function ReportPage() {
  const router = useRouter()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [])

  async function loadReport() {
    try {
      setLoading(true)
      const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

      if (isMock) {
        const total = MOCK_TASKS.length
        const completed = MOCK_TASKS.filter(t => t.status === 'completed')
        const delayed = MOCK_TASKS.filter(t => t.status === 'delayed')
        const pending = MOCK_TASKS.filter(t => ['assigned', 'accepted', 'in_progress'].includes(t.status))
        const now = new Date()
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        setReport({
          total_assigned: total,
          total_completed: completed.length,
          total_pending: pending.length,
          total_delayed: delayed.length,
          completion_rate: Math.round((completed.length / total) * 100),
          completed_this_week: completed.filter(t => new Date(t.updated_at) >= weekStart).length,
          completed_this_month: completed.filter(t => new Date(t.updated_at) >= monthStart).length,
          recent_completed: completed,
          recent_delayed: delayed,
          all_tasks: MOCK_TASKS,
        })
        return
      }

      const { fetchWorkerReport } = await import('@/services/report.service')
      const session = JSON.parse(localStorage.getItem('mock_session') || '{}')
      const data = await fetchWorkerReport(session?.user?.id)
      setReport(data)
    } catch (err: any) {
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F4C81]" />
      </div>
    )
  }

  if (!report) return null

  const metrics = [
    { label: 'Total Assigned', value: report.total_assigned, color: 'bg-blue-50 text-blue-600', icon: <Calendar className="w-5 h-5" />, filter: 'all' },
    { label: 'Under Review', value: report.total_under_review || 0, color: 'bg-purple-50 text-purple-600', icon: <Clock className="w-5 h-5" />, filter: 'pending_review' },
    { label: 'Completed', value: report.total_completed, color: 'bg-green-50 text-green-600', icon: <CheckCircle className="w-5 h-5" />, filter: 'completed' },
    { label: 'Delayed', value: report.total_delayed, color: 'bg-red-50 text-red-600', icon: <AlertCircle className="w-5 h-5" />, filter: 'delayed' },
  ]

  return (
    <div className="p-4 pb-24">
      <Toaster position="top-center" />

      <h1 className="text-xl font-bold text-gray-900 mb-1">Report Card</h1>
      <p className="text-sm text-gray-500 mb-4">Your performance overview</p>

      {/* Metric Cards — clickable → goes to tasks with filter */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {metrics.map(m => (
          <button
            key={m.label}
            onClick={() => router.push(`/tasks?filter=${m.filter}`)}
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

      {/* Completion Rate */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0F4C81]" />
            <p className="text-sm font-semibold text-gray-800">Completion Rate</p>
          </div>
          <p className="text-lg font-bold text-[#0F4C81]">{report.completion_rate}%</p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-[#0F4C81] h-3 rounded-full transition-all duration-500"
            style={{ width: `${report.completion_rate}%` }}
          />
        </div>
      </div>

      {/* This Week / Month */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{report.completed_this_week}</p>
          <p className="text-xs text-gray-500 mt-1">This Week</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{report.completed_this_month}</p>
          <p className="text-xs text-gray-500 mt-1">This Month</p>
        </div>
      </div>

      {/* Recent Under Review */}
      {report.recent_under_review?.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Pending Review</h2>
            <button
              onClick={() => router.push('/tasks?filter=pending_review')}
              className="text-xs text-purple-500 font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {report.recent_under_review.slice(0, 3).map((task: any) => {
              const t = task.task || task
              return (
                <div
                  key={t.id}
                  onClick={() => router.push(`/tasks/${t.id}`)}
                  className="bg-white rounded-xl p-3 border border-purple-100 shadow-sm cursor-pointer flex items-center justify-between active:bg-purple-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.title}</p>
                      <p className="text-xs text-purple-400">{t.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Completed */}
      {report.recent_completed?.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Recently Approved/Completed</h2>
            <button
              onClick={() => router.push('/tasks?filter=completed')}
              className="text-xs text-[#0F4C81] font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {report.recent_completed.slice(0, 3).map((task: any) => {
              const t = task.task || task
              return (
                <div
                  key={t.id}
                  onClick={() => router.push(`/tasks/${t.id}`)}
                  className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm cursor-pointer flex items-center justify-between active:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.title}</p>
                      <p className="text-xs text-gray-400">{t.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Delayed */}
      {report.recent_delayed?.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Delayed Tasks</h2>
            <button
              onClick={() => router.push('/tasks?filter=delayed')}
              className="text-xs text-red-500 font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {report.recent_delayed.slice(0, 3).map((task: any) => {
              const t = task.task || task
              return (
                <div
                  key={t.id}
                  onClick={() => router.push(`/tasks/${t.id}`)}
                  className="bg-white rounded-xl p-3 border border-red-100 shadow-sm cursor-pointer flex items-center justify-between active:bg-red-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.title}</p>
                      <p className="text-xs text-red-400">{t.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Full History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Full Task History</h2>
        <div className="space-y-2">
          {(report.all_tasks || MOCK_TASKS).map((task: any) => (
            <div
              key={task.id}
              onClick={() => router.push(`/tasks/${task.id}`)}
              className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm cursor-pointer flex items-center justify-between active:bg-gray-50"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                <p className="text-xs text-gray-400">{task.category} · {task.due_at ? new Date(task.due_at).toLocaleDateString('en-IN') : '—'}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                task.status === 'completed' || task.status === 'approved' || task.status === 'resolved' ? 'bg-green-100 text-green-700' :
                task.status === 'pending_review' ? 'bg-purple-100 text-purple-700' :
                task.status === 'delayed' || task.status === 'rejected' ? 'bg-red-100 text-red-700' :
                task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                task.status === 'accepted' ? 'bg-indigo-100 text-indigo-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}