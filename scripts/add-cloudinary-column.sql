-- Add cloudinary_public_id column to users table
ALTER TABLE "pulihHati".users 
ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_cloudinary_public_id 
ON "pulihHati".users(cloudinary_public_id);

-- Update existing users with NULL cloudinary_public_id
UPDATE "pulihHati".users 
SET cloudinary_public_id = NULL 
WHERE cloudinary_public_id IS NULL;
