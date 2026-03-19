-- Run this in Supabase SQL Editor:
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS before_photo_metadata JSONB,
  ADD COLUMN IF NOT EXISTS before_photo_taken_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS after_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS after_photo_metadata JSONB,
  ADD COLUMN IF NOT EXISTS after_photo_taken_at TIMESTAMPTZ;

-- Note: Using 'tasks' table instead of 'issues' to match existing project structure.
-- If 'issues' table is required, rename 'tasks' to 'issues' or create 'issues' table first.
