-- profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'admin')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  profile_photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- workers table
CREATE TABLE workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  department TEXT,
  sector TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  worker_code TEXT UNIQUE
);

-- tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sector TEXT,
  location_address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  severity TEXT,
  created_by_admin_id UUID REFERENCES profiles(id),
  due_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('assigned','accepted','in_progress','completed','delayed')) DEFAULT 'assigned',
  admin_note TEXT,
  citizen_complaint_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- task_assignments
CREATE TABLE task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- task_updates (activity log)
CREATE TABLE task_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id),
  status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- task_photos
CREATE TABLE task_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id),
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('before', 'after')),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- delay_reports
CREATE TABLE delay_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id),
  reason_type TEXT NOT NULL,
  custom_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT CHECK (type IN ('new_task','due_soon','overdue','admin_note','task_closure')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE delay_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Workers can only see their own profile
CREATE POLICY "worker_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "worker_own_worker" ON workers FOR ALL USING (profile_id = auth.uid());

-- Workers can only see tasks assigned to them (via task_assignments)
CREATE POLICY "worker_assigned_tasks" ON tasks FOR SELECT
  USING (id IN (
    SELECT task_id FROM task_assignments
    WHERE worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid())
  ));

CREATE POLICY "worker_update_own_tasks" ON tasks FOR UPDATE
  USING (id IN (
    SELECT task_id FROM task_assignments
    WHERE worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid())
  ));

CREATE POLICY "worker_own_assignments" ON task_assignments FOR SELECT
  USING (worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid()));

CREATE POLICY "worker_own_task_updates" ON task_updates FOR ALL
  USING (worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid()));

CREATE POLICY "worker_own_photos" ON task_photos FOR ALL
  USING (worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid()));

CREATE POLICY "worker_own_delays" ON delay_reports FOR ALL
  USING (worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid()));

CREATE POLICY "worker_own_notifications" ON notifications FOR ALL
  USING (worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid()));

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
