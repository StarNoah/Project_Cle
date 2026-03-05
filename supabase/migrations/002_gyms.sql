-- gyms table
CREATE TABLE IF NOT EXISTS gyms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  region TEXT,
  area TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- post_gyms join table
CREATE TABLE IF NOT EXISTS post_gyms (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  gym_id INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, gym_id)
);

CREATE INDEX IF NOT EXISTS idx_post_gyms_gym_id ON post_gyms(gym_id);
CREATE INDEX IF NOT EXISTS idx_post_gyms_post_id ON post_gyms(post_id);
CREATE INDEX IF NOT EXISTS idx_gyms_region ON gyms(region);

-- RLS
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_gyms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gyms' AND policyname = 'Public read gyms') THEN
    CREATE POLICY "Public read gyms" ON gyms FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_gyms' AND policyname = 'Public read post_gyms') THEN
    CREATE POLICY "Public read post_gyms" ON post_gyms FOR SELECT USING (true);
  END IF;
END $$;

-- Styles column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS styles TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_posts_styles ON posts USING GIN (styles);

-- Hide non-reel posts
UPDATE posts SET is_hidden = true WHERE post_type != 'reel';

-- Seed data is managed by /api/cron/sync-gyms from climbing-gym-tracker CSV
