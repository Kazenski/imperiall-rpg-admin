-- ============================================================================
-- DIAGNOSTICO: bucket media + objetos
-- ============================================================================

-- 1) Config real do bucket (public e allowed_mime_types importam)
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets WHERE id = 'media';

-- 2) Objetos realmente gravados no bucket
SELECT name, bucket_id,
       (metadata->>'mimetype')   AS mimetype,
       (metadata->>'size')       AS size,
       created_at
FROM storage.objects
WHERE bucket_id = 'media'
ORDER BY created_at DESC
LIMIT 10;

-- 3) Politicas ativas no bucket media
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE 'media_%'
ORDER BY policyname;
