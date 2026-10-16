-- ############################################################################
--  IMPERIALL RPG — MIGRATIONS CONSOLIDADAS (idempotentes)
-- ############################################################################
--  USO: cole ESTE ARQUIVO INTEIRO no SQL Editor do Supabase e clique Run.
--       Pode rodar em QUALQUER ordem, quantas vezes quiser — nunca quebra.
--
--  FLUXO CERTO:  TESTE (jamhpibptsasvftqetdm)  ->  validar  ->  PRODUÇÃO
--
--  Este arquivo cobre tudo de 012 até 022. Se algo já existe, ele pula.
--  ############################################################################


-- ############################################################################
-- 012 — Lore de histórias (prêmio ao concluir)
-- ############################################################################
ALTER TABLE stories ADD COLUMN IF NOT EXISTS lore_reward integer NOT NULL DEFAULT 0;
COMMENT ON COLUMN stories.lore_reward IS 'Pontos de lore pagos 1x ao concluir a história.';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lore_points integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS player_story_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  player_character_id uuid REFERENCES public.player_characters (id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories (id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  lore_claimed boolean NOT NULL DEFAULT false,
  UNIQUE (player_id, player_character_id, story_id)
);
CREATE INDEX IF NOT EXISTS player_story_progress_idx
  ON player_story_progress (player_id, player_character_id);

ALTER TABLE player_story_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_progress_self_crud" ON player_story_progress;
CREATE POLICY "story_progress_self_crud" ON player_story_progress
  FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON player_story_progress TO authenticated;


-- ############################################################################
-- 013 — Zonas visíveis, desbloqueio por herói e destino de opção por fala
-- ############################################################################
ALTER TABLE zones ADD COLUMN IF NOT EXISTS starter boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN zones.starter IS 'Zona visível desde o início (sem desbloquear).';

ALTER TABLE story_lines ADD COLUMN IF NOT EXISTS unlock_zone_id uuid
  REFERENCES public.zones (id) ON DELETE SET NULL;

ALTER TABLE story_choices ADD COLUMN IF NOT EXISTS unlock_zone_id uuid
  REFERENCES public.zones (id) ON DELETE SET NULL;
ALTER TABLE story_choices ADD COLUMN IF NOT EXISTS next_line_id uuid
  REFERENCES public.story_lines (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS player_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  player_character_id uuid REFERENCES public.player_characters (id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones (id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, player_character_id, zone_id)
);
CREATE INDEX IF NOT EXISTS unlocks_player_idx
  ON player_unlocks (player_id, player_character_id);

ALTER TABLE player_unlocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unlocks_self_crud" ON player_unlocks;
CREATE POLICY "unlocks_self_crud"
  ON player_unlocks FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
GRANT INSERT, UPDATE, DELETE ON player_unlocks TO authenticated;


-- ############################################################################
-- 014 — Oficina: chance base, nível de upgrade e profissões por herói
-- ############################################################################
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS base_chance integer NOT NULL DEFAULT 70;
ALTER TABLE item_upgrade_levels ADD COLUMN IF NOT EXISTS base_chance integer NOT NULL DEFAULT 80;
ALTER TABLE player_inventory ADD COLUMN IF NOT EXISTS upgrade_level integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS player_professions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  player_character_id uuid REFERENCES public.player_characters (id) ON DELETE CASCADE,
  profession_id uuid NOT NULL REFERENCES public.professions (id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, player_character_id, profession_id)
);
CREATE INDEX IF NOT EXISTS player_professions_hero_idx
  ON player_professions (player_id, player_character_id);

ALTER TABLE player_professions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "player_professions_self_crud" ON player_professions;
CREATE POLICY "player_professions_self_crud"
  ON player_professions FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON player_professions TO authenticated;


-- ############################################################################
-- 015 — MP nos heróis + Constelações por herói
-- ############################################################################
ALTER TABLE characters ADD COLUMN IF NOT EXISTS mp integer NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS constellation_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Estrela',
  x numeric(6,2) NOT NULL DEFAULT 50,
  y numeric(6,2) NOT NULL DEFAULT 50,
  cost_orbs integer NOT NULL DEFAULT 1,
  orb_item_id uuid REFERENCES public.items (id) ON DELETE SET NULL,
  reset_item_id uuid REFERENCES public.items (id) ON DELETE SET NULL,
  is_start boolean NOT NULL DEFAULT false,
  color text NOT NULL DEFAULT '#0ea5e9',
  required_level integer NOT NULL DEFAULT 1,
  required_story_id uuid REFERENCES public.stories (id) ON DELETE SET NULL,
  required_zone_id uuid REFERENCES public.zones (id) ON DELETE SET NULL,
  bonuses jsonb NOT NULL DEFAULT '{}'::jsonb,
  connections jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS constellation_nodes_char_idx
  ON constellation_nodes (character_id, sort_order);

ALTER TABLE constellation_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constellation_nodes_public_read" ON constellation_nodes;
CREATE POLICY "constellation_nodes_public_read"
  ON constellation_nodes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "constellation_nodes_admin_write" ON constellation_nodes;
CREATE POLICY "constellation_nodes_admin_write"
  ON constellation_nodes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON constellation_nodes TO anon, authenticated;

CREATE TABLE IF NOT EXISTS player_constellation_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  player_character_id uuid REFERENCES public.player_characters (id) ON DELETE CASCADE,
  node_id uuid NOT NULL REFERENCES public.constellation_nodes (id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, player_character_id, node_id)
);
CREATE INDEX IF NOT EXISTS player_constellation_hero_idx
  ON player_constellation_nodes (player_id, player_character_id);

ALTER TABLE player_constellation_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "player_constellation_self_crud" ON player_constellation_nodes;
CREATE POLICY "player_constellation_self_crud"
  ON player_constellation_nodes FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON player_constellation_nodes TO authenticated;


-- ############################################################################
-- 016 — Falas "somente via opção" (somem do fluxo automático)
-- ############################################################################
ALTER TABLE story_lines
  ADD COLUMN IF NOT EXISTS only_via_choice boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN story_lines.only_via_choice IS
  'Se true, a fala nao aparece no fluxo automatico da cena; so via opcao (next_line_id).';


-- ############################################################################
-- 017 — Eventos de uso (BI / dashboard)
-- ############################################################################
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  player_character_id uuid REFERENCES public.player_characters (id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  value numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_entity_idx ON analytics_events (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_player_idx ON analytics_events (player_id, created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_events_insert_own" ON analytics_events;
CREATE POLICY "analytics_events_insert_own" ON analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (player_id IS NULL OR player_id = auth.uid()));
DROP POLICY IF EXISTS "analytics_events_admin_read" ON analytics_events;
CREATE POLICY "analytics_events_admin_read" ON analytics_events
  FOR SELECT TO authenticated USING (public.is_admin());


-- ############################################################################
-- 018 — Tela de login (capa) + Modo manutenção
-- ############################################################################
CREATE TABLE IF NOT EXISTS app_ui_config (
  id int PRIMARY KEY DEFAULT 1,
  capa_inicializacao_url text,
  capa_inicializacao_tipo text CHECK (capa_inicializacao_tipo IN ('image','video')) DEFAULT 'image',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO app_ui_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS app_maintenance_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  message text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('image','video')) DEFAULT 'image',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS maintenance_windows_active_idx
  ON app_maintenance_windows (is_active, starts_at, ends_at);

ALTER TABLE app_ui_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_maintenance_windows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_ui_config_read_all" ON app_ui_config;
CREATE POLICY "app_ui_config_read_all" ON app_ui_config
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "app_ui_config_admin_write" ON app_ui_config;
CREATE POLICY "app_ui_config_admin_write" ON app_ui_config
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "maintenance_read_all" ON app_maintenance_windows;
CREATE POLICY "maintenance_read_all" ON app_maintenance_windows
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "maintenance_admin_write" ON app_maintenance_windows;
CREATE POLICY "maintenance_admin_write" ON app_maintenance_windows
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ############################################################################
-- 019 — Changelog (novidades exibidas na tela de login)
-- ############################################################################
CREATE TABLE IF NOT EXISTS app_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  version text,
  is_active boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_changelog_published_idx
  ON app_changelog (is_active, published_at DESC);

ALTER TABLE app_changelog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_changelog_read_all" ON app_changelog;
CREATE POLICY "app_changelog_read_all" ON app_changelog
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "app_changelog_admin_write" ON app_changelog;
CREATE POLICY "app_changelog_admin_write" ON app_changelog
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ############################################################################
-- 020 — Imagem estática exibida depois que o vídeo da capa termina
-- ############################################################################
ALTER TABLE app_ui_config
  ADD COLUMN IF NOT EXISTS capa_inicializacao_poster_url text;


-- ############################################################################
-- 021 — Bucket 'media' público (imagens e vídeos, sem restrição de MIME)
-- ############################################################################
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

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


-- ############################################################################
-- 022 — Slugs únicos (impede duplicidade/sobrescrita acidental no admin)
-- ############################################################################
-- Cria o índice apenas se NÃO houver duplicados. Se houver, avisa e pula.
DO $$
DECLARE
  t   text;
  idx text;
  dup bigint;
BEGIN
  FOREACH t IN ARRAY ARRAY['stories','items','skills','mobs','zones','stages',
                           'npcs','characters','professions','recipes','effects','loot_tables']
  LOOP
    idx := t || '_slug_unique';

    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'pulado: tabela % nao existe', t;
      CONTINUE;
    END IF;

    IF to_regclass('public.' || idx) IS NOT NULL THEN
      RAISE NOTICE 'ok: indice % ja existe', idx;
      CONTINUE;
    END IF;

    EXECUTE format('SELECT count(*) FROM (SELECT slug FROM public.%I GROUP BY slug HAVING count(*) > 1) d', t)
      INTO dup;

    IF dup > 0 THEN
      RAISE NOTICE 'DUPLICADOS em %: % slug(s) repetido(s) -> indice NAO criado', t, dup;
    ELSE
      EXECUTE format('CREATE UNIQUE INDEX %I ON public.%I (slug)', idx, t);
      RAISE NOTICE 'ok: indice % criado', idx;
    END IF;
  END LOOP;
END $$;


-- ############################################################################
--  RELATÓRIO FINAL
-- ############################################################################
SELECT
  (SELECT to_regclass('public.player_story_progress') IS NOT NULL)  AS "012_lore",
  (SELECT to_regclass('public.player_unlocks')        IS NOT NULL)  AS "013_unlocks",
  (SELECT to_regclass('public.player_professions')    IS NOT NULL)  AS "014_profissoes",
  (SELECT to_regclass('public.constellation_nodes')   IS NOT NULL)  AS "015_constelacoes",
  (SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='story_lines'
                     AND column_name='only_via_choice'))             AS "016_fala_oculta",
  (SELECT to_regclass('public.analytics_events')       IS NOT NULL)  AS "017_bi",
  (SELECT to_regclass('public.app_maintenance_windows') IS NOT NULL) AS "018_manutencao",
  (SELECT to_regclass('public.app_changelog')          IS NOT NULL)  AS "019_changelog",
  (SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='app_ui_config'
                     AND column_name='capa_inicializacao_poster_url')) AS "020_poster",
  (SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id='media'))    AS "021_bucket",
  (SELECT to_regclass('public.stories_slug_unique')   IS NOT NULL)  AS "022_slugs";