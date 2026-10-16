'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { slugExists } from '@/lib/utils/slug'
import { formStrings } from '@/lib/utils/form'

const TREE_PATH = '/arvore'
const CRAFT_PATH = '/receitas'

function isMissingColumn(error: { message?: string; code?: string }) {
  const code = error?.code || ''
  const msg = (error?.message || '').toLowerCase()
  return code === '42703' || code === 'PGRST204' || msg.includes('column')
}

export async function listSkillNodes(characterId: string) {
  const { data, error } = await supabase
    .from('skill_nodes')
    .select('*, skills(name)')
    .eq('character_id', characterId)
    .order('position_y')
    .order('position_x')
  if (error) throw error
  return data
}

export async function createSkillNode(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('skill_nodes').insert({
    character_id: data.character_id,
    skill_id: data.skill_id,
    position_x: Number(data.position_x) || 0,
    position_y: Number(data.position_y) || 0,
    cost_points: Number(data.cost_points) || 0,
    cost_gold: Number(data.cost_gold) || 0,
    required_level: Number(data.required_level) || 1,
    requires_node_id: data.requires_node_id || null,
    description: data.description || null,
  })
  if (error) throw error
  revalidatePath(TREE_PATH)
}

export async function updateSkillNode(id: string, formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase
    .from('skill_nodes')
    .update({
      position_x: Number(data.position_x) || 0,
      position_y: Number(data.position_y) || 0,
      cost_points: Number(data.cost_points) || 0,
      cost_gold: Number(data.cost_gold) || 0,
      required_level: Number(data.required_level) || 1,
      requires_node_id: data.requires_node_id || null,
      description: data.description || null,
    })
    .eq('id', id)
  if (error) throw error
  revalidatePath(TREE_PATH)
}

export async function deleteSkillNode(id: string) {
  const { error } = await supabase.from('skill_nodes').delete().eq('id', id)
  if (error) throw error
  revalidatePath(TREE_PATH)
}

export async function listRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, items!recipes_output_item_id_fkey(name, icon_url, rarity), professions(name, icon_url)')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createRecipe(formData: FormData) {
  const data = formStrings(formData)
  const baseChance = Math.min(100, Math.max(1, Number(data.base_chance ?? 70) || 70))
  const payload: Record<string, unknown> = {
    slug: data.slug,
    name: data.name,
    output_item_id: data.output_item_id,
    output_qty: Number(data.output_qty) || 1,
    profession_id: data.profession_id || null,
    required_prof_level: Number(data.required_prof_level) || 1,
    base_chance: baseChance,
    cost_gold: Number(data.cost_gold) || 0,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
  if (await slugExists('recipes', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('recipes').insert(payload)
  if (error) {
    if (isMissingColumn(error)) {
      delete payload.base_chance
      const { error: retryError } = await supabase.from('recipes').insert(payload)
      if (retryError) throw retryError
      revalidatePath(CRAFT_PATH)
      return
    }
    throw error
  }
  revalidatePath(CRAFT_PATH)
}

export async function updateRecipe(id: string, formData: FormData) {
  const data = formStrings(formData)
  const baseChance = Math.min(100, Math.max(1, Number(data.base_chance ?? 70) || 70))
  const payload: Record<string, unknown> = {
    slug: data.slug,
    name: data.name,
    output_item_id: data.output_item_id,
    output_qty: Number(data.output_qty) || 1,
    profession_id: data.profession_id || null,
    required_prof_level: Number(data.required_prof_level) || 1,
    base_chance: baseChance,
    cost_gold: Number(data.cost_gold) || 0,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
  if (await slugExists('recipes', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('recipes').update(payload).eq('id', id)
  if (error) {
    if (isMissingColumn(error)) {
      delete payload.base_chance
      const { error: retryError } = await supabase.from('recipes').update(payload).eq('id', id)
      if (retryError) throw retryError
      revalidatePath(CRAFT_PATH)
      return
    }
    throw error
  }
  revalidatePath(CRAFT_PATH)
}

export async function deleteRecipe(id: string) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function listRecipeMaterials(recipeId: string) {
  const { data, error } = await supabase
    .from('recipe_materials')
    .select('*, items(name, icon_url, rarity)')
    .eq('recipe_id', recipeId)
  if (error) throw error
  return data
}

export async function addRecipeMaterial(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('recipe_materials').insert({
    recipe_id: data.recipe_id,
    item_id: data.item_id,
    qty: Number(data.qty) || 1,
  })
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function deleteRecipeMaterial(id: string) {
  const { error } = await supabase.from('recipe_materials').delete().eq('id', id)
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function listUpgradeLevels(itemId: string) {
  const { data, error } = await supabase
    .from('item_upgrade_levels')
    .select('*')
    .eq('item_id', itemId)
    .order('level')
  if (error) throw error
  return data
}

export async function addUpgradeLevel(formData: FormData) {
  const data = formStrings(formData)
  const baseChance = Math.min(100, Math.max(1, Number(data.base_chance ?? 80) || 80))
  const payload: Record<string, unknown> = {
    item_id: data.item_id,
    level: Number(data.level) || 1,
    stat_mult: Number(data.stat_mult) || 1,
    base_chance: baseChance,
    cost_gold: Number(data.cost_gold) || 0,
  }
  const { error } = await supabase.from('item_upgrade_levels').insert(payload)
  if (error) {
    if (isMissingColumn(error)) {
      delete payload.base_chance
      const { error: retryError } = await supabase.from('item_upgrade_levels').insert(payload)
      if (retryError) throw retryError
      revalidatePath(CRAFT_PATH)
      return
    }
    throw error
  }
  revalidatePath(CRAFT_PATH)
}

export async function deleteUpgradeLevel(id: string) {
  const { error } = await supabase.from('item_upgrade_levels').delete().eq('id', id)
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function listUpgradeMaterials(upgradeId: string) {
  const { data, error } = await supabase
    .from('item_upgrade_materials')
    .select('*, items(name, icon_url, rarity)')
    .eq('upgrade_id', upgradeId)
  if (error) throw error
  return data
}

export async function addUpgradeMaterial(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('item_upgrade_materials').insert({
    upgrade_id: data.upgrade_id,
    item_id: data.item_id,
    qty: Number(data.qty) || 1,
  })
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function deleteUpgradeMaterial(id: string) {
  const { error } = await supabase.from('item_upgrade_materials').delete().eq('id', id)
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}
