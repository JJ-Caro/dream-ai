-- Migration: Add Jungian Analysis Features
-- Date: 2026-01-25
-- Features: Personal symbols, Active imagination, Dream incubation, 
--           Synchronicity, Lucid dreaming, Sleep data, Community

-- Personal Symbol Dictionary
CREATE TABLE IF NOT EXISTS personal_symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  personal_meaning TEXT NOT NULL,
  first_appeared TIMESTAMPTZ NOT NULL,
  occurrences INTEGER DEFAULT 1,
  associated_emotions TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

CREATE INDEX idx_personal_symbols_user ON personal_symbols(user_id);

-- Active Imagination Sessions
CREATE TABLE IF NOT EXISTS active_imagination_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_id UUID REFERENCES dreams(id) ON DELETE SET NULL,
  figure_name TEXT NOT NULL,
  figure_description TEXT NOT NULL,
  dialogue JSONB DEFAULT '[]',
  insights TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_active_imagination_user ON active_imagination_sessions(user_id);

-- Dream Incubation
CREATE TABLE IF NOT EXISTS dream_incubations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  intention TEXT,
  set_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  linked_dream_ids UUID[] DEFAULT '{}'
);

CREATE INDEX idx_incubations_user ON dream_incubations(user_id);
CREATE INDEX idx_incubations_active ON dream_incubations(user_id, active);

-- Synchronicity Tracker
CREATE TABLE IF NOT EXISTS synchronicities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_id UUID REFERENCES dreams(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  waking_event TEXT NOT NULL,
  dream_connection TEXT NOT NULL,
  significance INTEGER CHECK (significance >= 1 AND significance <= 5),
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_synchronicities_user ON synchronicities(user_id);

-- Dream Signs (for Lucid Dreaming)
CREATE TABLE IF NOT EXISTS dream_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('character', 'location', 'action', 'object', 'emotion')),
  occurrences INTEGER DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL,
  dreams UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dream_signs_user ON dream_signs(user_id);

-- Sleep Data
CREATE TABLE IF NOT EXISTS sleep_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sleep_minutes INTEGER NOT NULL,
  deep_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  awakenings INTEGER,
  sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 100),
  source TEXT NOT NULL CHECK (source IN ('healthkit', 'google_fit', 'manual')),
  linked_dream_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_sleep_data_user ON sleep_data(user_id);
CREATE INDEX idx_sleep_data_date ON sleep_data(user_id, date);

-- Community: Shared Dreams
CREATE TABLE IF NOT EXISTS shared_dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_id UUID NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  anonymous BOOLEAN DEFAULT TRUE,
  display_name TEXT,
  narrative TEXT NOT NULL,
  themes TEXT[] DEFAULT '{}',
  archetypes TEXT[] DEFAULT '{}',
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shared_dreams_created ON shared_dreams(created_at DESC);
CREATE INDEX idx_shared_dreams_user ON shared_dreams(user_id);

-- Community: Likes
CREATE TABLE IF NOT EXISTS dream_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_dream_id UUID NOT NULL REFERENCES shared_dreams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shared_dream_id)
);

-- Community: Comments
CREATE TABLE IF NOT EXISTS dream_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_dream_id UUID NOT NULL REFERENCES shared_dreams(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT TRUE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dream_comments_dream ON dream_comments(shared_dream_id);

-- Helper functions for likes/comments
CREATE OR REPLACE FUNCTION increment_likes(dream_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shared_dreams SET likes = likes + 1 WHERE id = dream_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes(dream_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shared_dreams SET likes = GREATEST(0, likes - 1) WHERE id = dream_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_comments(dream_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shared_dreams SET comments_count = comments_count + 1 WHERE id = dream_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies
ALTER TABLE personal_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_imagination_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_incubations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synchronicities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_comments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can manage their own symbols" ON personal_symbols
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions" ON active_imagination_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own incubations" ON dream_incubations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own synchronicities" ON synchronicities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own dream signs" ON dream_signs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sleep data" ON sleep_data
  FOR ALL USING (auth.uid() = user_id);

-- Shared dreams: visible to all, editable by owner
CREATE POLICY "Shared dreams are publicly readable" ON shared_dreams
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own shared dreams" ON shared_dreams
  FOR ALL USING (auth.uid() = user_id);

-- Likes: users can manage their own
CREATE POLICY "Users can manage their own likes" ON dream_likes
  FOR ALL USING (auth.uid() = user_id);

-- Comments: publicly readable, users manage their own
CREATE POLICY "Comments are publicly readable" ON dream_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own comments" ON dream_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON dream_comments
  FOR DELETE USING (auth.uid() = user_id);
