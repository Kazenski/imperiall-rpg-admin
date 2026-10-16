-- Migration 022: slugs únicos em todas as tabelas do admin
-- Se houver duplicatas, a migration falhará; dedupe antes de rodar.

CREATE UNIQUE INDEX IF NOT EXISTS stories_slug_unique ON stories (slug);
CREATE UNIQUE INDEX IF NOT EXISTS items_slug_unique ON items (slug);
CREATE UNIQUE INDEX IF NOT EXISTS skills_slug_unique ON skills (slug);
CREATE UNIQUE INDEX IF NOT EXISTS mobs_slug_unique ON mobs (slug);
CREATE UNIQUE INDEX IF NOT EXISTS zones_slug_unique ON zones (slug);
CREATE UNIQUE INDEX IF NOT EXISTS stages_slug_unique ON stages (slug);
CREATE UNIQUE INDEX IF NOT EXISTS npcs_slug_unique ON npcs (slug);
CREATE UNIQUE INDEX IF NOT EXISTS characters_slug_unique ON characters (slug);
CREATE UNIQUE INDEX IF NOT EXISTS professions_slug_unique ON professions (slug);
CREATE UNIQUE INDEX IF NOT EXISTS recipes_slug_unique ON recipes (slug);
CREATE UNIQUE INDEX IF NOT EXISTS effects_slug_unique ON effects (slug);
CREATE UNIQUE INDEX IF NOT EXISTS loot_tables_slug_unique ON loot_tables (slug);