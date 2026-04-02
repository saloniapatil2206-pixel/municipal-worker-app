'use client'

import React, { useState } from 'react'
import { Camera, CheckCheck, X, Image as ImageIcon, CheckCircle, FileText, Loader } from 'lucide-react'
import WorkerCameraCapture from './WorkerCameraCapture'
import Image from 'next/image'

interface TaskCompletionModalProps {
  taskId: string
  existingBeforePhotoUrl?: string | null
  onClose: () => void
  onSubmit: (
    beforeData: { dataUrl: string; metadata: any } | null,
    afterData: { dataUrl: string; metadata: any; resolutionNotes: string }
  ) => void
  isSubmitting: boolean
}

export default function TaskCompletionModal({
  taskId,
  existingBeforePhotoUrl,
  onClose,
  onSubmit,
  isSubmitting
}: TaskCompletionModalProps) {
  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<'BEFORE' | 'AFTER'>('BEFORE')

  const [beforeCapture, setBeforeCapture] = useState<{ dataUrl: string; metadata: any } | null>(null)
  const [afterCapture, setAfterCapture] = useState<{ dataUrl: string; metadata: any; resolutionNotes: string } | null>(null)

  const handleCapture = (dataUrl: string, metadata: any) => {
    if (cameraMode === 'BEFORE') {
      setBeforeCapture({ dataUrl, metadata })
    } else {
      setAfterCapture({ dataUrl, metadata, resolutionNotes: metadata.resolutionNotes || '' })
    }
    setShowCamera(false)
  }

  const handleComplete = () => {
    if (!afterCapture) return
    if (!existingBeforePhotoUrl && !beforeCapture) return
    
    onSubmit(beforeCapture, afterCapture)
  }

  const hasBefore = !!existingBeforePhotoUrl || !!beforeCapture
  const hasAfter = !!afterCapture
  const canSubmit = hasBefore && hasAfter && !isSubmitting

  if (showCamera) {
    return (
      <WorkerCameraCapture
        mode={cameraMode}
        onCapture={handleCapture}
        onClose={() => setShowCamera(false)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-5">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Complete Task</h2>
            <p className="text-xs text-gray-500 font-medium">Verify completion with photos</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          
          {/* Before Photo Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <div className={`p-1 rounded-md ${hasBefore ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {hasBefore ? <CheckCircle size={14} /> : <Camera size={14} />}
                </div>
                1. Before Work Photo
              </label>
            </div>
            
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200">
              {existingBeforePhotoUrl ? (
                <>
                  <Image src={existingBeforePhotoUrl} alt="Before Photo" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white text-xs font-medium px-2 py-1 bg-black/40 backdrop-blur-md rounded-md flex items-center gap-1.5">
                    <CheckCheck size={12} className="text-green-400" /> Existing verification
                  </div>
                </>
              ) : beforeCapture ? (
                <>
                  <Image src={beforeCapture.dataUrl} alt="Before Captured" fill className="object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button 
                      onClick={() => { setCameraMode('BEFORE'); setShowCamera(true); }}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-gray-700 shadow-sm hover:bg-white"
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => { setCameraMode('BEFORE'); setShowCamera(true); }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-[#0F4C81] hover:bg-[#0F4C81]/5 transition-colors"
                >
                  <div className="bg-blue-50 p-3 rounded-full mb-2">
                    <Camera size={24} />
                  </div>
                  <span className="text-sm font-semibold">Tap to capture before</span>
                </button>
              )}
            </div>
          </div>

          {/* After Photo Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <div className={`p-1 rounded-md ${hasAfter ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {hasAfter ? <CheckCircle size={14} /> : <ImageIcon size={14} />}
                </div>
                2. After Work Photo
              </label>
            </div>

            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200">
              {afterCapture ? (
                <>
                  <Image src={afterCapture.dataUrl} alt="After Captured" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-2 right-2">
                    <button 
                      onClick={() => { setCameraMode('AFTER'); setShowCamera(true); }}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-gray-700 shadow-sm hover:bg-white"
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                  {afterCapture.resolutionNotes && (
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-0.5 flex flex-center gap-1"><FileText size={10} /> Notes</p>
                      <p className="text-xs font-medium line-clamp-1 truncate">{afterCapture.resolutionNotes}</p>
                    </div>
                  )}
                </>
              ) : (
                <button 
                  disabled={!hasBefore}
                  onClick={() => { setCameraMode('AFTER'); setShowCamera(true); }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:grayscale disabled:hover:bg-transparent"
                >
                  <div className="bg-green-50 p-3 rounded-full mb-2">
                    <CheckCheck size={24} />
                  </div>
                  <span className="text-sm font-semibold">{hasBefore ? 'Tap to capture completed work' : 'Capture Before photo first'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-white border-t border-gray-100">
          <button
            onClick={handleComplete}
            disabled={!canSubmit}
            className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]
              bg-[#0F4C81] text-white hover:bg-[#1A6DB5] disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:active:scale-100"
          >
            {isSubmitting ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCheck size={20} />
            )}
            {isSubmitting ? 'Submitting Verification...' : 'Complete Task'}
          </button>
        </div>

      </div>
    </div>
  )
}
