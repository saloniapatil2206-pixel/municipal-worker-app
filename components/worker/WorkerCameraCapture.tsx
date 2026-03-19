'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Camera, X, RefreshCw, MapPin, Loader, Check, ArrowRight } from 'lucide-react'
import { reverseGeocode } from '@/utils/geocoding'
import { embedMetadataOnPhoto } from '@/utils/photoMetadata'
import toast from 'react-hot-toast'

interface WorkerCameraCaptureProps {
  mode: 'BEFORE' | 'AFTER'
  onCapture: (dataUrl: string, metadata: any) => void
  onClose: () => void
}

export default function WorkerCameraCapture({ mode, onCapture, onClose }: WorkerCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [capturing, setCapturing] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')

  useEffect(() => {
    startCamera()
    fetchLocation()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      setLoading(true)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Camera access error:', err)
      toast.error('Could not access camera. Please check permissions.')
    } finally {
      setLoading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        
        // Reverse geocode
        const addr = await reverseGeocode(latitude, longitude)
        setAddress(addr)
      },
      (err) => {
        console.error('Location error:', err)
        toast.error('Failed to get location. Ensure GPS is on.')
      },
      { enableHighAccuracy: true }
    )
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !location) {
      toast.error('Missing camera or location data')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setCapturing(true)

    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Embed metadata watermark
    embedMetadataOnPhoto(canvas, {
      lat: location.lat,
      lng: location.lng,
      address: address || 'Address unavailable',
      date: new Date(),
      mode: mode
    })

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(dataUrl)
    setCapturing(false)
    stopCamera()
  }

  const handleRetake = () => {
    setCapturedImage(null)
    startCamera()
  }

  const handleConfirm = () => {
    if (capturedImage && location) {
      onCapture(capturedImage, {
        lat: location.lat,
        lng: location.lng,
        address: address,
        timestamp: new Date().toISOString(),
        resolutionNotes: mode === 'AFTER' ? resolutionNotes : undefined
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col font-sans">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onClose} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
          <X className="w-6 h-6" />
        </button>
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold text-white ${
          mode === 'BEFORE' ? 'bg-orange-500 shadow-lg shadow-orange-500/30' : 'bg-green-500 shadow-lg shadow-green-500/30'
        }`}>
          {mode} PHOTO CAPTURE
        </div>
        <button onClick={fetchLocation} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {loading && !capturedImage && (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader className="w-10 h-10 animate-spin text-blue-400" />
            <p className="font-medium animate-pulse">Initializing camera...</p>
          </div>
        )}

        {/* Video Preview */}
        {!capturedImage && (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="w-full h-full relative">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            
            {mode === 'AFTER' && (
              <div className="absolute inset-x-0 bottom-40 px-6 z-20">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Resolution Notes</label>
                  <textarea 
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the issue was fixed..."
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-800 placeholder-gray-400 resize-none h-20"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas for processing (hidden) */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Controls */}
      <div className="bg-black/80 backdrop-blur-lg p-6 pb-10">
        {!capturedImage ? (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 text-white/70">
              <MapPin className="w-4 h-4" />
              <span className="text-xs truncate max-w-[250px]">
                {address || (location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Fetching location...')}
              </span>
            </div>
            
            <button 
              disabled={loading || !location}
              onClick={capturePhoto}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-90 ${
                loading || !location ? 'opacity-50 grayscale' : 'hover:scale-105'
              }`}
            >
              <div className={`w-14 h-14 rounded-full ${mode === 'BEFORE' ? 'bg-orange-500' : 'bg-green-500'}`} />
            </button>
            <p className="text-white/50 text-xs font-medium">Capture photo at current location</p>
          </div>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={handleRetake}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors border border-white/10"
            >
              <RefreshCw className="w-5 h-5" />
              Retake
            </button>
            <button 
              onClick={handleConfirm}
              className={`flex-1 ${mode === 'BEFORE' ? 'bg-orange-500' : 'bg-green-500'} hover:opacity-90 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg`}
            >
              <Check className="w-5 h-5" />
              Confirm & Save
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
