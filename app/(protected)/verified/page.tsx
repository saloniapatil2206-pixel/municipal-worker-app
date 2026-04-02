'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Clock, MapPin, ArrowLeft, Camera, ShieldCheck, CheckCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { workerService } from '@/services/worker.service'
import type { Task } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import Image from 'next/image'
import toast, { Toaster } from 'react-hot-toast'
import clsx from 'clsx'
import { formatDateTime } from '@/utils/formatDate'

export default function VerifiedReportsPage() {
  const router = useRouter()
  const { worker, profile } = useAuth()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!worker?.sector) {
      if (worker) {
        toast.error('No sector assigned to this worker')
        setLoading(false)
      }
      return
    }

    const loadTasks = async () => {
      setLoading(true)
      try {
        const data = await workerService.getVerifiedTasksForSector(worker.sector!)
        setTasks(data)
      } catch (err: any) {
        toast.error(err.message || 'Error fetching verified reports')
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [worker])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pb-20">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 flex flex-col shadow-sm pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-green-500" /> Verified Works
            </h1>
          </div>
        </div>
        <div className="px-4 pb-3 flex items-center gap-2">
          <span className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-md border border-green-100">
            Sector: {worker?.sector || 'Unknown'}
          </span>
          <span className="text-xs text-gray-500 font-medium ml-auto">
            {tasks.length} {tasks.length === 1 ? 'Report' : 'Reports'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
            <BadgeCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-900">No Verified Reports</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
              Completed tasks with before and after verification photos will appear here.
            </p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              {/* Card Header */}
              <div className="p-4 border-b border-gray-50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-gray-900 text-base leading-tight break-words flex-1">
                    {task.title}
                  </h3>
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shrink-0 flex items-center gap-1">
                    <CheckCheck size={12} /> {task.status}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {task.location_address && (
                    <div className="flex items-center gap-1 truncate max-w-[60%]">
                      <MapPin size={12} className="shrink-0 text-gray-400" />
                      <span className="truncate">{task.location_address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-auto shrink-0 font-medium">
                    <Clock size={12} className="text-gray-400" />
                    {task.resolved_at ? formatDateTime(task.resolved_at) : formatDateTime(task.updated_at)}
                  </div>
                </div>
              </div>

              {/* Photo Split View */}
              <div className="flex w-full aspect-[4/3] bg-gray-100 divide-x divide-white/50 relative group">
                {/* Before Photo */}
                <div className="flex-1 relative h-full">
                  {task.before_photo_url ? (
                    <Image src={task.before_photo_url} alt="Before" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                      <Camera size={20} className="text-gray-300 mb-1" />
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">No Before</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-center">
                    Before
                  </div>
                </div>

                {/* After Photo */}
                <div className="flex-1 relative h-full">
                  {task.after_photo_url ? (
                    <Image src={task.after_photo_url} alt="After" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                      <Camera size={20} className="text-gray-300 mb-1" />
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">No After</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-center">
                    After
                  </div>
                </div>
              </div>

              {/* Footer / Resolution Notes */}
              {task.resolution_notes && (
                <div className="px-4 py-3 bg-gray-50 text-xs">
                  <span className="font-bold text-gray-700 mr-2">Note:</span>
                  <span className="text-gray-600">{task.resolution_notes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
