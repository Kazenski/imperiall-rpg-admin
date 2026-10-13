/**
 * Sincronia entre bancos oficial <-> teste (só roda no SERVIDOR).
 *
 * Usa as chaves service_role, que ficam em variáveis SEM prefixo
 * NEXT_PUBLIC_ (nunca chegam ao navegador):
 *   SUPABASE_PROD_URL / SUPABASE_PROD_SERVICE_KEY
 *   SUPABASE_STAGING_URL / SUPABASE_STAGING_SERVICE_KEY
 *
 * Regras:
 * - refresh: apaga o catálogo do teste e copia tudo do oficial (mesmos ids).
 * - promote: upsert das tabelas escolhidas do teste para o oficial.
 * - Exclusões NÃO propagam (deletar no teste não deleta no oficial).
 * - Não copia perfis, punições nem progresso de jogadores.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Pais antes dos filhos (a exclusão faz o caminho inverso).
export const SYNC_TABLES = [
  'items', 'skills', 'effects', 'mobs', 'zones', 'npcs', 'professions',
  'stories', 'characters', 'stages', 'story_scenes', 'recipes',
  'skill_nodes', 'story_lines', 'loot_tables', 'waves',
  'character_skills', 'character_traits', 'skill_effects', 'item_effects',
  'recipe_materials', 'item_upgrade_levels', 'story_choices',
  'wave_mobs', 'loot_table_entries', 'item_upgrade_materials',
];

export const TABLE_LABELS: Record<string, string> = {
  items: 'Itens', skills: 'Habilidades', effects: 'Efeitos', mobs: 'Inimigos',
  zones: 'Zonas', npcs: 'NPCs', professions: 'Profissões', stories: 'Histórias',
  characters: 'Heróis', stages: 'Fases', story_scenes: 'Cenas',
  recipes: 'Receitas', skill_nodes: 'Nós da árvore', story_lines: 'Falas',
  loot_tables: 'Tabelas de loot', waves: 'Ondas',
  character_skills: 'Skills do herói', character_traits: 'Vantagens',
  skill_effects: 'Efeitos da skill', item_effects: 'Efeitos do item',
  recipe_materials: 'Materiais da receita', item_upgrade_levels: 'Níveis de upgrade',
  story_choices: 'Escolhas', wave_mobs: 'Inimigos da onda',
  loot_table_entries: 'Drops', item_upgrade_materials: 'Materiais do upgrade',
};

function serviceClient(url?: string, key?: string): SupabaseClient {
  if (!url || !key) {
    throw new Error(
      'Variáveis de serviço ausentes. Na Vercel, cadastre SUPABASE_PROD_URL, ' +
      'SUPABASE_PROD_SERVICE_KEY, SUPABASE_STAGING_URL e SUPABASE_STAGING_SERVICE_KEY ' +
      '(sem prefixo NEXT_PUBLIC_) e faça redeploy.',
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getSyncClients() {
  return {
    prod: serviceClient(process.env.SUPABASE_PROD_URL, process.env.SUPABASE_PROD_SERVICE_KEY),
    stag: serviceClient(process.env.SUPABASE_STAGING_URL, process.env.SUPABASE_STAGING_SERVICE_KEY),
  };
}

async function readAll(client: SupabaseClient, table: string) {
  const rows: any[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await client.from(table).select('*').range(offset, offset + 999);
    if (error) throw new Error(`leitura ${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
    offset += 1000;
  }
  return rows;
}

async function wipe(client: SupabaseClient, table: string) {
  const { error } = await client.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw new Error(`limpeza ${table}: ${error.message}`);
}

/** Copia tudo do oficial para o teste (apaga o teste antes). */
export async function refreshStaging(): Promise<{ table: string; rows: number }[]> {
  const { prod, stag } = getSyncClients();
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
  const ordered = SYNC_TABLES.filter((t) => tables.includes(t));
  const out: { table: string; rows: number }[] = [];
  for (const t of ordered) {
    const rows = await readAll(stag, t);
    await insertRows(prod, t, rows, true);
    out.push({ table: t, rows: rows.length });
  }
  return out;
}

/** Contagem por tabela nos dois bancos (para a tela de diff). */
export async function diffCounts(): Promise<{ table: string; prod: number; staging: number }[]> {
  const { prod, stag } = getSyncClients();
  const out: { table: string; prod: number; staging: number }[] = [];
  for (const t of SYNC_TABLES) {
    const [p, s] = await Promise.all([
      prod.from(t).select('id', { count: 'exact', head: true }),
      stag.from(t).select('id', { count: 'exact', head: true }),
    ]);
    if (p.error) throw new Error(`oficial ${t}: ${p.error.message}`);
    if (s.error) throw new Error(`teste ${t}: ${s.error.message}`);
    out.push({ table: t, prod: p.count ?? 0, staging: s.count ?? 0 });
  }
  return out;
}

async function insertRows(client: SupabaseClient, table: string, rows: any[], upsert = false) {
  if (rows.length === 0) return;
  // skill_nodes tem auto-referência: insere sem o pré-requisito e ajusta depois.
  let fixups: { id: string; requires_node_id: string }[] = [];
  let payload = rows;
  if (table === 'skill_nodes') {
    fixups = rows.filter((n) => n.requires_node_id).map((n) => ({ id: n.id, requires_node_id: n.requires_node_id }));
    payload = rows.map((n) => ({ ...n, requires_node_id: null }));
  }
  const query = upsert
    ? client.from(table).upsert(payload, { onConflict: 'id' })
    : client.from(table).insert(payload);
  const { error } = await query;
  if (error) throw new Error(`gravação ${table}: ${error.message}`);
  for (const f of fixups) {
    const { error: uErr } = await client.from(table).update({ requires_node_id: f.requires_node_id }).eq('id', f.id);
    if (uErr) throw new Error(`ajuste ${table}: ${uErr.message}`);
  }
}
