'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { slugExists } from '@/lib/utils/slug'
import { formStrings } from '@/lib/utils/form'

export async function listLootTables() {
  const { data, error } = await supabase.from('loot_tables').select('*, mobs(name), stages(name)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listLootEntries(tableId: string) {
  const { data, error } = await supabase.from('loot_table_entries').select('*, items(name)').eq('loot_table_id', tableId).order('sort_order')
  if (error) throw error
  return data
}

export async function createLootTable(formData: FormData) {
  const data = formStrings(formData)
  const payload = {
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    mob_id: data.mob_id || null,
    stage_id: data.stage_id || null,
    is_active: data.is_active === 'on',
  }
  if (await slugExists('loot_tables', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('loot_tables').insert(payload)
  if (error) throw error
  revalidatePath('/loot-tables')
}

export async function updateLootTable(id: string, formData: FormData) {
  const data = formStrings(formData)
  const payload = {
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    mob_id: data.mob_id || null,
    stage_id: data.stage_id || null,
    is_active: data.is_active === 'on',
  }
  if (await slugExists('loot_tables', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('loot_tables').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/loot-tables')
}

export async function deleteLootTable(id: string) {
  const { error } = await supabase.from('loot_tables').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/loot-tables')
}

export async function addLootEntry(formData: FormData) {
  const data = formStrings(formData)
  const payload = {
    loot_table_id: data.loot_table_id,
    item_id: data.item_id,
    quantity_min: Number(data.quantity_min) || 1,
    quantity_max: Number(data.quantity_max) || 1,
    weight: Number(data.weight) || 100,
    drop_chance_percent: data.drop_chance_percent ? Number(data.drop_chance_percent) : null,
    guaranteed: data.guaranteed === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('loot_table_entries').insert(payload)
  if (error) throw error
  revalidatePath('/loot-tables')
}

export async function deleteLootEntry(id: string) {
  const { error } = await supabase.from('loot_table_entries').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/loot-tables')
}

