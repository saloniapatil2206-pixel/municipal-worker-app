'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_WORKER, MOCK_PROFILE } from '@/lib/mock-data'

export function useAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [worker, setWorker] = useState<any>(null)

  useEffect(() => {
    const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

    if (isMock) {
      const stored = localStorage.getItem('mock_session')
      if (stored) {
        setSession(JSON.parse(stored))
        setProfile(MOCK_PROFILE)
        setWorker(MOCK_WORKER)
      }
      setLoading(false)
      return
    }

    // Real Supabase session check
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setSession(data.session)
        } else {
          // Check local custom session for backwards compatibility
          const stored = localStorage.getItem('mock_session')
          if (stored) {
            setSession(JSON.parse(stored))
          }
        }
        setLoading(false)
      })
    })
  }, [])

  const logout = async () => {
    localStorage.removeItem('mock_session')
    router.replace('/')
  }

  return { session, profile, worker, loading, logout }
}