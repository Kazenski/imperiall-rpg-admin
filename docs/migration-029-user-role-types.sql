-- MIGRATION 029: Tipos de usuario (GM, Suporte, etc.)
CREATE TABLE IF NOT EXISTS user_role_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_role_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_role_types' AND policyname='tmp_anon_all_user_role_types') THEN
    CREATE POLICY "tmp_anon_all_user_role_types" ON user_role_types FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;