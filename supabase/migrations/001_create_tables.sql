-- ====================================================================
-- DAYBREAK — SUPABASE DATABASE MIGRATION & ROW LEVEL SECURITY POLICIES
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  reading_duration_minutes INTEGER DEFAULT 10 CHECK (reading_duration_minutes IN (5, 10, 20)),
  timezone TEXT DEFAULT 'America/New_York',
  delivery_time TIME DEFAULT '07:00',
  discovery_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and edit their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- 2. User Interests Table
CREATE TABLE IF NOT EXISTS public.user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  weight NUMERIC DEFAULT 0.0,
  is_explicit BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their interests"
  ON public.user_interests FOR ALL
  USING (auth.uid() = user_id);

-- 3. Sources Table (Verified RSS allowlist)
CREATE TABLE IF NOT EXISTS public.sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  last_status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on approved sources"
  ON public.sources FOR SELECT
  TO authenticated, anon
  USING (true);

-- 4. Articles Table (Shared across readers)
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  canonical_url TEXT NOT NULL UNIQUE,
  publisher TEXT NOT NULL,
  headline TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  raw_excerpt TEXT,
  brief_summary TEXT,
  takeaways JSONB DEFAULT '[]'::jsonb,
  topic TEXT NOT NULL,
  image_url TEXT,
  attribution TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_topic_published ON public.articles(topic, published_at DESC);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on articles"
  ON public.articles FOR SELECT
  TO authenticated, anon
  USING (true);

-- 5. Editions Table (Dated reader snapshot)
CREATE TABLE IF NOT EXISTS public.editions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  edition_date DATE NOT NULL,
  revision INTEGER DEFAULT 1,
  story_count INTEGER NOT NULL,
  reading_time_minutes INTEGER NOT NULL,
  status TEXT DEFAULT 'published',
  recap_takeaways JSONB DEFAULT '[]'::jsonb,
  reflection_note TEXT,
  publisher_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_edition_date_rev UNIQUE (user_id, edition_date, revision)
);

CREATE INDEX IF NOT EXISTS idx_editions_user_date ON public.editions(user_id, edition_date DESC);
ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own editions"
  ON public.editions FOR ALL
  USING (auth.uid() = user_id);

-- 6. Edition Items (Immutable ordered snapshot)
CREATE TABLE IF NOT EXISTS public.edition_items (
  id TEXT PRIMARY KEY,
  edition_id TEXT REFERENCES public.editions(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT REFERENCES public.articles(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL,
  section TEXT NOT NULL,
  headline TEXT NOT NULL,
  brief_summary TEXT NOT NULL,
  takeaways JSONB DEFAULT '[]'::jsonb,
  selection_reason TEXT NOT NULL,
  publisher TEXT NOT NULL,
  source_url TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edition_items_order ON public.edition_items(edition_id, sort_order ASC);
ALTER TABLE public.edition_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access items of their editions"
  ON public.edition_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.editions
      WHERE editions.id = edition_items.edition_id
      AND editions.user_id = auth.uid()
    )
  );

-- 7. Saved Articles (Bookmarks)
CREATE TABLE IF NOT EXISTS public.saved_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_article_save UNIQUE (user_id, article_id)
);

ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their saved articles"
  ON public.saved_articles FOR ALL
  USING (auth.uid() = user_id);

-- 8. Interactions (Feedback and reads)
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('more_like_this', 'less_like_this', 'save', 'skip', 'read')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their interactions"
  ON public.interactions FOR ALL
  USING (auth.uid() = user_id);
