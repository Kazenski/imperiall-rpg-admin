-- Migration 010: itens equipáveis não empilham (1 linha por unidade)
-- Idempotente. Aplicar DEPOIS da 009. Rodar 1x por banco:
-- staging primeiro (validar), oficial só ao promover.
-- Como rodar: Supabase Dashboard -> SQL Editor -> New query -> colar -> Run.
--
-- Até aqui `player_inventory` tinha `unique(player_id, item_id)`: uma linha
-- por item, com `quantity` somando. Isso impedia 2 anéis iguais vestidos em
-- slots diferentes (cada linha só ocupa 1 slot).
--
-- Regra nova: item EQUIPÁVEL (`items.slot` <> 'none') ganha 1 LINHA por
-- unidade (quantity sempre 1); o app insere linha nova a cada loot em vez de
-- somar. Consumíveis/materiais continuam empilhando normal.
-- Linhas antigas empilhadas de equipáveis são preservadas como estão.

-- Remove a trava de 1 linha por item (ignora se o banco já não a tiver).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'player_inventory_player_id_item_id_key'
  ) THEN
    ALTER TABLE player_inventory
      DROP CONSTRAINT player_inventory_player_id_item_id_key;
  END IF;
END $$;

-- Mantém as buscas por (jogador, item) rápidas sem a unique.
CREATE INDEX IF NOT EXISTS idx_player_inventory_player_item
  ON player_inventory(player_id, item_id);

COMMENT ON TABLE player_inventory IS
  'Mochila: empilháveis somam quantity na mesma linha; equipáveis têm 1 linha por unidade (migration 010). Linha equipada aponta o slot em equip_slot (migration 009).';
