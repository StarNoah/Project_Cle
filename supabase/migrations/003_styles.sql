-- Add styles column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS styles TEXT[] NOT NULL DEFAULT '{}';

-- Index for style filtering
CREATE INDEX IF NOT EXISTS idx_posts_styles ON posts USING GIN (styles);
