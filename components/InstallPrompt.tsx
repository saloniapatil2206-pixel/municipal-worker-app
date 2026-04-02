'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Don't show if user has dismissed it before (for this session)
    if (sessionStorage.getItem('pwa-dismissed')) return

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    sessionStorage.setItem('pwa-dismissed', 'true')
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-[460px] mx-auto animate-slide-up">
      <div className="bg-[#0F4C81] rounded-2xl p-4 shadow-xl flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Install FieldStaff</p>
          <p className="text-white/70 text-xs">Add to home screen for quick access</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-white text-[#0F4C81] px-4 py-2 rounded-xl text-xs font-bold shrink-0 active:bg-gray-100"
        >
          Install
        </button>
        <button onClick={handleDismiss} className="text-white/50 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
