-- Migration 019: changelog / novidades do app (tela de login)
CREATE TABLE IF NOT EXISTS app_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  version text,
  is_active boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_changelog_published_idx ON app_changelog (is_active, published_at DESC);
ALTER TABLE app_changelog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_changelog_read_all" ON app_changelog;
CREATE POLICY "app_changelog_read_all" ON app_changelog FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "app_changelog_admin_write" ON app_changelog;
CREATE POLICY "app_changelog_admin_write" ON app_changelog FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());