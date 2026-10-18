-- MIGRATION 030: Hexcrawl (areas, recursos, acoes)
CREATE TABLE IF NOT EXISTS hex_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  background_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hex_region_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID REFERENCES hex_regions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hex_region_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID REFERENCES hex_regions(id) ON DELETE CASCADE,
  manual_action_id UUID REFERENCES manual_actions(id) ON DELETE CASCADE,
  uses INT DEFAULT 1,
  cooldown_seconds INT DEFAULT 0,
  sort_order INT DEFAULT 0
);

ALTER TABLE hex_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hex_region_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE hex_region_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hex_regions' AND policyname='tmp_anon_all_hex_regions') THEN
    CREATE POLICY "tmp_anon_all_hex_regions" ON hex_regions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hex_region_resources' AND policyname='tmp_anon_all_hex_region_resources') THEN
    CREATE POLICY "tmp_anon_all_hex_region_resources" ON hex_region_resources FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hex_region_actions' AND policyname='tmp_anon_all_hex_region_actions') THEN
    CREATE POLICY "tmp_anon_all_hex_region_actions" ON hex_region_actions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;