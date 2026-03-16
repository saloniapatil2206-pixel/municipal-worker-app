'use client'

import { useState, useEffect } from 'react'
import { User, Phone, Mail, Building, MapPin, Hash, Shield, Camera, Edit2, Save, X } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { MOCK_PROFILE, MOCK_WORKER } from '@/lib/mock-data'
import Image from 'next/image'


export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [worker, setWorker] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

      if (isMock) {
        setProfile(MOCK_PROFILE)
        setWorker(MOCK_WORKER)
        setForm({
          full_name: MOCK_PROFILE.full_name || '',
          phone: MOCK_PROFILE.phone || '',
          email: MOCK_PROFILE.email || '',
        })
        return
      }

      // Real Supabase fetch
      const { fetchProfile } = await import('@/services/profile.service')
      const session = JSON.parse(localStorage.getItem('mock_session') || '{}')
      const data = await fetchProfile(session?.user?.id)
      setProfile(data)
      setWorker(data.worker)
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        email: data.email || '',
      })
    } catch (err: any) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

      if (isMock) {
        // Update mock profile in memory
        setProfile((prev: any) => ({ ...prev, ...form }))
        setEditing(false)
        toast.success('Profile updated!')
        return
      }

      const { updateProfile } = await import('@/services/profile.service')
      const session = JSON.parse(localStorage.getItem('mock_session') || '{}')
      await updateProfile(session?.user?.id, form)
      setProfile((prev: any) => ({ ...prev, ...form }))
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F4C81]" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <User className="w-12 h-12 mb-2" />
        <p>Profile not found</p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-sm text-[#0F4C81] font-medium"
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        ) : (
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-1 text-sm text-gray-500 font-medium"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 rounded-full bg-[#0F4C81] flex items-center justify-center mb-3">
          {profile.profile_photo ? (
            <Image
              src={profile.profile_photo}
              alt="Profile"
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <User size={40} className="text-white" />
          )}
          {editing && (
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow border border-gray-200">
              <Camera className="w-4 h-4 text-[#0F4C81]" />
            </button>
          )}
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {profile.full_name || 'Worker'}
        </h2>
        <span className="text-sm text-gray-500 capitalize">{profile.role}</span>
      </div>

      {/* Editable Fields */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 mb-4">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Personal Info
        </p>

        {/* Full Name */}
        <div className="flex items-center gap-3 px-4 py-3">
          <User className="w-5 h-5 text-[#0F4C81] shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Full Name</p>
            {editing ? (
              <input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
            ) : (
              <p className="text-sm font-medium text-gray-800">{profile.full_name || '—'}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Phone className="w-5 h-5 text-[#0F4C81] shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Phone</p>
            {editing ? (
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
            ) : (
              <p className="text-sm font-medium text-gray-800">{profile.phone || '—'}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Mail className="w-5 h-5 text-[#0F4C81] shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Email</p>
            {editing ? (
              <input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
            ) : (
              <p className="text-sm font-medium text-gray-800">{profile.email || '—'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Read-only Fields */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 mb-6">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Work Info
        </p>

        <div className="flex items-center gap-3 px-4 py-3">
          <Hash className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Worker ID</p>
            <p className="text-sm font-medium text-gray-800">{worker?.worker_code || 'WRK001'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <Shield className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Role</p>
            <p className="text-sm font-medium text-gray-800 capitalize">{profile.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <Building className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Department</p>
            <p className="text-sm font-medium text-gray-800">{worker?.department || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Sector</p>
            <p className="text-sm font-medium text-gray-800">{worker?.sector || '—'}</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {editing && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#0F4C81] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      )}

      {/* Logout */}
      <button
        onClick={() => {
          localStorage.removeItem('mock_session')
          window.location.href = '/login'
        }}
        className="w-full mt-3 border border-red-200 text-red-500 font-semibold py-3 rounded-xl"
      >
        Logout
      </button>
    </div>
  )
}