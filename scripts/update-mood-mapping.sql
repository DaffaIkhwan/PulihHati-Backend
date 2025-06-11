-- Update Mood Mapping to Fix Frontend-Backend Mismatch
-- This script updates the mood_types table to match the frontend mapping

-- Update mood_types table with correct mapping
UPDATE "pulihHati".mood_types SET 
  emoji = '😊', 
  label = 'Sangat Baik',
  color_class = 'bg-green-100 text-green-700 border-green-300',
  chart_color = '#22C55E'
WHERE id = 1;

UPDATE "pulihHati".mood_types SET 
  emoji = '🙂', 
  label = 'Baik',
  color_class = 'bg-emerald-100 text-emerald-700 border-emerald-300',
  chart_color = '#10B981'
WHERE id = 2;

UPDATE "pulihHati".mood_types SET 
  emoji = '😐', 
  label = 'Biasa',
  color_class = 'bg-yellow-100 text-yellow-700 border-yellow-300',
  chart_color = '#EAB308'
WHERE id = 3;

UPDATE "pulihHati".mood_types SET 
  emoji = '😔', 
  label = 'Buruk',
  color_class = 'bg-orange-100 text-orange-700 border-orange-300',
  chart_color = '#F97316'
WHERE id = 4;

UPDATE "pulihHati".mood_types SET 
  emoji = '😢', 
  label = 'Sangat Buruk',
  color_class = 'bg-red-100 text-red-700 border-red-300',
  chart_color = '#EF4444'
WHERE id = 5;

-- Verify the updates
SELECT id, emoji, label, color_class, chart_color 
FROM "pulihHati".mood_types 
ORDER BY id;

-- Also update existing mood entries to use correct labels and emojis
UPDATE "pulihHati".mood_entries SET 
  mood_label = 'Sangat Baik',
  mood_emoji = '😊'
WHERE mood_level = 1;

UPDATE "pulihHati".mood_entries SET 
  mood_label = 'Baik',
  mood_emoji = '🙂'
WHERE mood_level = 2;

UPDATE "pulihHati".mood_entries SET 
  mood_label = 'Biasa',
  mood_emoji = '😐'
WHERE mood_level = 3;

UPDATE "pulihHati".mood_entries SET 
  mood_label = 'Buruk',
  mood_emoji = '😔'
WHERE mood_level = 4;

UPDATE "pulihHati".mood_entries SET 
  mood_label = 'Sangat Buruk',
  mood_emoji = '😢'
WHERE mood_level = 5;

-- Verify mood entries updates
SELECT mood_level, mood_label, mood_emoji, COUNT(*) as count
FROM "pulihHati".mood_entries 
GROUP BY mood_level, mood_label, mood_emoji
ORDER BY mood_level;
