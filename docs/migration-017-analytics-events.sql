-- Migration 017: eventos de uso para o BI/dashboard do admin
-- Idempotente. Staging primeiro; oficial só com confirmação.

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

-- Jogador insere apenas seus próprios eventos.
DROP POLICY IF EXISTS "analytics_events_insert_own" ON analytics_events;
CREATE POLICY "analytics_events_insert_own"
  ON analytics_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (player_id IS NULL OR player_id = auth.uid()));

-- Admin lê tudo.
DROP POLICY IF EXISTS "analytics_events_admin_read" ON analytics_events;
CREATE POLICY "analytics_events_admin_read"
  ON analytics_events FOR SELECT TO authenticated
  USING (public.is_admin());

COMMENT ON TABLE analytics_events IS 'Eventos agregados para o BI/dashboard do admin.';