-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  instagram_id TEXT UNIQUE NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'post' CHECK (post_type IN ('post', 'reel', 'carousel')),
  caption TEXT,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER,
  location_name TEXT,
  author_username TEXT NOT NULL,
  author_profile_pic TEXT,
  thumbnail_url TEXT,
  media_url TEXT,
  permalink TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  caption_search TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', COALESCE(caption, ''))) STORED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts (like_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts (post_type);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN (hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_caption_search ON posts USING GIN (caption_search);
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts (location_name);
CREATE INDEX IF NOT EXISTS idx_posts_not_hidden ON posts (is_hidden) WHERE is_hidden = FALSE;

-- Collection logs table
CREATE TABLE IF NOT EXISTS collection_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'success', 'error')),
  posts_collected INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_logs ENABLE ROW LEVEL SECURITY;

-- Public read-only for posts
CREATE POLICY "Allow public read" ON posts
  FOR SELECT USING (true);

-- Service role can do everything (handled by service_role key bypassing RLS)

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
