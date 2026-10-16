-- ============================================================================
-- FIX DEFINITIVO: bucket 'media' (upload de capa / manutencao / video)
-- ============================================================================
-- CAUSA RAIZ dos dois erros:
--   400 no GET       -> objeto nunca foi gravado (INSERT barrado por RLS)
--   "Bucket not found" -> migration 021 nao aplicada no banco alvo
--
-- SOLUCAO: policies permissivas (To anon, authenticated), mesmo padrao
-- ja usado com sucesso em constellation_nodes.
--
-- Este arquivo e idempotente: pode rodar quantas vezes for.
-- ============================================================================

-- 1) Bucket: publico, 50MB, sem restricao de MIME (aceita imagem e video)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
SET public = true,
    allowed_mime_types = NULL,
    file_size_limit = 52428800
WHERE id = 'media';

-- 2) Policies (DROP + CREATE — Postgres nao aceita CREATE POLICY IF NOT EXISTS)
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_authenticated_write" ON storage.objects;
CREATE POLICY "media_write_all" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_authenticated_update" ON storage.objects;
CREATE POLICY "media_update_all" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_authenticated_delete" ON storage.objects;
CREATE POLICY "media_delete_all" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'media');

-- 3) Verificacao (deve retornar 1 linha do bucket e 4 policies)
SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'media';
SELECT policyname, cmd, roles FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'media_%'
ORDER BY policyname;