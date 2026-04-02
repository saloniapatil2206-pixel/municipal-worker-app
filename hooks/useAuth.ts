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
            try {
              const parsed = JSON.parse(stored)
              const userId = parsed?.user?.id
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
              
              if (isUUID) {
                setSession(parsed)
              } else {
                // If it's not a UUID, they carried over a mock session to live mode
                localStorage.removeItem('mock_session')
                setSession(null)
              }
            } catch (e) {
              localStorage.removeItem('mock_session')
            }
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