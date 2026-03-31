'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, HardHat } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ProtectedLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, worker, loading } = useAuth()
  const { unreadCount } = useNotifications(worker?.id)

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login')
    }
  }, [session, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="app-shell">
      {/* Top header */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-white border-b border-gray-100 shadow-sm h-[56px] flex items-center px-4">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-8 h-8 bg-[#0F4C81] rounded-xl flex items-center justify-center">
            <HardHat size={18} className="text-white" />
          </div>
          <span className="text-base font-bold text-[#0F4C81] tracking-tight">FieldStaff</span>
        </div>
        <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Bell size={22} className="text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* Page content */}
      <main className="pt-14 pb-20">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
