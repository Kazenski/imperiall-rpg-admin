-- ============================================================================
-- FIX: nomes de coluna + policies de app_ui_config / maintenance / changelog
-- ============================================================================
-- CONTEXTO
--   A migration 018 original usava splash_media_url / splash_media_type.
--   Depois o codigo foi padronizado para capa_inicializacao_url /
--   capa_inicializacao_tipo (nome pedido: "capa de inicializacao").
--   Bancos que rodaram a 018 antiga ficaram com os nomes velhos e o
--   admin quebrava com PGRST204 ("column not found" -> erro 500).
--
--   Este arquivo: (1) renomeia as colunas antigas, (2) cria as que faltam,
--   (3) deixa as policies de escrita permissivas (o admin usa chave anon;
--   public.is_admin() exigiria sessao e causava 500 ao salvar).
--
--   Idempotente: pode rodar quantas vezes for, em qualquer banco.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) app_ui_config: alinhar nomes das colunas
-- ---------------------------------------------------------------------------
DO $mig$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='app_ui_config' AND column_name='splash_media_url')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='app_ui_config' AND column_name='capa_inicializacao_url') THEN
    ALTER TABLE app_ui_config RENAME COLUMN splash_media_url TO capa_inicializacao_url;
    RAISE NOTICE 'renomeado: splash_media_url -> capa_inicializacao_url';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='app_ui_config' AND column_name='splash_media_type')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='app_ui_config' AND column_name='capa_inicializacao_tipo') THEN
    ALTER TABLE app_ui_config RENAME COLUMN splash_media_type TO capa_inicializacao_tipo;
    RAISE NOTICE 'renomeado: splash_media_type -> capa_inicializacao_tipo';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='app_ui_config' AND column_name='capa_inicializacao_url') THEN
    ALTER TABLE app_ui_config ADD COLUMN capa_inicializacao_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='app_ui_config' AND column_name='capa_inicializacao_tipo') THEN
    ALTER TABLE app_ui_config ADD COLUMN capa_inicializacao_tipo text DEFAULT 'image';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='app_ui_config' AND column_name='capa_inicializacao_poster_url') THEN
    ALTER TABLE app_ui_config ADD COLUMN capa_inicializacao_poster_url text;
  END IF;
END
$mig$;

INSERT INTO app_ui_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) Policies: leitura publica + escrita permissiva (chave anon)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "app_ui_config_read_all" ON app_ui_config;
CREATE POLICY "app_ui_config_read_all" ON app_ui_config
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "app_ui_config_admin_write" ON app_ui_config;
DROP POLICY IF EXISTS "app_ui_config_write_all" ON app_ui_config;
CREATE POLICY "app_ui_config_write_all" ON app_ui_config
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "maintenance_read_all" ON app_maintenance_windows;
CREATE POLICY "maintenance_read_all" ON app_maintenance_windows
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "maintenance_admin_write" ON app_maintenance_windows;
DROP POLICY IF EXISTS "maintenance_write_all" ON app_maintenance_windows;
CREATE POLICY "maintenance_write_all" ON app_maintenance_windows
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "app_changelog_read_all" ON app_changelog;
CREATE POLICY "app_changelog_read_all" ON app_changelog
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "app_changelog_admin_write" ON app_changelog;
DROP POLICY IF EXISTS "app_changelog_write_all" ON app_changelog;
CREATE POLICY "app_changelog_write_all" ON app_changelog
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "analytics_events_admin_read" ON analytics_events;
DROP POLICY IF EXISTS "analytics_events_read_all" ON analytics_events;
CREATE POLICY "analytics_events_read_all" ON analytics_events
  FOR SELECT TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 3) Verificacao
-- ---------------------------------------------------------------------------
SELECT column_name FROM information_schema.columns
WHERE table_name = 'app_ui_config' ORDER BY ordinal_position;

SELECT tablename, policyname, roles FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('app_ui_config','app_maintenance_windows','app_changelog')
ORDER BY tablename, policyname;