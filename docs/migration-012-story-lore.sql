-- Migration 012: pontos de lore (moeda de progressão por personagem)
-- Idempotente. Rodar 1x por banco: staging primeiro (validar), oficial só ao promover.
--
-- Histórias dão PONTOS DE LORE ao concluir (1ª vez por jogador+história),
-- creditados no HERÓI que jogou (`player_characters.lore_points`).
-- A Constelação gasta esses pontos (feature futura; aqui só acumula).
--
-- Anti-farm: `player_story_progress.completed` por (player_id, story_id)
-- (tabela e RLS própria já existem desde a 003). Releitura não paga de novo;
-- cada herói acumula o seu saldo fazendo histórias ainda não concluídas.
-- Recompensas antigas por escolha (reward_xp/item) continuam ignoradas.

-- 1. Saldo de lore por herói.
ALTER TABLE player_characters
  ADD COLUMN IF NOT EXISTS lore_points int NOT NULL DEFAULT 0
  CHECK (lore_points >= 0);

-- 2. Recompensa de lore por história (o admin define; 0 = sem prêmio).
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS lore_reward int NOT NULL DEFAULT 0
  CHECK (lore_reward >= 0);

COMMENT ON COLUMN player_characters.lore_points IS
  'Pontos de lore do herói (ganha ao concluir histórias; gasta na Constelação).';
COMMENT ON COLUMN stories.lore_reward IS
  'Lore pago na 1ª conclusão da história (0 = sem prêmio).';
