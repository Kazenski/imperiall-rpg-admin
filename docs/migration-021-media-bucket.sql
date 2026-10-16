-- Migration 021: bucket 'media' público para imagens e vídeos (sem restrição de MIME)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "media_public_read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'media');

CREATE POLICY IF NOT EXISTS "media_authenticated_write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

CREATE POLICY IF NOT EXISTS "media_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

CREATE POLICY IF NOT EXISTS "media_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media');