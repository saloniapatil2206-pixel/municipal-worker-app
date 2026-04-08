'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_WORKER, MOCK_PROFILE } from '@/lib/mock-data'

export function useAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [worker, setWorker] = useState<any>(null)
  const initialized = useRef(false)

  useEffect(() => {
    // Prevent double-initialization in React StrictMode
    if (initialized.current) return
    initialized.current = true

    const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

    // Helper: try to restore session from localStorage
    const restoreLocalSession = () => {
      const stored = localStorage.getItem('mock_session')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          const userId = parsed?.user?.id
          if (userId) {
            // Accept any valid user ID (UUID from DB or auto-generated)
            setSession(parsed)
            setProfile(parsed.user)
            return true
          }
        } catch (e) {
          localStorage.removeItem('mock_session')
        }
      }
      return false
    }

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

    // Real mode: first check localStorage (custom login), then Supabase Auth
    // The login page uses direct DB lookup and stores session in localStorage,
    // so localStorage is the primary source of truth.
    const hasLocal = restoreLocalSession()
    if (hasLocal) {
      setLoading(false)
      return
    }

    // Fallback: check Supabase Auth session (for users who logged in via Supabase Auth)
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setSession(data.session)
        }
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const logout = async () => {
    localStorage.removeItem('mock_session')
    initialized.current = false
    router.replace('/')
  }

  return { session, profile, worker, loading, logout }
}