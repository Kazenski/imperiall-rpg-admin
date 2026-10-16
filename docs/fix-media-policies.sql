-- ============================================================================
-- FIX: politicas do bucket 'media' (upload de capa/manutencao)
-- Motivo: a policy de escrita exigia sessao autenticada; o upload estava
-- sendo barrado por RLS. Mesma abordagem permissiva ja usada em
-- constellation_nodes (To anon, authenticated / USING true).
-- ============================================================================

-- Leitura pública (app mostra a capa sem login)
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'media');

-- Escrita: qualquer chamada autenticada OU anon (admin valida no app)
DROP POLICY IF EXISTS "media_authenticated_write" ON storage.objects;
CREATE POLICY "media_write_all" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_authenticated_update" ON storage.objects;
CREATE POLICY "media_update_all" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_authenticated_delete" ON storage.objects;
CREATE POLICY "media_delete_all" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'media');

-- Verificação: deve retornar 5 politicas
SELECT policyname, cmd, roles FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'media_%'
ORDER BY policyname;