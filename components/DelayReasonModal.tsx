'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { submitDelayReason } from '@/services/delay.service'
import toast from 'react-hot-toast'

const DELAY_REASONS = [
  { value: 'material_unavailable', label: 'Material Unavailable' },
  { value: 'equipment_issue', label: 'Equipment Issue' },
  { value: 'bad_weather', label: 'Bad Weather' },
  { value: 'traffic_blocked', label: 'Traffic Blocked' },
  { value: 'manpower_shortage', label: 'Manpower Shortage' },
  { value: 'safety_issue', label: 'Safety Issue' },
  { value: 'waiting_approval', label: 'Waiting for Approval' },
  { value: 'area_inaccessible', label: 'Area Inaccessible' },
  { value: 'other', label: 'Other' },
]

interface DelayReasonModalProps {
  taskId: string
  workerId: string
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

export default function DelayReasonModal({ taskId, workerId, isOpen, onClose, onSubmit }: DelayReasonModalProps) {
  const [reasonType, setReasonType] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!reasonType) { setError('Please select a reason'); return }
    if (reasonType === 'other' && !customReason.trim()) { setError('Please describe the reason'); return }
    setSubmitting(true)
    setError('')
    try {
      await submitDelayReason(taskId, workerId, reasonType, reasonType === 'other' ? customReason : undefined)
      toast.success('Delay reason submitted')
      onSubmit()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-[480px] bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Report Delay Reason</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {DELAY_REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-[#0F4C81] hover:bg-blue-50 transition-colors">
              <input
                type="radio"
                name="delay_reason"
                value={r.value}
                checked={reasonType === r.value}
                onChange={() => { setReasonType(r.value); setError('') }}
                className="accent-[#0F4C81]"
              />
              <span className="text-sm text-gray-800">{r.label}</span>
            </label>
          ))}
        </div>

        {reasonType === 'other' && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Describe the reason..."
            rows={3}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 mb-3"
          />
        )}

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-red-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-70"
        >
          {submitting ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : null}
          {submitting ? 'Submitting…' : 'Submit Delay Report'}
        </button>
      </div>
    </div>
  )
}
