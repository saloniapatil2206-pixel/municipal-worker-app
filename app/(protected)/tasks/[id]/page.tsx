'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, FileText, AlertCircle, Info, CheckCheck, Play, Clock, Phone } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchTaskById, acceptTask, startTask, completeTask, addWorkNote, updateTaskStatus, type TaskDetail } from '@/services/task.service'
import type { TaskPhoto } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import PhotoUpload from '@/components/PhotoUpload'
import ActivityTimeline from '@/components/ActivityTimeline'
import DelayReasonModal from '@/components/DelayReasonModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import { priorityBadgeClasses } from '@/utils/statusColors'
import { formatDateTime, isOverdue } from '@/utils/formatDate'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { worker } = useAuth()

  const [detail, setDetail] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [delayModalOpen, setDelayModalOpen] = useState(false)
  const [workNote, setWorkNote] = useState('')
  const [photos, setPhotos] = useState<TaskPhoto[]>([])

  const loadDetail = async () => {
    if (!id || !worker?.id) return
    setLoading(true)
    try {
      const data = await fetchTaskById(id, worker.id)
      setDetail(data)
      setPhotos(data.photos)
    } catch (err) {
      toast.error('Failed to load task')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDetail() }, [id, worker?.id])

  if (loading) return <LoadingSpinner />
  if (!detail) return (
    <div className="px-4 py-8 text-center">
      <p className="text-gray-500">Task not found</p>
      <Link href="/tasks" className="text-[#0F4C81] text-sm font-semibold mt-2 inline-block">← Back to Tasks</Link>
    </div>
  )

  const task = detail
  const updates = detail.updates || []
  const overdue = isOverdue(task.due_at, task.status)
  const beforePhoto = photos.find((p) => p.photo_type === 'before') || null
  const afterPhoto = photos.find((p) => p.photo_type === 'after') || null

  const handleAccept = async () => {
    setActionLoading(true)
    try {
      await acceptTask(task.id, worker!.id)
      toast.success('Task accepted!')
      await loadDetail()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') }
    finally { setActionLoading(false) }
  }

  const handleStart = async () => {
    setActionLoading(true)
    try {
      await startTask(task.id, worker!.id)
      toast.success('Task started!')
      await loadDetail()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') }
    finally { setActionLoading(false) }
  }

  const handleComplete = async () => {
    setActionLoading(true)
    try {
      await completeTask(task.id, worker!.id, workNote || undefined)
      toast.success('Task completed! 🎉')
      setWorkNote('')
      await loadDetail()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') }
    finally { setActionLoading(false) }
  }

  const handleSaveNote = async () => {
    if (!workNote.trim()) { toast.error('Note cannot be empty'); return }
    setActionLoading(true)
    try {
      await addWorkNote(task.id, worker!.id, workNote)
      toast.success('Note saved')
      setWorkNote('')
      await loadDetail()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') }
    finally { setActionLoading(false) }
  }

  const handleResume = async () => {
    setActionLoading(true)
    try {
      await updateTaskStatus(task.id, worker!.id, 'in_progress', 'Task resumed')
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
    <div className="pb-6">
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

        {/* Section 2: Photos */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Photos</h2>
          <div className="space-y-3">
            <PhotoUpload
              taskId={task.id}
              workerId={worker!.id}
              photoType="before"
              existingPhoto={beforePhoto}
              onUploadComplete={(photo) => setPhotos((prev) => [...prev.filter((p) => p.photo_type !== 'before'), photo])}
            />
            <PhotoUpload
              taskId={task.id}
              workerId={worker!.id}
              photoType="after"
              existingPhoto={afterPhoto}
              onUploadComplete={(photo) => setPhotos((prev) => [...prev.filter((p) => p.photo_type !== 'after'), photo])}
            />
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
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-70"
              >
                {actionLoading ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCheck size={18} />}
                Mark Complete
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
        workerId={worker!.id}
        isOpen={delayModalOpen}
        onClose={() => setDelayModalOpen(false)}
        onSubmit={() => { loadDetail() }}
      />
    </div>
  )
}
