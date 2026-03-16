# MuniWork — AI-Based Municipal Maintenance Scheduler

MuniWork is a mobile-first Worker MVP for an AI-Based Municipal Maintenance Scheduler. Built with **Next.js 14 (App Router)**, **Tailwind CSS**, and **Supabase**, it provides workers with a streamlined interface to manage tasks, upload photos, report delays, and view performance reports.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Backend/DB**: Supabase (Postgres + Auth + Storage)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Validation**: Zod + React Hook Form
- **Language**: TypeScript

## 🛠️ Prerequisites

- Node.js 18.17 or later
- A Supabase Project ([supabase.com](https://supabase.com))

## 📦 Local Setup

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Set up Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Supabase Database Setup**
   - Go to your Supabase Project -> SQL Editor.
   - Copy the contents of `supabase/schema.sql` and run it.
5. **Supabase Storage Setup**
   - Create two public buckets in Supabase Storage:
     - `task-photos`
     - `profile-photos`
   - Add the storage RLS policies provided in the schema or via the dashboard (see prompt instructions).
6. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📂 Project Structure

```text
/app             - Next.js 14 App Router (Pages & Layouts)
/components      - Reusable UI components
/hooks           - Custom React hooks
/lib             - Supabase client configurations
/services        - Business logic and API calls
/types           - TypeScript interfaces
/utils           - Helper functions and validators
/supabase        - SQL schema definitions
```

## 🔐 Database & Auth Notes

- **Profiles & Workers**: The `profiles` table automatically extends `auth.users` via a trigger. The `workers` table links to a profile.
- **RLS**: Row Level Security is enabled on all tables. Workers can only see and update tasks assigned to them.
- **Storage**: Photos are stored in the `task-photos` bucket, partitioned by `worker_id/task_id/photo_type/`.

## 🤝 Admin Dashboard Integration

This Worker app is designed to share the same Supabase project as an Admin Dashboard. The Admin app should write to the `tasks`, `workers`, and `task_assignments` tables, which this app then consumes.