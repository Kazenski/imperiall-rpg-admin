-- ============================================================
-- MIGRATION 021: bucket 'media' para imagens e vídeos
-- IMPORTANTE: rode nos DOIS projetos (teste e produção).
-- ============================================================

-- 1) Criar o bucket (idempotente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- 2) Policies do bucket
--    (DROP + CREATE: 'CREATE POLICY IF NOT EXISTS' não existe no Postgres)
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_authenticated_write" ON storage.objects;
CREATE POLICY "media_authenticated_write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_authenticated_update" ON storage.objects;
CREATE POLICY "media_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_authenticated_delete" ON storage.objects;
CREATE POLICY "media_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media');

-- 3) Verificação (deve retornar 1 linha com id = media)
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'media';