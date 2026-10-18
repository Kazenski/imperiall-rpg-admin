-- MIGRATION 028: Eventos de marketing, Quests, Baús de recompensa, Tutoriais
-- Idempotente. Staging primeiro; oficial so com confirmacao.

-- 1. Baús de recompensa
CREATE TABLE IF NOT EXISTS reward_chests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Eventos de marketing
CREATE TABLE IF NOT EXISTS marketing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT false,
  auto_start_at TIMESTAMPTZ,
  auto_end_at TIMESTAMPTZ,
  xp_multiplier NUMERIC DEFAULT 1,
  manual_action_speed_multiplier NUMERIC DEFAULT 1,
  mob_drop_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  mob_drop_chance NUMERIC DEFAULT 0,
  mob_drop_min_level INT DEFAULT 1,
  merchant_buy_multiplier NUMERIC DEFAULT 1,
  merchant_sell_multiplier NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tipos de quest
CREATE TABLE IF NOT EXISTS quest_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Quests
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_type_id UUID REFERENCES quest_types(id) ON DELETE SET NULL,
  event_id UUID REFERENCES marketing_events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  objective_type TEXT NOT NULL DEFAULT 'collect' CHECK (objective_type IN ('collect','combat','story','event','manual_action','level')),
  objective_target TEXT,
  objective_count INT DEFAULT 1,
  recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekly','story','event')),
  reward_chest_id UUID REFERENCES reward_chests(id) ON DELETE SET NULL,
  reward_gold INT DEFAULT 0,
  reward_gems INT DEFAULT 0,
  reward_xp INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Progresso do jogador (quest)
CREATE TABLE IF NOT EXISTS player_quest_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL DEFAULT '',
  progress INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (player_id, quest_id, period_key)
);

-- 6. Tutoriais
CREATE TABLE IF NOT EXISTS tutorial_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutorial_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES tutorial_sequences(id) ON DELETE CASCADE,
  step_order INT DEFAULT 0,
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  highlight_selector TEXT,
  wait_for_click BOOLEAN DEFAULT false,
  action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Changelog geral (admin)
CREATE TABLE IF NOT EXISTS changelog_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT,
  title TEXT NOT NULL,
  body_technical TEXT,
  body_user TEXT,
  category TEXT DEFAULT 'feature',
  affects_app BOOLEAN DEFAULT false,
  requires_migration BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- indices
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type_id);
CREATE INDEX IF NOT EXISTS idx_quests_recurrence ON quests(recurrence);
CREATE INDEX IF NOT EXISTS idx_player_quest_progress_player ON player_quest_progress(player_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_active ON marketing_events(is_active);
CREATE INDEX IF NOT EXISTS idx_tutorial_steps_seq ON tutorial_steps(sequence_id, step_order);

-- RLS permissiva (padrao admin tmp_anon)
ALTER TABLE reward_chests ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reward_chests' AND policyname='tmp_anon_all_reward_chests') THEN
    CREATE POLICY "tmp_anon_all_reward_chests" ON reward_chests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketing_events' AND policyname='tmp_anon_all_marketing_events') THEN
    CREATE POLICY "tmp_anon_all_marketing_events" ON marketing_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quest_types' AND policyname='tmp_anon_all_quest_types') THEN
    CREATE POLICY "tmp_anon_all_quest_types" ON quest_types FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quests' AND policyname='tmp_anon_all_quests') THEN
    CREATE POLICY "tmp_anon_all_quests" ON quests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tutorial_sequences' AND policyname='tmp_anon_all_tutorial_sequences') THEN
    CREATE POLICY "tmp_anon_all_tutorial_sequences" ON tutorial_sequences FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tutorial_steps' AND policyname='tmp_anon_all_tutorial_steps') THEN
    CREATE POLICY "tmp_anon_all_tutorial_steps" ON tutorial_steps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='changelog_entries' AND policyname='tmp_anon_all_changelog_entries') THEN
    CREATE POLICY "tmp_anon_all_changelog_entries" ON changelog_entries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;