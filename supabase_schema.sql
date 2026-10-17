-- ==============================================================================
-- Daybreak — Supabase Database Schema
-- Run this script in your Supabase Project -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT 'Reader',
  email TEXT,
  photo_url TEXT,
  reading_minutes INTEGER DEFAULT 10,
  reading_depth TEXT DEFAULT 'Standard',
  timezone TEXT DEFAULT 'UTC',
  delivery_time TEXT DEFAULT '07:00',
  discovery_enabled BOOLEAN DEFAULT true,
  explicit_topics JSONB DEFAULT '["Technology", "Science", "World", "Climate & Environment"]'::jsonb,
  specific_interests JSONB DEFAULT '[]'::jsonb,
  region TEXT DEFAULT 'Global',
  city TEXT DEFAULT '',
  learned_preferences JSONB DEFAULT '{}'::jsonb,
  search_signals JSONB DEFAULT '{}'::jsonb,
  likes JSONB DEFAULT '[]'::jsonb,
  dislikes JSONB DEFAULT '[]'::jsonb,
  skipped JSONB DEFAULT '[]'::jsonb,
  onboarding_completed BOOLEAN DEFAULT false,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Saved Stories / Bookmarks Table
CREATE TABLE IF NOT EXISTS public.saved_stories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  article_id TEXT NOT NULL,
  item JSONB NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_stories_user_id ON public.saved_stories (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_stories_saved_at ON public.saved_stories (saved_at DESC);

-- 3. Daily Editions Archive Table
CREATE TABLE IF NOT EXISTS public.editions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  edition_date TEXT NOT NULL,
  formatted_date TEXT NOT NULL,
  greeting TEXT,
  headline TEXT,
  revision INTEGER DEFAULT 1,
  story_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 10,
  status TEXT DEFAULT 'published',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  recap_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
  reflection_note TEXT,
  publisher_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_editions_user_date ON public.editions (user_id, edition_date);
CREATE INDEX IF NOT EXISTS idx_editions_created_at ON public.editions (created_at DESC);

-- 4. User Interactions & Feedback Table (likes, dislikes, skips, reads)
CREATE TABLE IF NOT EXISTS public.interactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  article_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_user ON public.interactions (user_id);

-- Disable RLS for easy hackathon use (or enable with open policies)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.editions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions DISABLE ROW LEVEL SECURITY;
