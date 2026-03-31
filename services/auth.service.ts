import { MOCK_WORKER, MOCK_PROFILE } from '@/lib/mock-data'

const isMock = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export async function loginWorker(email: string, password: string) {
  if (isMock()) {
    if (email === 'worker@demo.com' && password === 'demo123') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock_session', JSON.stringify({
          user: { id: 'mock-user-001', email, username: 'worker', role: 'field_staff', assigned_zone: 'Zone A' }
        }))
      }
      return { success: true }
    }
    throw new Error('Invalid credentials. Use worker@demo.com / demo123')
  }

  const { supabase } = await import('@/lib/supabase')
  
  const usernamePart = email.split('@')[0]
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('password', password)

  if (error) throw new Error(error.message)

  const matchedProfile = profiles?.find(
    (p: any) => p.email === email || p.username === usernamePart
  )

  if (!matchedProfile) throw new Error('Invalid login credentials')

  if (typeof window !== 'undefined') {
    localStorage.setItem(
      'mock_session',
      JSON.stringify({
        user: {
          id: matchedProfile.id,
          username: matchedProfile.username,
          role: matchedProfile.role,
          assigned_zone: matchedProfile.assigned_zone
        }
      })
    )
  }

  return { user: matchedProfile }
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
  
  if (data.session) return data.session
  
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('mock_session')
    return stored ? JSON.parse(stored) : null
  }
  return null
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