-- Create mood tracker table
-- Run this SQL script in your PostgreSQL database

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS "pulihHati".mood_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
  mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 5),
  mood_label VARCHAR(50) NOT NULL,
  mood_emoji VARCHAR(10) NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one mood entry per user per day
  UNIQUE(user_id, entry_date)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date 
ON "pulihHati".mood_entries(user_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_mood_entries_date 
ON "pulihHati".mood_entries(entry_date);

-- Insert sample mood types for reference (optional)
CREATE TABLE IF NOT EXISTS "pulihHati".mood_types (
  id INTEGER PRIMARY KEY,
  emoji VARCHAR(10) NOT NULL,
  label VARCHAR(50) NOT NULL,
  color_class VARCHAR(100) NOT NULL,
  chart_color VARCHAR(20) NOT NULL
);

-- Insert default mood types
INSERT INTO "pulihHati".mood_types (id, emoji, label, color_class, chart_color) VALUES
(1, '😢', 'Sedih', 'bg-blue-100 text-blue-700 border-blue-300', '#3B82F6'),
(2, '😟', 'Cemas', 'bg-yellow-100 text-yellow-700 border-yellow-300', '#F59E0B'),
(3, '😐', 'Netral', 'bg-gray-100 text-gray-700 border-gray-300', '#6B7280'),
(4, '😊', 'Senang', 'bg-green-100 text-green-700 border-green-300', '#10B981'),
(5, '😄', 'Sangat Bahagia', 'bg-pink-100 text-pink-700 border-pink-300', '#EC4899')
ON CONFLICT (id) DO NOTHING;

-- Check the created tables
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'pulihHati' 
AND table_name IN ('mood_entries', 'mood_types')
ORDER BY table_name, ordinal_position;
