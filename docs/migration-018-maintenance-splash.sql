-- Migration 018: splash/login mídia + modo manutenção
-- Idempotente. Staging primeiro; oficial só com confirmação.

CREATE TABLE IF NOT EXISTS app_ui_config (
  id int PRIMARY KEY DEFAULT 1,
  splash_media_url text,
  splash_media_type text CHECK (splash_media_type IN ('image','video')) DEFAULT 'image',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_ui_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS app_maintenance_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  message text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('image','video')) DEFAULT 'image',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maintenance_windows_active_idx
  ON app_maintenance_windows (is_active, starts_at, ends_at);

ALTER TABLE app_ui_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_maintenance_windows ENABLE ROW LEVEL SECURITY;

-- Leitura pública (app precisa antes do login) para config/mídia e manutenção ativa.
DROP POLICY IF EXISTS "app_ui_config_read_all" ON app_ui_config;
CREATE POLICY "app_ui_config_read_all" ON app_ui_config FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "maintenance_read_all" ON app_maintenance_windows;
CREATE POLICY "maintenance_read_all" ON app_maintenance_windows FOR SELECT TO anon, authenticated USING (true);

-- Escrita apenas admin.
DROP POLICY IF EXISTS "app_ui_config_admin_write" ON app_ui_config;
CREATE POLICY "app_ui_config_admin_write" ON app_ui_config FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "maintenance_admin_write" ON app_maintenance_windows;
CREATE POLICY "maintenance_admin_write" ON app_maintenance_windows FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());