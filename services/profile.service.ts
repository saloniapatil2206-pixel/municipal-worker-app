import { MOCK_WORKER, MOCK_PROFILE } from '@/lib/mock-data'

const isMock = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export async function fetchProfile(userId: string) {
  if (isMock()) {
    return { ...MOCK_PROFILE, worker: MOCK_WORKER }
  }
  const { supabase } = await import('@/lib/supabase')
  const { data, error } = await supabase
    .from('profiles')
    .select('*, worker:workers(*)')
    .eq('id', userId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; phone?: string; email?: string }
) {
  if (isMock()) {
    Object.assign(MOCK_PROFILE, updates)
    return MOCK_PROFILE
  }
  const { supabase } = await import('@/lib/supabase')
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function uploadProfilePhoto(userId: string, file: File) {
  if (isMock()) {
    const fakeUrl = URL.createObjectURL(file)
    MOCK_PROFILE.profile_photo = fakeUrl
    return fakeUrl
  }
  const { supabase } = await import('@/lib/supabase')
  const ext = file.name.split('.').pop()
  const path = `profiles/${userId}/avatar.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(path, file, { upsert: true })
  if (uploadError) throw new Error(uploadError.message)
  const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
  await supabase.from('profiles').update({ profile_photo: data.publicUrl }).eq('id', userId)
  return data.publicUrl
}