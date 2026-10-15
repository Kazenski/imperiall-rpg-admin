-- Migration 015: MP (Pontos de Magia) nos heróis + Sistema de Constelações por Herói
-- Idempotente. Rodar 1x por banco: staging primeiro (validar), oficial só ao promover.

-- 1. Atributo MP (Pontos de Magia) base nos personagens.
ALTER TABLE characters ADD COLUMN IF NOT EXISTS mp integer NOT NULL DEFAULT 50;

-- 2. Nós da Constelação de cada Herói (Catálogo — Admin cadastra, sincronizável).
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
  ON constellation_nodes FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "constellation_nodes_admin_write" ON constellation_nodes;
CREATE POLICY "constellation_nodes_admin_write"
  ON constellation_nodes FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON constellation_nodes TO anon, authenticated;

-- 3. Nós da Constelação despertados por Herói do Jogador.
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

COMMENT ON COLUMN characters.mp IS 'Pontos de Magia (MP) base do personagem no nível 1.';
COMMENT ON TABLE constellation_nodes IS 'Mapa estelar da Constelação de cada herói (posições, conexões, bônus e bloqueios por nível/história).';
COMMENT ON TABLE player_constellation_nodes IS 'Estrelas despertadas por herói do jogador.';
