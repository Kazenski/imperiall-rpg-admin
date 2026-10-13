'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const TREE_PATH = '/arvore'
const CRAFT_PATH = '/receitas'

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
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('skill_nodes').insert({
    character_id: data.character_id, skill_id: data.skill_id,
    position_x: Number(data.position_x) || 0, position_y: Number(data.position_y) || 0,
    cost_points: Number(data.cost_points) || 0, cost_gold: Number(data.cost_gold) || 0,
    required_level: Number(data.required_level) || 1,
    requires_node_id: data.requires_node_id || null,
    description: data.description || null,
  })
  if (error) throw error
  revalidatePath(TREE_PATH)
}

export async function updateSkillNode(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('skill_nodes').update({
    position_x: Number(data.position_x) || 0, position_y: Number(data.position_y) || 0,
    cost_points: Number(data.cost_points) || 0, cost_gold: Number(data.cost_gold) || 0,
    required_level: Number(data.required_level) || 1,
    requires_node_id: data.requires_node_id || null,
    description: data.description || null,
  }).eq('id', id)
  if (error) throw error
  revalidatePath(TREE_PATH)
}

export async function deleteSkillNode(id: string) {
  const { error } = await supabase.from('skill_nodes').delete().eq('id', id)
  if (error) throw error
  revalidatePath(TREE_PATH)
}

export async function listRecipes() {
  const { data, error } = await supabase.from('recipes').select('*, items!recipes_output_item_id_fkey(name), professions(name)').order('sort_order')
  if (error) throw error
  return data
}

export async function createRecipe(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('recipes').insert({
    slug: data.slug, name: data.name, output_item_id: data.output_item_id,
    output_qty: Number(data.output_qty) || 1,
    profession_id: data.profession_id || null,
    required_prof_level: Number(data.required_prof_level) || 1,
    cost_gold: Number(data.cost_gold) || 0,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function updateRecipe(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('recipes').update({
    slug: data.slug, name: data.name, output_item_id: data.output_item_id,
    output_qty: Number(data.output_qty) || 1,
    profession_id: data.profession_id || null,
    required_prof_level: Number(data.required_prof_level) || 1,
    cost_gold: Number(data.cost_gold) || 0,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  }).eq('id', id)
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function deleteRecipe(id: string) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function listRecipeMaterials(recipeId: string) {
  const { data, error } = await supabase.from('recipe_materials').select('*, items(name)').eq('recipe_id', recipeId)
  if (error) throw error
  return data
}

export async function addRecipeMaterial(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('recipe_materials').insert({
    recipe_id: data.recipe_id, item_id: data.item_id, qty: Number(data.qty) || 1,
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
  const { data, error } = await supabase.from('item_upgrade_levels').select('*').eq('item_id', itemId).order('level')
  if (error) throw error
  return data
}

export async function addUpgradeLevel(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('item_upgrade_levels').insert({
    item_id: data.item_id, level: Number(data.level) || 1,
    stat_mult: Number(data.stat_mult) || 1, cost_gold: Number(data.cost_gold) || 0,
  })
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function deleteUpgradeLevel(id: string) {
  const { error } = await supabase.from('item_upgrade_levels').delete().eq('id', id)
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function listUpgradeMaterials(upgradeId: string) {
  const { data, error } = await supabase.from('item_upgrade_materials').select('*, items(name)').eq('upgrade_id', upgradeId)
  if (error) throw error
  return data
}

export async function addUpgradeMaterial(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('item_upgrade_materials').insert({
    upgrade_id: data.upgrade_id, item_id: data.item_id, qty: Number(data.qty) || 1,
  })
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}

export async function deleteUpgradeMaterial(id: string) {
  const { error } = await supabase.from('item_upgrade_materials').delete().eq('id', id)
  if (error) throw error
  revalidatePath(CRAFT_PATH)
}
