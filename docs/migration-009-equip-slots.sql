-- Migration 009: slots de equipamento no inventário do jogador
-- Idempotente. Rodar 1x por banco: staging primeiro (validar), oficial só ao promover.
-- Como rodar: Supabase Dashboard -> SQL Editor -> New query -> colar -> Run.
--
-- Até aqui `player_inventory` só dizia SE o item estava equipado
-- (`is_equipped`). Para o conjunto do jogo (2 armas, cabeça, tronco, mãos,
-- pés, 4 anéis, pescoço), cada linha equipada passa a dizer ONDE (`equip_slot`):
--   weapon_1, weapon_2 • helmet • chest • gloves • boots •
--   ring_1, ring_2, ring_3, ring_4 • necklace
-- O TIPO que cabe em cada slot já vive no catálogo (`items.slot`, cadastrado
-- na página Itens: weapon, helmet, chest, gloves, boots, ring, necklace, none).
-- Um slot comporta UM item por vez (o app limpa o slot antes de equipar).
-- NADA muda no admin: `items.slot` já existe e o Sincronizar já inclui `items`.
-- O app lê com fallback: sem esta coluna, a mochila abre normal (sem vestir).

ALTER TABLE player_inventory ADD COLUMN IF NOT EXISTS equip_slot text;

CREATE INDEX IF NOT EXISTS idx_player_inventory_equip_slot
  ON player_inventory(player_id, equip_slot) WHERE equip_slot IS NOT NULL;

COMMENT ON COLUMN player_inventory.equip_slot IS
  'Slot ocupado quando equipado: weapon_1, weapon_2, helmet, chest, gloves, boots, ring_1..4, necklace. NULL = na mochila.';
