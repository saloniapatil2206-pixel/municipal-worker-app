'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, FileText, AlertCircle, Info, CheckCheck, Play, Clock, Phone, Camera } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchTaskById, acceptTask, startTask, completeTask, addWorkNote, updateTaskStatus, type TaskDetail } from '@/services/task.service'
import type { TaskPhoto } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import { Toaster } from 'react-hot-toast'
import ActivityTimeline from '@/components/ActivityTimeline'
import DelayReasonModal from '@/components/DelayReasonModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import WorkerCameraCapture from '@/components/worker/WorkerCameraCapture'
import { workerService } from '@/services/worker.service'
import { priorityBadgeClasses } from '@/utils/statusColors'
import { formatDateTime, isOverdue } from '@/utils/formatDate'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import Image from 'next/image'

export function TaskDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { session } = useAuth()
  const workerId = session?.user?.id

  const [detail, setDetail] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [delayModalOpen, setDelayModalOpen] = useState(false)
  const [workNote, setWorkNote] = useState('')
  const [photos, setPhotos] = useState<TaskPhoto[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<'BEFORE' | 'AFTER'>('BEFORE')

  const [localBefore, setLocalBefore] = useState<{ dataUrl: string; metadata: any } | null>(null)
  const [localAfter, setLocalAfter] = useState<{ dataUrl: string; metadata: any } | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')

  const loadDetail = useCallback(async () => {
    if (!id || !workerId) return
    setLoading(true)
    try {
      const data = await fetchTaskById(id, workerId)
      setDetail(data)
      setPhotos(data.photos)
    } catch (err) {
      toast.error('Failed to load task')
    } finally {
      setLoading(false)
    }
  }, [id, workerId])

  useEffect(() => { loadDetail() }, [loadDetail])

  if (loading) return <LoadingSpinner />
  if (!detail) return (
    <div className="px-4 py-8 text-center">
      <p className="text-gray-500">Task not found</p>
      <Link href="/tasks" className="text-[#0F4C81] text-sm font-semibold mt-2 inline-block">← Back to Tasks</Link>
    </div>
  )

  const handlePhotoCapture = (dataUrl: string, metadata: any) => {
    if (cameraMode === 'BEFORE') {
      setLocalBefore({ dataUrl, metadata })
    } else {
      setLocalAfter({ dataUrl, metadata })
    }
    setShowCamera(false)
  }

  const openCamera = (mode: 'BEFORE' | 'AFTER') => {
    setCameraMode(mode)
    setShowCamera(true)
  }

  const task = detail
  const updates = detail.updates || []
  const overdue = isOverdue(task.due_at, task.status)
  const beforePhoto = photos.find((p) => p.photo_type === 'before') || null
  const afterPhoto = photos.find((p) => p.photo_type === 'after') || null

  const handleAccept = async () => {
    setActionLoading(true)
    try {
      if (!workerId) throw new Error('Not authenticated')
      await acceptTask(task.id, workerId)
      toast.success('Task accepted!')
      await loadDetail()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') }
    finally { setActionLoading(false) }
  }

  const handleStart = async () => {
    setActionLoading(true)
    try {
      if (!workerId) throw new Error('Not authenticated')
      await startTask(task.id, workerId)
      toast.success('Task started!')
      await loadDetail()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') }
    finally { setActionLoading(false) }
  }

  const handleSubmitReport = async () => {
    if (!localAfter && !afterPhoto) {
      toast.error('After photo is required to submit report.')
      return
    }
    if (!localBefore && !beforePhoto) {
      toast.error('Before photo is required to submit report.')
      return
    }
    
    setActionLoading(true)
    try {
      const beforePayload = localBefore ? { dataUrl: localBefore.dataUrl, metadata: localBefore.metadata } : null
      const afterPayload = localAfter ? { dataUrl: localAfter.dataUrl, metadata: localAfter.metadata, resolutionNotes } : null
      
      // We pass non-null after payload assuming localAfter exists. 
      // If they already had afterPhoto (rare), we don't need to re-upload but we assume they are uploading it now.
      if (!afterPayload) throw new Error('Missing after photo contents to finalize task.')

      if (!workerId) throw new Error('Not authenticated')
      await workerService.completeTaskWithPhotos(task.id, workerId, beforePayload, afterPayload)
      toast.success('Task completed with verification! 🎉')
      setLocalBefore(null)
      setLocalAfter(null)
      await loadDetail()
    } catch (err: any) {
      toast.error(err.message || 'Error completing task')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!workNote.trim()) { toast.error('Note cannot be empty'); return }
    setActionLoading(true)
    try {
      if (!workerId) throw new Error('Not authenticated')
      await addWorkNote(task.id, workerId, workNote)
      toast.success('Note saved')
      setWorkNote('')
      await loadDetail()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') }
    finally { setActionLoading(false) }
  }

  const handleResume = async () => {
    setActionLoading(true)
    try {
      if (!workerId) throw new Error('Not authenticated')
      await updateTaskStatus(task.id, workerId, 'in_progress', 'Task resumed')
      toast.success('Task resumed')
      await loadDetail()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') }
    finally { setActionLoading(false) }
  }

  const mapsUrl = task.latitude && task.longitude
    ? `https://maps.google.com/?q=${task.latitude},${task.longitude}`
    : task.location_address
      ? `https://maps.google.com/?q=${encodeURIComponent(task.location_address)}`
      : null

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <Toaster position="top-center" />
      
      {showCamera && (
        <WorkerCameraCapture 
          mode={cameraMode}
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      {/* Back header */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-1.5 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-sm font-bold text-gray-900 truncate flex-1">{task.title}</h1>
        <StatusBadge status={task.status} />
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Section 1: Task Info */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {task.category && (
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">{task.category}</span>
            )}
            <span className={clsx('text-xs font-semibold px-3 py-1 rounded-full', priorityBadgeClasses[task.priority])}>
              {task.priority.toUpperCase()} PRIORITY
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Location */}
          {task.location_address && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Location</p>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[#0F4C81] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{task.location_address}</p>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0F4C81] font-semibold mt-1 inline-block hover:underline">
                      Open in Maps ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Due date */}
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Due Date</p>
            <div className={clsx('flex items-center gap-2 text-sm', overdue ? 'text-red-600 font-bold' : 'text-gray-700')}>
              {overdue ? <AlertCircle size={14} /> : <Calendar size={14} className="text-gray-400" />}
              {overdue && <span>OVERDUE · </span>}
              {formatDateTime(task.due_at)}
            </div>
          </div>

          {/* Complaint ref */}
          {task.citizen_complaint_ref && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Complaint Ref</p>
              <p className="text-sm text-gray-700 font-mono">{task.citizen_complaint_ref}</p>
            </div>
          )}

          {/* Assigned date */}
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Assigned</p>
            <p className="text-sm text-gray-700">{formatDateTime(task.created_at)}</p>
          </div>
        </section>

        {/* Admin note */}
        {task.admin_note && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700 mb-0.5">Admin Note</p>
              <p className="text-sm text-amber-800">{task.admin_note}</p>
            </div>
          </div>
        )}

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#0F4C81]" />
            Work Verification (Photo Watermarked)
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Before Photo */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Before the work</p>
              {beforePhoto || localBefore ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner bg-gray-100">
                  <Image src={beforePhoto?.photo_url || localBefore?.dataUrl || ''} alt="Before Work" fill className="object-cover" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                    <CheckCheck className="w-3 h-3" />
                  </div>
                  {localBefore && (
                    <button 
                      onClick={() => setLocalBefore(null)} 
                      className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
                    >Retake</button>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => openCamera('BEFORE')}
                  disabled={actionLoading || task.status === 'completed'}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">Click Before Photo</span>
                </button>
              )}
            </div>

            {/* After Photo */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">After the work</p>
              {afterPhoto || localAfter ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner bg-gray-100">
                  <Image src={afterPhoto?.photo_url || localAfter?.dataUrl || ''} alt="After Work" fill className="object-cover" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                    <CheckCheck className="w-3 h-3" />
                  </div>
                  {localAfter && (
                    <button 
                      onClick={() => setLocalAfter(null)} 
                      className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
                    >Retake</button>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => openCamera('AFTER')}
                  disabled={actionLoading || task.status === 'completed'}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">Click After Photo</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Actions */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Actions</h2>

          {task.status === 'assigned' && (
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="w-full py-4 bg-[#0F4C81] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1A6DB5] transition-colors disabled:opacity-70"
            >
              {actionLoading ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCheck size={18} />}
              Accept Task
            </button>
          )}

          {task.status === 'accepted' && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-70"
            >
              {actionLoading ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Play size={18} />}
              Start Task
            </button>
          )}

          {task.status === 'in_progress' && (
            <div className="space-y-3">
              <textarea
                value={workNote}
                onChange={(e) => setWorkNote(e.target.value)}
                placeholder="Add a work note (optional)..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 bg-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSaveNote}
                  disabled={actionLoading || !workNote.trim()}
                  className="py-3.5 border border-[#0F4C81] text-[#0F4C81] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <FileText size={16} /> Save Note
                </button>
                <button
                  onClick={() => setDelayModalOpen(true)}
                  disabled={actionLoading}
                  className="py-3.5 border border-red-400 text-red-500 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Clock size={16} /> Mark Delayed
                </button>
              </div>
              {localAfter && (
                <div className="space-y-2 pb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resolution Notes</p>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe the work done..."
                    className="w-full bg-white border border-gray-200 p-3 rounded-xl text-sm"
                    rows={2}
                  />
                </div>
              )}
              <button
                onClick={handleSubmitReport}
                disabled={actionLoading || (!localAfter && !afterPhoto)}
                className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-70"
              >
                {actionLoading ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCheck size={18} />}
                Submit Report
              </button>
            </div>
          )}

          {task.status === 'delayed' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-red-600 font-semibold text-sm">⚠️ Task is currently delayed</p>
              </div>
              <button
                onClick={handleResume}
                disabled={actionLoading}
                className="w-full py-4 bg-[#0F4C81] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1A6DB5] transition-colors disabled:opacity-70"
              >
                {actionLoading ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Play size={18} />}
                Resume Task
              </button>
            </div>
          )}

          {task.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <CheckCheck size={28} className="text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-bold">Task Completed</p>
              <p className="text-green-600 text-sm mt-1">Great work! This task has been marked as done.</p>
            </div>
          )}
        </section>

        {/* Section 4: Activity */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Activity Timeline</h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <ActivityTimeline updates={updates} />
          </div>
        </section>
      </div>

      {/* Delay Modal */}
      <DelayReasonModal
        taskId={task.id}
        workerId={workerId!}
        isOpen={delayModalOpen}
        onClose={() => setDelayModalOpen(false)}
        onSubmit={() => { loadDetail() }}
      />
    </div>
  )
}
