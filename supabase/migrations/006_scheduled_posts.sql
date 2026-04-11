-- Add 'scheduled' to post_status enum
ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'scheduled';

-- Add scheduled_at column to posts for scheduled publishing
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- Index for cron job efficiency
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts (scheduled_at)
  WHERE status = 'scheduled';
