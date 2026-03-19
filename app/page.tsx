'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast, { Toaster } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, HardHat } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

async function loginWorker(email: string, password: string) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

  console.log('MOCK MODE:', isMock)
  console.log('Email entered:', email)

  if (isMock) {
    if (email === 'worker@demo.com' && password === 'demo123') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'mock_session',
          JSON.stringify({ user: { id: 'mock-user-001', email } })
        )
      }
      return { success: true }
    }
    throw new Error('Invalid credentials. Use worker@demo.com / demo123')
  }

  // Real Supabase login (only used when MOCK_MODE is false)
  const { createBrowserClient } = await import('@supabase/ssr')
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw new Error(error.message)
  return data
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      console.log('=== LOGIN STARTED ===')
      console.log('Email:', data.email)
      console.log('Mock mode:', process.env.NEXT_PUBLIC_MOCK_MODE)

      await loginWorker(data.email, data.password)

      console.log('=== LOGIN SUCCESS ===')
      console.log('Redirecting to /home...')

      toast.success('Login successful! Redirecting...')

      setTimeout(() => {
        console.log('Executing redirect now...')
        router.replace('/home')
      }, 800)

    } catch (error: any) {
      console.log('=== LOGIN FAILED ===', error.message)
      toast.error(error.message || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0F4C81] to-[#1A6DB5] px-4">
      <Toaster position="top-center" />

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-white/20 rounded-full p-4 mb-4">
          <HardHat className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">MuniWork</h1>
        <p className="text-white/70 text-sm mt-1">Municipal Maintenance Worker App</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign In</h2>
        <p className="text-gray-500 text-sm mb-6">Access your assigned tasks</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="worker@demo.com"
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] transition ${errors.email ? 'border-red-400' : 'border-gray-300'
                }`}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] transition pr-12 ${errors.password ? 'border-red-400' : 'border-gray-300'
                  }`}
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F4C81] hover:bg-[#1A6DB5] text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-5">
          Contact your supervisor to get access credentials
        </p>
      </div>

      <p className="text-white/40 text-xs mt-8">
        MuniWork v1.0 · Secure Municipal Platform
      </p>
    </div>
  )
}