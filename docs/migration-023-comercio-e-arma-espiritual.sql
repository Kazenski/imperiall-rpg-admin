-- ############################################################################
-- 023 — COMÉRCIO (Gallar + comerciantes + lojas + eventos + reputação)
--       ARMA ESPIRITUAL (templates + habilidades + dieta + progressão)
--
--  Regras do usuário:
--   - moeda única: Gallar (carteira por CONTA, não por herói)
--   - reputação do comerciante é por CONTA, nível 1..50
--   - preço depende da reputação: init 50% compra / 150% venda,
--     no nível 50 inverte para 150% compra / 90% venda
--   - loja filtra item por nível do herói e/ou zona
--   - horário da loja é TEMPO REAL (weekday + hora), não o relógio do mundo
--   - eventos dão desconto % e/ou item temporário com preço custom
--   - arma espiritual: 1 por HERÓI (unique), fusão exige
--     1 Pedra da Alma + 1 Equipamento
--   - progressão por nível fica em tabela (ajustável no admin)
-- ############################################################################

-- ---------------------------------------------------------------- 023.1
--  Carteira (Gallar) — por conta
CREATE TABLE IF NOT EXISTS player_wallets (
  player_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  gallar bigint NOT NULL DEFAULT 0 CHECK (gallar >= 0),
  lifetime_earned bigint NOT NULL DEFAULT 0,
  lifetime_spent   bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- 023.2
--  Comerciantes
CREATE TABLE IF NOT EXISTS merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  title text,                      -- "Mercador de Relíquias"
  description text,
  portrait_url text,                -- foto do comerciante (lado esquerdo)
  -- Reputation curve (percent of base price). Level 1 -> buy 50 / sell 150
  -- Level 50 -> buy 150 / sell 90. Interpolated linearly.
  rep_min_level integer NOT NULL DEFAULT 1,
  rep_max_level integer NOT NULL DEFAULT 50,
  rep_buy_low  numeric NOT NULL DEFAULT 0.50,   -- compra no level 1 (paga ao jogador)
  rep_buy_high numeric NOT NULL DEFAULT 1.50,   -- compra no level 50
  rep_sell_low numeric NOT NULL DEFAULT 1.50,   -- vende no level 1 (cobra do jogador)
  rep_sell_high numeric NOT NULL DEFAULT 0.90,  -- vende no level 50
  -- XP de reputação por unidade vendida
  rep_xp_per_sale integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN merchants.rep_buy_low IS 'Fração do preço-base que o comerciante PAGA ao jogador no nível 1 de reputação.';
COMMENT ON COLUMN merchants.rep_sell_high IS 'Fração do preço-base que o comerciante COBRA no nível máximo de reputação.';

-- ---------------------------------------------------------------- 023.3
--  Reputação do jogador (por conta x comerciante)
CREATE TABLE IF NOT EXISTS player_merchant_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants (id) ON DELETE CASCADE,
  reputation_level integer NOT NULL DEFAULT 1 CHECK (reputation_level >= 1),
  reputation_xp bigint NOT NULL DEFAULT 0,
  total_units_sold integer NOT NULL DEFAULT 0,
  total_units_bought integer NOT NULL DEFAULT 0,
  total_gallar_spent bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, merchant_id)
);

-- ---------------------------------------------------------------- 023.4
--  Lojas (horario real + requisitos de acesso)
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants (id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  banner_url text,
  -- Horário REAL (segunda..domingo). jsonb ex.:
  -- {"always":false,"days":[1,2,3,4,5],"open":"09:00","close":"18:00"}
  opening_hours jsonb NOT NULL DEFAULT
    '{"always":false,"days":[1,2,3,4,5,6,7],"open":"00:00","close":"23:59"}'::jsonb,
  -- Requisito para a loja existir para o herói (null = livre)
  requires_hero_level integer,
  requires_zone_id uuid REFERENCES public.zones (id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN shops.opening_hours IS 'Tempo REAL (não o relógio do mundo). Format: {always,days[],open,close} com dias 1=seg..7=dom.';

-- ---------------------------------------------------------------- 023.5
--  Itens à venda
CREATE TABLE IF NOT EXISTS shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops (id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items (id) ON DELETE CASCADE,
  -- Preço em Gallar (100 = preço "cheio"). Reputação e evento aplicam
  -- multiplicadores sobre este valor.
  base_price integer NOT NULL DEFAULT 100 CHECK (base_price >= 0),
  -- controls what the player receives when selling to the shop
  sell_price integer NOT NULL DEFAULT 50 CHECK (sell_price >= 0),
  stock integer NOT NULL DEFAULT -1,      -- -1 = ilimitado
  stock_sold integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  -- Visibilidade condicional por herói/zona (null = sempre visível)
  min_hero_level integer,
  max_hero_level integer,
  required_zone_id uuid REFERENCES public.zones (id) ON DELETE SET NULL,
  -- "Só aparece depois de X" (reveal condicional,不影响 compra)
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, item_id)
);

-- ---------------------------------------------------------------- 023.6
--  Eventos (desconto / item temporário)
CREATE TABLE IF NOT EXISTS commerce_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  banner_url text,
  -- Desconto global aplicado nas compras (10 = -10%)
  discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),
  -- Janela de tempo real
  starts_at timestamptz NOT NULL,
  ends_at   timestamptz NOT NULL,
  -- Filtro opcional: só para estes comerciantes (null = todos)
  merchant_id uuid REFERENCES public.merchants (id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- Item temporário adicionado por um evento (preço e estoque próprios)
CREATE TABLE IF NOT EXISTS commerce_event_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.commerce_events (id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items (id) ON DELETE CASCADE,
  shop_id uuid REFERENCES public.shops (id) ON DELETE CASCADE,  -- null = todas
  base_price integer NOT NULL DEFAULT 100,
  sell_price integer NOT NULL DEFAULT 50,
  stock integer NOT NULL DEFAULT -1,
  stock_sold integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (event_id, item_id, shop_id)
);

-- Log de transações (opcional, para BI futuro)
CREATE TABLE IF NOT EXISTS commerce_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.player_characters (id) ON DELETE SET NULL,
  shop_id uuid REFERENCES public.shops (id) ON DELETE SET NULL,
  merchant_id uuid REFERENCES public.merchants (id) ON DELETE SET NULL,
  item_id uuid REFERENCES public.items (id) ON DELETE SET NULL,
  trade_type text NOT NULL CHECK (trade_type IN ('buy','sell','exchange')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price integer NOT NULL,
  total_price integer NOT NULL,
  reputation_xp_gained integer NOT NULL DEFAULT 0,
  event_id uuid REFERENCES public.commerce_events (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- 023.7
--  ARMA ESPIRITUAL — templates (armas prontas)
CREATE TABLE IF NOT EXISTS spirit_weapons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  class_name text,                    -- "Espiritual", "Vulcânica"...
  description text,
  image_url text,
  fire_effect boolean NOT NULL DEFAULT true,  -- efeito de fogo dourado no inv/equipado
  base_damage integer NOT NULL DEFAULT 10,
  special_damage integer NOT NULL DEFAULT 5,
  -- % do XP do herói que a arma absorve
  xp_rate_percent integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilidades exclusivas da arma (NÃO são as skills normais)
CREATE TABLE IF NOT EXISTS spirit_weapon_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spirit_weapon_id uuid NOT NULL REFERENCES public.spirit_weapons (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon_url text,
  effect_lottie_url text,
  effect_type text,                   -- fire, slash, arcane...
  effect_color text,
  -- Nível da arma para liberar
  unlock_level integer NOT NULL DEFAULT 1,
  -- Custo (eco) por uso
  echo_cost integer NOT NULL DEFAULT 0,
  -- Dano base + progressão por nível da arma
  base_damage integer NOT NULL DEFAULT 0,
  damage_per_level integer NOT NULL DEFAULT 0,
  -- Ao subir o nível da arma, o efeito ganha intensidade
  effect_intensity_per_level numeric NOT NULL DEFAULT 0.1,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Dieta: itens que alimentam bem (xp custom) vs o resto (xp por rank)
CREATE TABLE IF NOT EXISTS spirit_weapon_diet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spirit_weapon_id uuid NOT NULL REFERENCES public.spirit_weapons (id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items (id) ON DELETE CASCADE,
  xp_per_unit integer NOT NULL DEFAULT 10,
  UNIQUE (spirit_weapon_id, item_id)
);

-- Progressão por nível (AJUSTÁVEL no admin — a decisão que você aprovou)
CREATE TABLE IF NOT EXISTS spirit_level_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spirit_weapon_id uuid NOT NULL REFERENCES public.spirit_weapons (id) ON DELETE CASCADE,
  level integer NOT NULL CHECK (level >= 1),
  damage_base_bonus integer NOT NULL DEFAULT 0,
  damage_special_bonus integer NOT NULL DEFAULT 0,
  xp_to_next integer NOT NULL DEFAULT 100,
  UNIQUE (spirit_weapon_id, level)
);

-- ---------------------------------------------------------------- 023.8
--  Arma espiritual do JOGADOR (1 por herói)
CREATE TABLE IF NOT EXISTS player_characters_spirit_weapon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.player_characters (id) ON DELETE CASCADE,
  spirit_weapon_id uuid NOT NULL REFERENCES public.spirit_weapons (id) ON DELETE RESTRICT,
  -- Item que hospeda o espírito (fusão)
  host_item_id uuid REFERENCES public.items (id) ON DELETE SET NULL,
  custom_name text,
  level integer NOT NULL DEFAULT 1,
  xp bigint NOT NULL DEFAULT 0,
  -- Fusão/transferência: último XP do herói visto (para calcular ganho)
  last_seen_player_xp bigint NOT NULL DEFAULT 0,
  -- Snapshot do template no momento da fusão
  base_damage integer NOT NULL DEFAULT 0,
  special_damage integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- 1 arma espiritual por herói (decisão do usuário)
  UNIQUE (character_id)
);

-- Itens de fusão (fixos no catálogo como markers)
-- Pedra da Alma / Catalisador / Selas serão ITENS reais na tabela items,
-- com type='fission_stone' | 'catalyst'. Aqui só garantimos a semântica.

-- ---------------------------------------------------------------- 023.9
--  Tabela de XP do espírito (por nível) — opcional, sobrescreve spirit_level_bonuses
CREATE TABLE IF NOT EXISTS spirit_xp_table (
  level integer PRIMARY KEY,
  xp_required bigint NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------- 023.10
--  RLS + policies — player data (own) vs catalog (todos)
ALTER TABLE player_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallets_self ON player_wallets;
CREATE POLICY wallets_self ON player_wallets
  FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
GRANT SELECT, INSERT, UPDATE ON player_wallets TO authenticated;

ALTER TABLE player_merchant_reputation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reputation_self ON player_merchant_reputation;
CREATE POLICY reputation_self ON player_merchant_reputation
  FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
GRANT SELECT, INSERT, UPDATE ON player_merchant_reputation TO authenticated;

ALTER TABLE commerce_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commerce_tx_self ON commerce_transactions;
CREATE POLICY commerce_tx_self ON commerce_transactions
  FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
GRANT SELECT, INSERT ON commerce_transactions TO authenticated;

ALTER TABLE player_characters_spirit_weapon ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spirit_weapon_self ON player_characters_spirit_weapon;
CREATE POLICY spirit_weapon_self ON player_characters_spirit_weapon
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.player_characters pc
            WHERE pc.id = character_id AND pc.player_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.player_characters pc
            WHERE pc.id = character_id AND pc.player_id = auth.uid())
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON player_characters_spirit_weapon TO authenticated;

-- Catalog tables: readable by anon (app reads) + writable by admin (anon key)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS merchants_read_all ON merchants;
CREATE POLICY merchants_read_all ON merchants
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS merchants_write_all ON merchants;
CREATE POLICY merchants_write_all ON merchants
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON merchants TO anon, authenticated;

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shops_read_all ON shops;
CREATE POLICY shops_read_all ON shops
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS shops_write_all ON shops;
CREATE POLICY shops_write_all ON shops
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON shops TO anon, authenticated;

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_items_read_all ON shop_items;
CREATE POLICY shop_items_read_all ON shop_items
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS shop_items_write_all ON shop_items;
CREATE POLICY shop_items_write_all ON shop_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON shop_items TO anon, authenticated;

ALTER TABLE commerce_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commerce_events_read_all ON commerce_events;
CREATE POLICY commerce_events_read_all ON commerce_events
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS commerce_events_write_all ON commerce_events;
CREATE POLICY commerce_events_write_all ON commerce_events
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON commerce_events TO anon, authenticated;

ALTER TABLE commerce_event_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commerce_event_items_read_all ON commerce_event_items;
CREATE POLICY commerce_event_items_read_all ON commerce_event_items
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS commerce_event_items_write_all ON commerce_event_items;
CREATE POLICY commerce_event_items_write_all ON commerce_event_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON commerce_event_items TO anon, authenticated;

ALTER TABLE spirit_weapons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spirit_weapons_read_all ON spirit_weapons;
CREATE POLICY spirit_weapons_read_all ON spirit_weapons
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS spirit_weapons_write_all ON spirit_weapons;
CREATE POLICY spirit_weapons_write_all ON spirit_weapons
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON spirit_weapons TO anon, authenticated;

ALTER TABLE spirit_weapon_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spirit_skills_read_all ON spirit_weapon_skills;
CREATE POLICY spirit_skills_read_all ON spirit_weapon_skills
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS spirit_skills_write_all ON spirit_weapon_skills;
CREATE POLICY spirit_skills_write_all ON spirit_weapon_skills
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON spirit_weapon_skills TO anon, authenticated;

ALTER TABLE spirit_weapon_diet ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spirit_diet_read_all ON spirit_weapon_diet;
CREATE POLICY spirit_diet_read_all ON spirit_weapon_diet
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS spirit_diet_write_all ON spirit_weapon_diet;
CREATE POLICY spirit_diet_write_all ON spirit_weapon_diet
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON spirit_weapon_diet TO anon, authenticated;

ALTER TABLE spirit_level_bonuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spirit_bonuses_read_all ON spirit_level_bonuses;
CREATE POLICY spirit_bonuses_read_all ON spirit_level_bonuses
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS spirit_bonuses_write_all ON spirit_level_bonuses;
CREATE POLICY spirit_bonuses_write_all ON spirit_level_bonuses
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON spirit_level_bonuses TO anon, authenticated;

ALTER TABLE spirit_xp_table ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spirit_xp_read_all ON spirit_xp_table;
CREATE POLICY spirit_xp_read_all ON spirit_xp_table
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS spirit_xp_write_all ON spirit_xp_table;
CREATE POLICY spirit_xp_write_all ON spirit_xp_table
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON spirit_xp_table TO anon, authenticated;

-- ---------------------------------------------------------------- 023.11
--  Índices uniques de slug
DO $$
DECLARE
  t text;
  idx text;
  dup int;
BEGIN
  FOREACH t IN ARRAY ARRAY['merchants','shops','commerce_events'] LOOP
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
      RAISE NOTICE 'DUPLICADOS em % -> indice NAO criado', t;
    ELSE
      EXECUTE format('CREATE UNIQUE INDEX %I ON public.%I (slug)', idx, t);
      RAISE NOTICE 'ok: indice % criado', idx;
    END IF;
  END LOOP;
END $$;

-- spirit_weapons slug
DO $$
DECLARE dup int;
BEGIN
  IF to_regclass('public.spirit_weapons_slug_unique') IS NULL THEN
    SELECT count(*) INTO dup FROM (
      SELECT slug FROM public.spirit_weapons GROUP BY slug HAVING count(*) > 1
    ) d;
    IF dup = 0 THEN
      CREATE UNIQUE INDEX spirit_weapons_slug_unique ON public.spirit_weapons (slug);
      RAISE NOTICE 'ok: spirit_weapons_slug_unique';
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------- 023.12
--  RELATÓRIO FINAL (023)
SELECT
  (SELECT to_regclass('public.player_wallets') IS NOT NULL)              AS "023a_wallets",
  (SELECT to_regclass('public.merchants') IS NOT NULL)                  AS "023b_merchants",
  (SELECT to_regclass('public.player_merchant_reputation') IS NOT NULL) AS "023c_reputation",
  (SELECT to_regclass('public.shops') IS NOT NULL)                      AS "023d_shops",
  (SELECT to_regclass('public.shop_items') IS NOT NULL)                 AS "023e_shop_items",
  (SELECT to_regclass('public.commerce_events') IS NOT NULL)            AS "023f_events",
  (SELECT to_regclass('public.commerce_event_items') IS NOT NULL)       AS "023g_event_items",
  (SELECT to_regclass('public.commerce_transactions') IS NOT NULL)      AS "023h_transactions",
  (SELECT to_regclass('public.spirit_weapons') IS NOT NULL)             AS "023i_spirit_templates",
  (SELECT to_regclass('public.spirit_weapon_skills') IS NOT NULL)       AS "023j_spirit_skills",
  (SELECT to_regclass('public.spirit_weapon_diet') IS NOT NULL)         AS "023k_spirit_diet",
  (SELECT to_regclass('public.spirit_level_bonuses') IS NOT NULL)       AS "023l_spirit_bonuses",
  (SELECT to_regclass('public.player_characters_spirit_weapon') IS NOT NULL) AS "023m_player_spirit",
  (SELECT to_regclass('public.spirit_xp_table') IS NOT NULL)            AS "023n_spirit_xp_table";