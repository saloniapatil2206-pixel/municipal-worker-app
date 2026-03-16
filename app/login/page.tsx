'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginSchema } from '@/utils/validators'
import { loginWorker } from '@/services/auth.service'
import toast from 'react-hot-toast'
import { Eye, EyeOff, HardHat } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginSchema) => {
    try {
      await loginWorker(data.email, data.password)
      toast.success('Welcome back!')
      router.push('/home')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F4C81] via-[#1254A0] to-[#0a3560] flex items-center justify-center p-5">
      <div className="w-full max-w-[400px]">

        {/* Logo / App Name */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mb-5 shadow-xl">
            <HardHat size={38} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MuniWork</h1>
          <p className="text-white/60 text-sm mt-2 font-medium">Municipal Maintenance Worker App</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign In</h2>
          <p className="text-sm text-gray-500 mb-7">Access your assigned tasks</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                {...register('email')}
                placeholder="worker@municipality.gov"
                className={`w-full px-4 py-3.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-[#0F4C81]'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 pr-12 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-[#0F4C81]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#0F4C81] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#0F4C81]/30 hover:bg-[#1A6DB5] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Contact your supervisor to get access credentials
          </p>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          MuniWork v1.0 · Secure Municipal Platform
        </p>
      </div>
    </div>
  )
}
