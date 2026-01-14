-- Dream AI: Row Level Security (RLS) Policies
-- Run this migration in your Supabase SQL Editor to enable data isolation

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE IF EXISTS dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weekly_reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DREAMS TABLE POLICIES
-- Users can only access their own dreams
-- =====================================================

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view own dreams" ON dreams;
DROP POLICY IF EXISTS "Users can insert own dreams" ON dreams;
DROP POLICY IF EXISTS "Users can update own dreams" ON dreams;
DROP POLICY IF EXISTS "Users can delete own dreams" ON dreams;

-- Create policies
CREATE POLICY "Users can view own dreams"
  ON dreams
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dreams"
  ON dreams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dreams"
  ON dreams
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dreams"
  ON dreams
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PROFILES TABLE POLICIES
-- Users can only access their own profile
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- WEEKLY_REPORTS TABLE POLICIES
-- Users can only access their own weekly reports
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own reports" ON weekly_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON weekly_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON weekly_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON weekly_reports;

-- Create policies
CREATE POLICY "Users can view own reports"
  ON weekly_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON weekly_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON weekly_reports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
  ON weekly_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES (run to verify RLS is enabled)
-- =====================================================

-- Check RLS status on tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- List all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public';
