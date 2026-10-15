-- Migration 013: progressão por história (fala/escolha libera zona por herói)
-- Idempotente. Rodar 1x por banco: staging primeiro (validar), oficial só ao promover.
--
-- Modelo: o jogador começa vendo SÓ as zonas `starter`. Falas e escolhas
-- podem LIBERAR zonas (`unlock_zone_id`); o desbloqueio é POR HERÓI
-- (`player_unlocks` com player_character_id — cada herói avança separado).
-- Cidades/vilas/arenas SÃO zonas (sabor); fases seguem a zona.
--
-- Regra no app: zona visível se starter OU desbloqueada p/ o herói ativo.
-- Sem esta migration, tudo visível (comportamento atual preservado).
-- IMPORTANTE: marque `starter = true` na(s) zona(s) inicial(is) no admin,
-- senão o jogador novo não vê nada após aplicar.

-- 1. Zona inicial (visível sem desbloquear).
ALTER TABLE zones ADD COLUMN IF NOT EXISTS starter boolean NOT NULL DEFAULT false;

-- 2. Fala que exibe libera zona (ou NULL = nenhuma).
ALTER TABLE story_lines ADD COLUMN IF NOT EXISTS unlock_zone_id uuid
  REFERENCES public.zones (id) ON DELETE SET NULL;

-- 3. Escolha que, clicada, libera zona (ou NULL = nenhuma).
ALTER TABLE story_choices ADD COLUMN IF NOT EXISTS unlock_zone_id uuid
  REFERENCES public.zones (id) ON DELETE SET NULL;

-- 4. Desbloqueios por herói (uma linha por herói+zona).
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

COMMENT ON COLUMN zones.starter IS 'Zona visível desde o início (sem desbloquear).';
COMMENT ON TABLE player_unlocks IS 'Zonas liberadas por herói via histórias (fala exibe / escolha clica).';
