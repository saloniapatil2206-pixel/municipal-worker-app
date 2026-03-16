import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional(),
})

export const workNoteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').max(500, 'Note too long'),
})

export const delayReasonSchema = z.object({
  reason_type: z.string().min(1, 'Please select a reason'),
  custom_reason: z.string().optional(),
})

export type LoginSchema = z.infer<typeof loginSchema>
export type ProfileUpdateSchema = z.infer<typeof profileUpdateSchema>
export type WorkNoteSchema = z.infer<typeof workNoteSchema>
export type DelayReasonSchema = z.infer<typeof delayReasonSchema>
