'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay, parseISO } from 'date-fns'
import type { Task } from '@/types'
import StatusBadge from './StatusBadge'
import { formatDueDate } from '@/utils/formatDate'

interface CalendarViewProps {
  tasksByDate: { [date: string]: Task[] }
  currentMonth: Date
  onMonthChange: (date: Date) => void
}

export default function CalendarView({ tasksByDate, currentMonth, onMonthChange }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const selectedTasks = selectedDateKey ? (tasksByDate[selectedDateKey] || []) : []

  const prev = () => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  const next = () => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <h2 className="text-base font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={next} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const hasTasks = !!tasksByDate[key]?.length
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isCurrentDay = isToday(day)

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(isSameDay(day, selectedDate || new Date(0)) ? null : day)}
              className={`relative flex flex-col items-center py-1.5 rounded-xl transition-all ${
                isSelected ? 'bg-[#0F4C81] text-white' :
                isCurrentDay ? 'bg-blue-50 text-[#0F4C81] font-bold' :
                !isCurrentMonth ? 'opacity-30' : 'hover:bg-gray-100'
              }`}
            >
              <span className={`text-sm ${isCurrentMonth ? 'text-inherit' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </span>
              {hasTasks && (
                <div className="flex gap-0.5 mt-0.5">
                  {(tasksByDate[key] || []).slice(0, 3).map((t, i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 
                        t.status === 'completed' ? 'bg-green-500' :
                        t.status === 'delayed' ? 'bg-red-500' :
                        t.priority === 'critical' ? 'bg-red-400' : 'bg-[#0F4C81]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected date tasks */}
      {selectedDate && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {format(selectedDate, 'EEEE, MMMM d')} · {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
          </h3>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No tasks on this date</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDueDate(task.due_at)}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
