-- =====================================================
-- SUPABASE MIGRATIONS FOR WENS CRM
-- Run these SQL statements in the Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. DOVOLENKY (Vacations) TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS dovolenky (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE dovolenky ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view all dovolenky
CREATE POLICY "Authenticated users can view all dovolenky" ON dovolenky
  FOR SELECT TO authenticated USING (true);

-- Policy: All authenticated users can insert dovolenky
CREATE POLICY "Authenticated users can insert dovolenky" ON dovolenky
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policy: Users can update their own dovolenky
CREATE POLICY "Users can update own dovolenky" ON dovolenky
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Policy: Users can delete their own dovolenky
CREATE POLICY "Users can delete own dovolenky" ON dovolenky
  FOR DELETE TO authenticated USING (created_by = auth.uid());


-- =====================================================
-- 2. TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_name TEXT NOT NULL,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vseobecna', 'specificka')),
  text TEXT NOT NULL,
  spis_id UUID,
  spis_cislo TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tasks they sent or received
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Policy: All authenticated users can insert tasks
CREATE POLICY "Authenticated users can insert tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (from_user_id = auth.uid());

-- Policy: Recipients can update tasks (to mark as read)
CREATE POLICY "Recipients can update tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (to_user_id = auth.uid());

-- Policy: Sender or recipient can delete tasks
CREATE POLICY "Sender or recipient can delete tasks" ON tasks
  FOR DELETE TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_from_user ON tasks(from_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_to_user ON tasks(to_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
