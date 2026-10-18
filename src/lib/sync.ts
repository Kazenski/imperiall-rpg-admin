/**
 * Sincronia entre bancos oficial <-> teste (só roda no SERVIDOR).
 *
 * Usa as chaves service_role, que ficam em variáveis SEM prefixo
 * NEXT_PUBLIC_ (nunca chegam ao navegador):
 *   SUPABASE_PROD_URL / SUPABASE_PROD_SERVICE_KEY
 *   SUPABASE_STAGING_URL / SUPABASE_STAGING_SERVICE_KEY
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Pais antes dos filhos (a exclusão faz o caminho inverso).
export const SYNC_TABLES = [
  'items', 'skills', 'effects', 'mobs', 'zones', 'npcs', 'professions',
  'stories', 'characters', 'stages', 'story_scenes', 'recipes',
  'skill_nodes', 'constellation_nodes', 'story_lines', 'loot_tables', 'waves',
  'character_skills', 'character_traits', 'skill_effects', 'item_effects',
  'recipe_materials', 'item_upgrade_levels', 'story_choices',
  'wave_mobs', 'loot_table_entries', 'item_upgrade_materials',
  'floating_menus', 'natural_resources',
  'merchants', 'shops', 'shop_items', 'commerce_events', 'commerce_event_items',
  'spirit_weapons', 'spirit_weapon_skills', 'spirit_weapon_diet', 'spirit_level_bonuses', 'spirit_xp_table',
  'pet_templates', 'pet_template_skills', 'pet_template_diet', 'pet_incubation_config',
  'vassals', 'vassal_affinities', 'vassal_level_rules',
  'manual_actions',
  'support_categories', 'game_masters',
  'marketing_events', 'quest_types', 'reward_chests', 'quests',
  'hex_regions', 'hex_region_resources', 'hex_region_actions',
  'tutorial_sequences', 'tutorial_steps',
  'changelog_entries',
];

export const TABLE_LABELS: Record<string, string> = {
  items: 'Itens', skills: 'Habilidades', effects: 'Efeitos', mobs: 'Inimigos',
  zones: 'Zonas', npcs: 'NPCs', professions: 'Profissões', stories: 'Histórias',
  characters: 'Heróis', stages: 'Fases', story_scenes: 'Cenas',
  recipes: 'Receitas', skill_nodes: 'Nós da árvore', constellation_nodes: 'Nós de Constelação', story_lines: 'Falas',
  loot_tables: 'Tabelas de loot', waves: 'Ondas',
  character_skills: 'Skills do herói', character_traits: 'Vantagens',
  skill_effects: 'Efeitos da skill', item_effects: 'Efeitos do item',
  recipe_materials: 'Materiais da receita', item_upgrade_levels: 'Níveis de upgrade',
  story_choices: 'Escolhas', wave_mobs: 'Inimigos da onda',
  loot_table_entries: 'Drops', item_upgrade_materials: 'Materiais do upgrade',
  floating_menus: 'Menus Flutuantes', natural_resources: 'Recursos Naturais',
  merchants: 'Mercadores', shops: 'Lojas', shop_items: 'Itens de Loja',
  commerce_events: 'Eventos de Comércio', commerce_event_items: 'Itens de Evento de Comércio',
  spirit_weapons: 'Armas Espirituais', spirit_weapon_skills: 'Skills de Arma Espiritual',
  spirit_weapon_diet: 'Dieta de Arma Espiritual', spirit_level_bonuses: 'Bônus de Nível Espiritual',
  spirit_xp_table: 'Tabela de XP Espiritual',
  pet_templates: 'Pets (Templates)', pet_template_skills: 'Skills de Pet',
  pet_template_diet: 'Dieta de Pet', pet_incubation_config: 'Config de Incubação',
  vassals: 'Vassalos', vassal_affinities: 'Afinidades de Vassalo',
  vassal_level_rules: 'Regras de Nível de Vassalo',
  manual_actions: 'Ações Manuais',
  support_categories: 'Categorias de Suporte', game_masters: 'Game Masters',
  marketing_events: 'Eventos de Marketing', quest_types: 'Tipos de Quest',
  reward_chests: 'Baús de Recompensa', quests: 'Quests',
  hex_regions: 'Regiões Hex', hex_region_resources: 'Recursos de Hex',
  hex_region_actions: 'Ações de Hex',
  tutorial_sequences: 'Sequências de Tutorial', tutorial_steps: 'Passos de Tutorial',
  changelog_entries: 'Changelog Geral',
};

/**
 * SQL Único Acumulado (Migrations 007 a 015 + função exec_sql restrita ao service_role).
 * 100% idempotente (IF NOT EXISTS). Ao rodar 1 vez no SQL Editor, instala também
 * `exec_sql` para que as próximas migrations rodem sozinhas pelo botão do Admin!
 */
export const CONSOLIDATED_MIGRATIONS_SQL = `-- ============================================================================
-- PACOTÃO ÚNICO DE MIGRATIONS (007 A 015) + AUTO-MIGRATION VIA PAINEL ADMIN
-- 100% Idempotente (seguro rodar quantas vezes quiser).
-- ============================================================================

-- 0. Função restrita ao service_role para o painel /sincronizar aplicar futuras migrations sozinho:
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- 007: Habilidades por herói + barra de combate
ALTER TABLE public.player_skills
  ADD COLUMN IF NOT EXISTS player_character_id uuid REFERENCES public.player_characters (id) ON DELETE CASCADE;
ALTER TABLE public.player_skills
  ADD COLUMN IF NOT EXISTS slot smallint;
ALTER TABLE public.player_skills
  DROP CONSTRAINT IF EXISTS player_skills_player_id_skill_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS player_skills_hero_skill_uidx
  ON public.player_skills (player_character_id, skill_id);
CREATE UNIQUE INDEX IF NOT EXISTS player_skills_hero_slot_uidx
  ON public.player_skills (player_character_id, slot) WHERE slot IS NOT NULL;
CREATE INDEX IF NOT EXISTS player_skills_hero_idx
  ON public.player_skills (player_character_id);

-- 008: Efeitos visuais de combate + sprites de ataque
ALTER TABLE public.mobs ADD COLUMN IF NOT EXISTS sprite_attack_url text;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS effect_type text DEFAULT 'slash';
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS effect_color text DEFAULT '#FF4444';
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS effect_intensity int DEFAULT 1;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS effect_lottie_url text;

-- 009 & 010: Slots de equipamento e desempilhamento de equipáveis
ALTER TABLE public.player_inventory ADD COLUMN IF NOT EXISTS equip_slot text;
CREATE INDEX IF NOT EXISTS idx_player_inventory_equip_slot
  ON public.player_inventory(player_id, equip_slot) WHERE equip_slot IS NOT NULL;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'player_inventory_player_id_item_id_key'
  ) THEN
    ALTER TABLE public.player_inventory DROP CONSTRAINT player_inventory_player_id_item_id_key;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_player_inventory_player_item
  ON public.player_inventory(player_id, item_id);

-- 011: Menus flutuantes
CREATE TABLE IF NOT EXISTS public.floating_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  icon text NOT NULL DEFAULT 'missions',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  visible_from timestamptz,
  visible_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.floating_menus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "floating_menus_public_read" ON public.floating_menus;
CREATE POLICY "floating_menus_public_read"
  ON public.floating_menus FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.floating_menus (key, title, icon, sort_order, is_active)
VALUES ('missions', 'Missões', 'missions', 0, true)
ON CONFLICT (key) DO NOTHING;

-- 012: Pontos de lore nas histórias e por herói
ALTER TABLE public.player_characters
  ADD COLUMN IF NOT EXISTS lore_points int NOT NULL DEFAULT 0;
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS lore_reward int NOT NULL DEFAULT 0;

-- 013: Progressão de zonas por história e pulo para fala específica
ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS starter boolean NOT NULL DEFAULT false;
ALTER TABLE public.story_lines ADD COLUMN IF NOT EXISTS unlock_zone_id uuid
  REFERENCES public.zones (id) ON DELETE SET NULL;
ALTER TABLE public.story_choices ADD COLUMN IF NOT EXISTS unlock_zone_id uuid
  REFERENCES public.zones (id) ON DELETE SET NULL;
ALTER TABLE public.story_choices ADD COLUMN IF NOT EXISTS next_line_id uuid
  REFERENCES public.story_lines (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.player_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  player_character_id uuid REFERENCES public.player_characters (id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones (id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, player_character_id, zone_id)
);
CREATE INDEX IF NOT EXISTS unlocks_player_idx
  ON public.player_unlocks (player_id, player_character_id);
ALTER TABLE public.player_unlocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unlocks_self_crud" ON public.player_unlocks;
CREATE POLICY "unlocks_self_crud"
  ON public.player_unlocks FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_unlocks TO authenticated;

-- 014: Oficina (Chance Base nas Receitas/Upgrades, Upgrade Level e Profissões por Herói)
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS base_chance integer NOT NULL DEFAULT 70;
ALTER TABLE public.item_upgrade_levels ADD COLUMN IF NOT EXISTS base_chance integer NOT NULL DEFAULT 80;
ALTER TABLE public.player_inventory ADD COLUMN IF NOT EXISTS upgrade_level integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.player_professions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  player_character_id uuid REFERENCES public.player_characters (id) ON DELETE CASCADE,
  profession_id uuid NOT NULL REFERENCES public.professions (id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, player_character_id, profession_id)
);
CREATE INDEX IF NOT EXISTS player_professions_hero_idx
  ON public.player_professions (player_id, player_character_id);
ALTER TABLE public.player_professions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "player_professions_self_crud" ON public.player_professions;
CREATE POLICY "player_professions_self_crud"
  ON public.player_professions FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_professions TO authenticated;

-- 015: MP (Pontos de Magia) nos Heróis + Constelações por Herói
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS mp integer NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS public.constellation_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Estrela',
  x numeric(6,2) NOT NULL DEFAULT 50,
  y numeric(6,2) NOT NULL DEFAULT 50,
  cost_orbs integer NOT NULL DEFAULT 1,
  orb_item_id uuid REFERENCES public.items (id) ON DELETE SET NULL,
  reset_item_id uuid REFERENCES public.items (id) ON DELETE SET NULL,
  is_start boolean NOT NULL DEFAULT false,
  color text NOT NULL DEFAULT '#0ea5e9',
  required_level integer NOT NULL DEFAULT 1,
  required_story_id uuid REFERENCES public.stories (id) ON DELETE SET NULL,
  required_zone_id uuid REFERENCES public.zones (id) ON DELETE SET NULL,
  bonuses jsonb NOT NULL DEFAULT '{}'::jsonb,
  connections jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS constellation_nodes_char_idx
  ON public.constellation_nodes (character_id, sort_order);
ALTER TABLE public.constellation_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constellation_nodes_public_read" ON public.constellation_nodes;
CREATE POLICY "constellation_nodes_public_read"
  ON public.constellation_nodes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "constellation_nodes_admin_write" ON public.constellation_nodes;
CREATE POLICY "constellation_nodes_admin_write"
  ON public.constellation_nodes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.constellation_nodes TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.player_constellation_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  player_character_id uuid REFERENCES public.player_characters (id) ON DELETE CASCADE,
  node_id uuid NOT NULL REFERENCES public.constellation_nodes (id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, player_character_id, node_id)
);
CREATE INDEX IF NOT EXISTS player_constellation_hero_idx
  ON public.player_constellation_nodes (player_id, player_character_id);
ALTER TABLE public.player_constellation_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "player_constellation_self_crud" ON public.player_constellation_nodes;
CREATE POLICY "player_constellation_self_crud"
  ON public.player_constellation_nodes FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_constellation_nodes TO authenticated;
`;

function serviceClient(url?: string, key?: string): SupabaseClient {
  if (!url || !key) {
    throw new Error(
      'Variáveis de serviço ausentes. Na Vercel, cadastre SUPABASE_PROD_URL, ' +
      'SUPABASE_PROD_SERVICE_KEY, SUPABASE_STAGING_URL e SUPABASE_STAGING_SERVICE_KEY ' +
      '(sem prefixo NEXT_PUBLIC_) e faça redeploy.',
    );
  }
  const cleanUrl = url.trim().replace(/\/+$/, '');
  return createClient(cleanUrl, key.trim(), { auth: { persistSession: false } });
}

function errMsg(prefix: string, error: any): string {
  const parts = [
    error?.message,
    error?.code ? `código ${error.code}` : '',
    error?.status ? `HTTP ${error.status}` : '',
    error?.hint,
  ].filter(Boolean);
  const detail = parts.join(' • ') || 'falha desconhecida';
  return `${prefix}: ${detail}`;
}

function isMissingTableOrColumn(error: any): boolean {
  const code = error?.code || '';
  const msg = (error?.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('column')
  );
}

export function getSyncClients() {
  return {
    prod: serviceClient(process.env.SUPABASE_PROD_URL, process.env.SUPABASE_PROD_SERVICE_KEY),
    stag: serviceClient(process.env.SUPABASE_STAGING_URL, process.env.SUPABASE_STAGING_SERVICE_KEY),
  };
}

/** Tenta aplicar o SQL consolidado via RPC `exec_sql` nos dois bancos (se instalado). */
export async function applyMigrationsRpc(target: 'prod' | 'staging' | 'both' = 'both'): Promise<{
  prodOk: boolean;
  stagOk: boolean;
  detail: string;
}> {
  const { prod, stag } = getSyncClients();
  let prodOk = true;
  let stagOk = true;
  const msgs: string[] = [];

  if (target === 'prod' || target === 'both') {
    const { error } = await prod.rpc('exec_sql', { sql_query: CONSOLIDATED_MIGRATIONS_SQL });
    if (error) {
      prodOk = false;
      msgs.push(`Oficial: ${error.message}`);
    } else {
      msgs.push('Oficial: estrutura (007–015) aplicada com sucesso!');
    }
  }
  if (target === 'staging' || target === 'both') {
    const { error } = await stag.rpc('exec_sql', { sql_query: CONSOLIDATED_MIGRATIONS_SQL });
    if (error) {
      stagOk = false;
      msgs.push(`Teste: ${error.message}`);
    } else {
      msgs.push('Teste: estrutura (007–015) aplicada com sucesso!');
    }
  }
  return { prodOk, stagOk, detail: msgs.join(' | ') };
}

async function readAll(client: SupabaseClient, table: string) {
  const rows: any[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await client.from(table).select('*').range(offset, offset + 999);
    if (error) {
      if (isMissingTableOrColumn(error)) return [];
      throw new Error(errMsg(`leitura ${table}`, error));
    }
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
    offset += 1000;
  }
  return rows;
}

const NO_ID_TABLES = new Set(['spirit_xp_table', 'vassal_level_rules']);

async function wipe(client: SupabaseClient, table: string) {
  let query;
  if (NO_ID_TABLES.has(table)) {
    query = client.from(table).delete().gte('level', 0);
  } else {
    query = client.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  const { error } = await query;
  if (error && !isMissingTableOrColumn(error)) {
    throw new Error(errMsg(`limpeza ${table}`, error));
  }
}

/** Copia tudo do oficial para o teste (apaga o teste antes). */
export async function refreshStaging(): Promise<{ table: string; rows: number }[]> {
  const { prod, stag } = getSyncClients();
  // Tenta garantir as migrations no staging caso exec_sql exista
  await stag.rpc('exec_sql', { sql_query: CONSOLIDATED_MIGRATIONS_SQL }).then(() => {}, () => {});
  for (const t of [...SYNC_TABLES].reverse()) await wipe(stag, t);
  const out: { table: string; rows: number }[] = [];
  for (const t of SYNC_TABLES) {
    const rows = await readAll(prod, t);
    await insertRows(stag, t, rows);
    out.push({ table: t, rows: rows.length });
  }
  return out;
}

/** Promove tabelas escolhidas do teste para o oficial (upsert por id). */
export async function promoteTables(tables: string[]): Promise<{ table: string; rows: number }[]> {
  const { prod, stag } = getSyncClients();
  // Se a função exec_sql já foi instalada no oficial, aplica automaticamente qualquer coluna/tabela nova antes de copiar!
  await prod.rpc('exec_sql', { sql_query: CONSOLIDATED_MIGRATIONS_SQL }).then(() => {}, () => {});
  const ordered = SYNC_TABLES.filter((t) => tables.includes(t));
  const out: { table: string; rows: number }[] = [];
  for (const t of ordered) {
    const rows = await readAll(stag, t);
    await insertRows(prod, t, rows, true);
    out.push({ table: t, rows: rows.length });
  }
  return out;
}

export async function diagnose(): Promise<
  { side: string; host: string; ok: boolean; detail: string }[]
> {
  const out: { side: string; host: string; ok: boolean; detail: string }[] = [];
  const targets = [
    { side: 'oficial', url: process.env.SUPABASE_PROD_URL, key: process.env.SUPABASE_PROD_SERVICE_KEY },
    { side: 'teste', url: process.env.SUPABASE_STAGING_URL, key: process.env.SUPABASE_STAGING_SERVICE_KEY },
  ];
  for (const t of targets) {
    if (!t.url || !t.key) {
      out.push({ side: t.side, host: '(não configurado)', ok: false, detail: 'variável ausente' });
      continue;
    }
    const cleanUrl = t.url.trim().replace(/\/+$/, '');
    let host = '(url inválida)';
    try {
      host = new URL(cleanUrl).host;
    } catch {
      out.push({ side: t.side, host, ok: false, detail: `URL malformada: "${t.url.trim().slice(0, 60)}"` });
      continue;
    }
    try {
      const r = await fetch(`${cleanUrl}/rest/v1/items?select=id&limit=1`, {
        headers: { apikey: t.key.trim(), Authorization: `Bearer ${t.key.trim()}` },
      });
      const body = (await r.text()).slice(0, 200);
      out.push({
        side: t.side,
        host,
        ok: r.ok,
        detail: r.ok ? `HTTP ${r.status} OK — resposta: ${body.slice(0, 80)}` : `HTTP ${r.status} — resposta: ${body}`,
      });
    } catch (e: any) {
      const cause = e?.cause ? ` (causa: ${JSON.stringify(e.cause).slice(0, 120)})` : '';
      out.push({ side: t.side, host, ok: false, detail: `falha de rede: ${e?.message || e}${cause}` });
    }
  }
  return out;
}

export async function diffCounts(): Promise<{ table: string; prod: number; staging: number; missingInProd?: boolean }[]> {
  const { prod, stag } = getSyncClients();
  const out: { table: string; prod: number; staging: number; missingInProd?: boolean }[] = [];
  for (const t of SYNC_TABLES) {
    const countCol = NO_ID_TABLES.has(t) ? 'level' : 'id';
    const [p, s] = await Promise.all([
      prod.from(t).select(countCol, { count: 'exact', head: true }),
      stag.from(t).select(countCol, { count: 'exact', head: true }),
    ]);
    const prodMissing = Boolean(p.error && isMissingTableOrColumn(p.error));
    const stagMissing = Boolean(s.error && isMissingTableOrColumn(s.error));
    if (p.error && !prodMissing) throw new Error(errMsg(`oficial ${t}`, p.error));
    if (s.error && !stagMissing) throw new Error(errMsg(`teste ${t}`, s.error));
    out.push({
      table: t,
      prod: prodMissing ? 0 : (p.count ?? 0),
      staging: stagMissing ? 0 : (s.count ?? 0),
      missingInProd: prodMissing,
    });
  }
  return out;
}

async function insertRows(client: SupabaseClient, table: string, rows: any[], upsert = false) {
  if (rows.length === 0) return;
  let fixups: { id: string; requires_node_id: string }[] = [];
  let payload = rows;
  if (table === 'skill_nodes') {
    fixups = rows.filter((n) => n.requires_node_id).map((n) => ({ id: n.id, requires_node_id: n.requires_node_id }));
    payload = rows.map((n) => ({ ...n, requires_node_id: null }));
  }
  const conflictCol =
    NO_ID_TABLES.has(table) ? 'level' :
    table === 'floating_menus' ? 'key' : 'id';
  const query = upsert
    ? client.from(table).upsert(payload, { onConflict: conflictCol })
    : client.from(table).insert(payload);
  const { error } = await query;
  if (error) {
    // Se o oficial ainda não tiver alguma coluna nova do teste, remove a coluna ausente e grava o restante sem quebrar!
    const match = (error.message || '').match(/Could not find the '([^']+)' column/i);
    if (match && match[1]) {
      const missingCol = match[1];
      const stripped = payload.map((row) => {
        const copy = { ...row };
        delete copy[missingCol];
        return copy;
      });
      return insertRows(client, table, stripped, upsert);
    }
    throw new Error(errMsg(`gravação ${table}`, error));
  }
  for (const f of fixups) {
    const { error: uErr } = await client.from(table).update({ requires_node_id: f.requires_node_id }).eq('id', f.id);
    if (uErr) throw new Error(errMsg(`ajuste ${table}`, uErr));
  }
}
