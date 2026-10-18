-- MIGRATION 027: permitir leitura BI dos dados de jogador (anon) para o painel admin
-- Idempotente. Staging primeiro; oficial so com confirmacao.

-- player_inventory: leitura para anon (BI itens equipados)
DROP POLICY IF EXISTS "tmp_anon_read_player_inventory" ON public.player_inventory;
CREATE POLICY "tmp_anon_read_player_inventory"
  ON public.player_inventory FOR SELECT
  TO anon, authenticated
  USING (true);

-- player_characters: leitura para anon (BI herois comprados)
DROP POLICY IF EXISTS "tmp_anon_read_player_characters" ON public.player_characters;
CREATE POLICY "tmp_anon_read_player_characters"
  ON public.player_characters FOR SELECT
  TO anon, authenticated
  USING (true);

-- player_online: RLS desabilitado por padrao (leitura anon liberada). Nenhuma policy necessaria.