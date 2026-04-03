'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { MOCK_TASKS } from '@/lib/mock-data'
import { Task } from '@/types'

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const days: (Date | null)[] = []
  let startDow = firstDay.getDay()
  // Make Monday = 0
  startDow = startDow === 0 ? 6 : startDow - 1
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month - 1, d))
  }
  return days
}

function fmt(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const router = useRouter()
  // Memoize today so it doesn't trigger infinite re-renders in useCallback
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [tasksByDate, setTasksByDate] = useState<{ [date: string]: Task[] }>({})
  const [selectedDate, setSelectedDate] = useState<string>(fmt(today))
  const [loading, setLoading] = useState(true)

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
      if (isMock) {
        const grouped: { [date: string]: Task[] } = {}
        const assignments = [
          { task: MOCK_TASKS[0], day: today.getDate() },
          { task: MOCK_TASKS[1], day: Math.min(today.getDate() + 1, 28) },
          { task: MOCK_TASKS[2], day: Math.max(today.getDate() - 1, 1) },
          { task: MOCK_TASKS[3], day: Math.min(today.getDate() + 5, 28) },
          { task: MOCK_TASKS[4], day: Math.max(today.getDate() - 3, 1) },
        ]
        assignments.forEach(({ task, day }) => {
          const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          if (!grouped[date]) grouped[date] = []
          grouped[date].push(task)
        })
        setTasksByDate(grouped)
        return
      }
      const { fetchCalendarTasks } = await import('@/services/calendar.service')
      const session = JSON.parse(localStorage.getItem('mock_session') || '{}')
      const workerId = session?.user?.id || 'mock-worker-001'
      const data = await fetchCalendarTasks(workerId, year, month)
      setTasksByDate(data)
    } catch (err: any) {
      toast.error('Failed to load calendar tasks')
    } finally {
      setLoading(false)
    }
  }, [year, month, today])

  useEffect(() => {
    loadTasks()
  }, [year, month, loadTasks])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const days = getCalendarDays(year, month)
  const selectedTasks = tasksByDate[selectedDate] || []
  const totalThisMonth = Object.values(tasksByDate).flat().length
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  return (
    <div className="p-4 pb-24">
      <Toaster position="top-center" />

      <h1 className="text-xl font-bold text-gray-900 mb-1">Calendar</h1>
      <p className="text-sm text-gray-500 mb-4">{totalThisMonth} tasks this month</p>

      {/* Calendar Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">

        {/* Month Nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-base font-semibold text-gray-800">
            {monthName} {year}
          </h2>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} />
            const dateStr = fmt(date)
            const hasTasks = !!tasksByDate[dateStr]?.length
            const isToday = dateStr === fmt(today)
            const isSelected = dateStr === selectedDate
            const taskStatuses = tasksByDate[dateStr]?.map(t => t.status) || []
            const hasOverdue = taskStatuses.includes('delayed')
            const hasCompleted = taskStatuses.includes('completed')

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`relative flex flex-col items-center py-1.5 rounded-xl transition ${isSelected
                  ? 'bg-[#0F4C81] text-white'
                  : isToday
                    ? 'bg-blue-50 text-[#0F4C81] font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className="text-sm">{date.getDate()}</span>
                {hasTasks && (
                  <div className="flex gap-0.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' :
                      hasOverdue ? 'bg-red-400' :
                        hasCompleted ? 'bg-green-400' : 'bg-amber-400'
                      }`} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Tasks */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {selectedDate === fmt(today) ? "Today's Tasks" : `Tasks on ${selectedDate}`}
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''})
          </span>
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0F4C81]" />
          </div>
        ) : selectedTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-gray-500 text-sm">No tasks on this date</p>
          </div>
        ) : (
          selectedTasks.map(task => (
            <div
              key={task.id}
              onClick={() => router.push(`/tasks/${task.id}`)}
              className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm cursor-pointer active:bg-gray-50 hover:border-[#0F4C81]/30 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-gray-800 flex-1 pr-2">{task.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  task.status === 'completed' || task.status === 'approved' ? 'bg-green-100 text-green-700' :
                  task.status === 'pending_review' ? 'bg-purple-100 text-purple-700' :
                  task.status === 'delayed' || task.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                  task.status === 'accepted' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              {task.location_address && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <MapPin className="w-3 h-3" />
                  <span>{task.location_address}</span>
                </div>
              )}
              {task.due_at && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Due: {new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}