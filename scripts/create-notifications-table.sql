-- Create notifications table
CREATE TABLE IF NOT EXISTS "pulihHati".notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'follow', etc.
  message TEXT NOT NULL,
  post_id INTEGER REFERENCES "pulihHati".posts(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "pulihHati".notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON "pulihHati".notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON "pulihHati".notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON "pulihHati".notifications(type);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON "pulihHati".notifications(user_id, read, created_at DESC);
