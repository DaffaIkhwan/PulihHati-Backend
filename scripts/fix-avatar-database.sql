-- Fix avatar database schema and data
-- Run this SQL script in your PostgreSQL database

-- 1. Add cloudinary_public_id column if it doesn't exist
ALTER TABLE "pulihHati".users 
ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255);

-- 2. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_cloudinary_public_id 
ON "pulihHati".users(cloudinary_public_id);

-- 3. Check current avatar data
SELECT id, name, email, avatar, cloudinary_public_id 
FROM "pulihHati".users 
ORDER BY id;

-- 4. Update any users with NULL avatar to default
UPDATE "pulihHati".users 
SET avatar = 'default-avatar.jpg' 
WHERE avatar IS NULL;

-- 5. Show table structure
\d "pulihHati".users;

-- Update existing users with default avatar to NULL
UPDATE "pulihHati".users
SET avatar = NULL
WHERE avatar = 'default-avatar.jpg';

-- Update existing comments with default avatar to NULL
UPDATE "pulihHati".post_comments
SET author_avatar = NULL
WHERE author_avatar = 'default-avatar.jpg';

-- Update existing posts with default avatar to NULL
UPDATE "pulihHati".posts
SET author_avatar = NULL
WHERE author_avatar = 'default-avatar.jpg';

-- Update existing notifications with default avatar to NULL
UPDATE "pulihHati".notifications
SET actor_avatar = NULL
WHERE actor_avatar = 'default-avatar.jpg';
