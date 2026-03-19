'use client'

import React from 'react'
import { MapPin, Clock, Camera, CheckCircle, Navigation } from 'lucide-react'
import { Task } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface WorkerTaskCardProps {
  task: Task
  onTakeBefore: (task: Task) => void
  onTakeAfter: (task: Task) => void
}

export default function WorkerTaskCard({ task, onTakeBefore, onTakeAfter }: WorkerTaskCardProps) {
  const isNew = task.status === 'assigned' || task.status === 'accepted'
  const isInProgress = task.status === 'in_progress'
  const isResolved = task.status === 'completed'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 transition-all active:scale-[0.98]">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isResolved ? 'bg-green-100 text-green-600' : 
            isInProgress ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
          }`}>
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">{task.title}</h3>
            <span className="text-xs text-gray-400 capitalize">{task.category || 'Civic Issue'}</span>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isResolved ? 'bg-green-500 text-white' : 
          isInProgress ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          {task.status.replace('_', ' ')}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{task.location_address || 'Location unavailable'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
          <span>Assigned {formatDistanceToNow(new Date(task.created_at))} ago</span>
        </div>
      </div>

      <div className="flex gap-2">
        {isNew && (
          <button 
            onClick={() => onTakeBefore(task)}
            className="flex-1 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200"
          >
            <Camera className="w-5 h-5" />
            Take Before Photo
          </button>
        )}
        
        {isInProgress && (
          <button 
            onClick={() => onTakeAfter(task)}
            className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-200"
          >
            <CheckCircle className="w-5 h-5" />
            Take After Photo
          </button>
        )}

        {isResolved && (
          <div className="flex-1 flex gap-2">
            {/* Minimal display for completed task */}
            <div className="flex-1 bg-gray-50 rounded-xl p-3 flex items-center justify-center gap-2 text-gray-400 text-sm font-medium border border-dashed border-gray-200">
              <CheckCircle className="w-4 h-4" />
              Task Completed
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
