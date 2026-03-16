'use client'
import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { updateProfile, uploadProfilePhoto } from '@/services/profile.service'

export function useWorkerProfile() {
  const { session, profile, worker, loading } = useAuth()
  const [updating, setUpdating] = useState(false)

  const update = useCallback(async (data: { full_name?: string; phone?: string; email?: string }) => {
    if (!session?.user.id) throw new Error('Not authenticated')
    setUpdating(true)
    try {
      await updateProfile(session.user.id, data)
    } finally {
      setUpdating(false)
    }
  }, [session])

  const uploadPhoto = useCallback(async (file: File): Promise<string> => {
    if (!session?.user.id) throw new Error('Not authenticated')
    setUpdating(true)
    try {
      return await uploadProfilePhoto(session.user.id, file)
    } finally {
      setUpdating(false)
    }
  }, [session])

  return { profile, worker, loading, updating, update, uploadPhoto }
}
