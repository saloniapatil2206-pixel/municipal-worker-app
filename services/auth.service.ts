import { MOCK_WORKER, MOCK_PROFILE } from '@/lib/mock-data'

const isMock = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export async function loginWorker(email: string, password: string) {
  if (isMock()) {
    if (email === 'worker@demo.com' && password === 'demo123') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock_session', JSON.stringify({
          user: { id: 'mock-user-001', email }
        }))
      }
      return { success: true }
    }
    throw new Error('Invalid credentials. Use worker@demo.com / demo123')
  }

  const { supabase } = await import('@/lib/supabase')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function logoutWorker() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mock_session')
  }
  window.location.href = '/login'
}

export async function getCurrentSession() {
  if (isMock()) {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_session')
      return stored ? JSON.parse(stored) : null
    }
    return null
  }
  const { supabase } = await import('@/lib/supabase')
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentWorkerProfile(userId?: string) {
  if (isMock()) {
    return { ...MOCK_WORKER, profile: MOCK_PROFILE }
  }
  const { supabase } = await import('@/lib/supabase')
  const { data, error } = await supabase
    .from('workers')
    .select('*, profile:profiles(*)')
    .eq('profile_id', userId)
    .single()
  if (error) throw new Error(error.message)
  return data
}