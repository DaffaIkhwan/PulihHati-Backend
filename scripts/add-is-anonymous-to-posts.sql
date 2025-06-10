-- Tambahkan kolom is_anonymous ke tabel posts jika belum ada
ALTER TABLE "pulihHati".posts
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE; 