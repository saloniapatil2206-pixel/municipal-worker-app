'use client'
import { useState, useRef } from 'react'
import { Camera, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { uploadTaskPhoto } from '@/services/photo.service'
import type { TaskPhoto } from '@/types'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

interface PhotoUploadProps {
  taskId: string
  workerId: string
  photoType: 'before' | 'after'
  existingPhoto?: TaskPhoto | null
  onUploadComplete: (photo: TaskPhoto) => void
}

export default function PhotoUpload({ taskId, workerId, photoType, existingPhoto, onUploadComplete }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG files allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setError(null)
    try {
      const photo = await uploadTaskPhoto(taskId, workerId, photoType, selectedFile)
      onUploadComplete(photo)
      setPreview(null)
      setSelectedFile(null)
      toast.success(`${photoType === 'before' ? 'Before' : 'After'} photo uploaded!`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const label = photoType === 'before' ? 'Before Photo' : 'After Photo'
  const displayPhoto = existingPhoto?.photo_url || null

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 flex items-center gap-2 border-b border-gray-100">
        <Camera size={14} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {displayPhoto && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle2 size={12} /> Uploaded
          </span>
        )}
      </div>

      <div className="p-3">
        {/* Show existing photo */}
        {displayPhoto && !preview && (
          <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2">
            <Image src={displayPhoto} alt={label} fill className="object-cover" />
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2">
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-1.5 text-red-600 text-xs mb-2">
            <AlertCircle size={12} />
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-gray-300 text-sm text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Camera size={16} />
            {displayPhoto ? 'Replace' : 'Select'}
          </button>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#0F4C81] text-white text-sm font-medium hover:bg-[#1A6DB5] transition-colors disabled:opacity-70"
            >
              {uploading ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Upload size={16} />
              )}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  )
}
