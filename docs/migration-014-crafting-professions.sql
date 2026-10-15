-- Migration 014: Oficina (chance base nas receitas/upgrades, profissões por herói e nível de upgrade no inventário)
-- Idempotente. Rodar 1x por banco: staging primeiro (validar), oficial só ao promover.

-- 1. Chance base de sucesso (%) em cada receita de craft (0..100, padrão 70%).
-- Fórmula no app: Chance Final = base_chance + nv_profissao + floor(nv_personagem / 2).
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS base_chance integer NOT NULL DEFAULT 70;

-- 2. Chance base de sucesso (%) em cada nível de upgrade de item (0..100, padrão 80%).
ALTER TABLE item_upgrade_levels ADD COLUMN IF NOT EXISTS base_chance integer NOT NULL DEFAULT 80;

-- 3. Nível de upgrade atual de cada linha do inventário (+0, +1, +2...).
ALTER TABLE player_inventory ADD COLUMN IF NOT EXISTS upgrade_level integer NOT NULL DEFAULT 0;

-- 4. Profissões por herói (cada personagem do jogador pode ter 0 ou todas as profissões em níveis diferentes).
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

COMMENT ON COLUMN recipes.base_chance IS 'Chance base (%) de sucesso ao craftar (0..100).';
COMMENT ON COLUMN item_upgrade_levels.base_chance IS 'Chance base (%) de sucesso ao melhorar o item (0..100).';
COMMENT ON COLUMN player_inventory.upgrade_level IS 'Nível de melhoria (+0, +1, +2...) da peça no inventário.';
COMMENT ON TABLE player_professions IS 'Nível e XP de cada profissão por herói do jogador.';
