'use client'

import React, { useState, useEffect } from 'react'
import { Plus, CheckCircle, Clock, AlertTriangle, User, LogOut, ChevronRight } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import { workerService } from '@/services/worker.service'
import { Task } from '@/types'
import WorkerTaskCard from '@/components/worker/WorkerTaskCard'
import WorkerCameraCapture from '@/components/worker/WorkerCameraCapture'

export default function WorkerPage() {
  const [activeTasks, setActiveTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [cameraMode, setCameraMode] = useState<{ mode: 'BEFORE' | 'AFTER'; task: Task } | null>(null)
  const [workerProfile, setWorkerProfile] = useState<any>(null)

  useEffect(() => {
    loadWorkerData()
  }, [])

  const loadWorkerData = async () => {
    try {
      setLoading(true)
      // Get session from localStorage (mock) or AuthContext
      const session = JSON.parse(localStorage.getItem('mock_session') || '{}')
      const workerId = session?.user?.id || 'mock-worker-001'
      setWorkerProfile(session?.user || { full_name: 'Saloni Patil', role: 'worker' })

      const [active, completed] = await Promise.all([
        workerService.getAssignedTasks(workerId),
        workerService.getCompletedTasks(workerId)
      ])

      setActiveTasks(active)
      setCompletedTasks(completed)
    } catch (err) {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleCapture = async (dataUrl: string, metadata: any) => {
    if (!cameraMode) return

    const { mode, task } = cameraMode
    const workerId = workerProfile?.id || 'mock-worker-001'

    try {
      toast.loading(`Uploading ${mode.toLowerCase()} photo...`, { id: 'upload' })
      
      if (mode === 'BEFORE') {
        await workerService.submitBeforePhoto(task.id, workerId, dataUrl, metadata)
        toast.success('Before photo uploaded! Task is now in progress.', { id: 'upload' })
      } else {
        await workerService.submitAfterPhoto(task.id, workerId, dataUrl, metadata, metadata.resolutionNotes || '')
        toast.success('After photo uploaded! Task resolved.', { id: 'upload' })
      }

      setCameraMode(null)
      loadWorkerData() // Refresh list
    } catch (err) {
      toast.error('Failed to upload photo', { id: 'upload' })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-6 pt-12 rounded-b-[2.5rem] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0F4C81] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
              {workerProfile?.full_name?.charAt(0) || 'W'}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Worker Dashboard</p>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{workerProfile?.full_name || 'Worker'}</h1>
            </div>
          </div>
          <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 transition-colors border border-gray-100">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#eff6ff] p-4 rounded-3xl border border-blue-50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Active Tasks</span>
            </div>
            <p className="text-2xl font-black text-blue-900">{activeTasks.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-3xl border border-green-50">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Completed</span>
            </div>
            <p className="text-2xl font-black text-green-900">{completedTasks.length}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 mt-8">
        <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl flex border border-gray-100 shadow-inner">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'active' ? 'bg-white text-[#0F4C81] shadow-md border border-gray-100' : 'text-gray-400'
            }`}
          >
            Active Tasks
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'completed' ? 'bg-white text-[#0F4C81] shadow-md border border-gray-100' : 'text-gray-400'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Task List */}
      <main className="px-6 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-medium">Loading tasks...</p>
          </div>
        ) : activeTab === 'active' ? (
          activeTasks.length > 0 ? (
            activeTasks.map(task => (
              <WorkerTaskCard 
                key={task.id} 
                task={task} 
                onTakeBefore={(t) => setCameraMode({ mode: 'BEFORE', task: t })}
                onTakeAfter={(t) => setCameraMode({ mode: 'AFTER', task: t })}
              />
            ))
          ) : (
            <div className="text-center py-20 px-10 bg-white rounded-[2.5rem] border border-dashed border-gray-200 mt-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-sm text-gray-400">You have no active tasks assigned at the moment.</p>
            </div>
          )
        ) : (
          completedTasks.length > 0 ? (
            completedTasks.map(task => (
              <WorkerTaskCard 
                key={task.id} 
                task={task} 
                onTakeBefore={() => {}}
                onTakeAfter={() => {}}
              />
            ))
          ) : (
            <div className="text-center py-20 px-10 bg-white rounded-[2.5rem] border border-dashed border-gray-200 mt-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">History empty</h3>
              <p className="text-sm text-gray-400">Tasks you complete will appear here.</p>
            </div>
          )
        )}
      </main>

      {/* Camera Modal */}
      {cameraMode && (
        <WorkerCameraCapture 
          mode={cameraMode.mode}
          onCapture={handleCapture}
          onClose={() => setCameraMode(null)}
        />
      )}
    </div>
  )
}
