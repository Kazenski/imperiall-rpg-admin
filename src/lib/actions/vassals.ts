'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { formStrings } from '@/lib/utils/form'
import { slugExists } from '@/lib/utils/slug'

const VASSALS = '/vassals'
const ACTIONS = '/acoes-manuais'

function ok(path: string) {
  revalidatePath(path)
}

export async function listVassals() {
  const { data, error } = await supabase.from('vassals').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function listVassalsWithAffinities() {
  const { data, error } = await supabase.from('vassals').select('*, vassal_affinities(*, manual_actions(*))').order('sort_order')
  if (error) throw error
  return data
}

function vassalPayload(data: Record<string, string>) {
  return {
    slug: data.slug, name: data.name, class_name: data.class_name || null,
    description: data.description || null, image_url: data.image_url || null,
    image_attack_url: data.image_attack_url || null, rarity: data.rarity || 'common',
    price_real: Number(data.price_real) || 0, price_gold: Number(data.price_gold) || 0,
    is_for_sale: data.is_for_sale === 'on', base_energy: Number(data.base_energy) || 100,
    base_speed: Number(data.base_speed) || 100, is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
}

export async function createVassal(formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('vassals', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('vassals').insert(vassalPayload(data))
  if (error) throw error
  ok(VASSALS)
}

export async function updateVassal(id: string, formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('vassals', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('vassals').update(vassalPayload(data)).eq('id', id)
  if (error) throw error
  ok(VASSALS)
}

export async function deleteVassal(id: string) {
  const { error } = await supabase.from('vassals').delete().eq('id', id)
  if (error) throw error
  ok(VASSALS)
}

export async function addVassalAffinity(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('vassal_affinities').insert({
    vassal_id: data.vassal_id, action_id: data.action_id, affinity_type: data.affinity_type || 'ok',
  })
  if (error) throw error
  ok(VASSALS)
}

export async function updateVassalAffinity(id: string, formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('vassal_affinities').update({
    action_id: data.action_id, affinity_type: data.affinity_type || 'ok',
  }).eq('id', id)
  if (error) throw error
  ok(VASSALS)
}

export async function deleteVassalAffinity(id: string) {
  const { error } = await supabase.from('vassal_affinities').delete().eq('id', id)
  if (error) throw error
  ok(VASSALS)
}

export async function listManualActions() {
  const { data, error } = await supabase.from('manual_actions').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function listManualActionsWithInteractions() {
  const { data, error } = await supabase.from('manual_actions').select('*, action_vassal_interactions(*, vassals(*))').order('sort_order')
  if (error) throw error
  return data
}

function actionPayload(data: Record<string, string>) {
  return {
    slug: data.slug, name: data.name, description: data.description || null,
    icon_url: data.icon_url || null, cooldown_seconds: Number(data.cooldown_seconds) || 3600,
    energy_cost: Number(data.energy_cost) || 10, base_result_qty: Number(data.base_result_qty) || 1,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  }
}

export async function createManualAction(formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('manual_actions', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('manual_actions').insert(actionPayload(data))
  if (error) throw error
  ok(ACTIONS)
}

export async function updateManualAction(id: string, formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('manual_actions', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('manual_actions').update(actionPayload(data)).eq('id', id)
  if (error) throw error
  ok(ACTIONS)
}

export async function deleteManualAction(id: string) {
  const { error } = await supabase.from('manual_actions').delete().eq('id', id)
  if (error) throw error
  ok(ACTIONS)
}

export async function addActionInteraction(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('action_vassal_interactions').insert({
    action_id: data.action_id, vassal_id: data.vassal_id,
    completion_seconds: Number(data.completion_seconds) || 300,
    energy_cost: Number(data.energy_cost) || 10,
    result_multiplier: Number(data.result_multiplier) || 1.0,
    result_qty: Number(data.result_qty) || 1,
  })
  if (error) throw error
  ok(ACTIONS)
}

export async function updateActionInteraction(id: string, formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('action_vassal_interactions').update({
    completion_seconds: Number(data.completion_seconds) || 300,
    energy_cost: Number(data.energy_cost) || 10,
    result_multiplier: Number(data.result_multiplier) || 1.0,
    result_qty: Number(data.result_qty) || 1,
  }).eq('id', id)
  if (error) throw error
  ok(ACTIONS)
}

export async function deleteActionInteraction(id: string) {
  const { error } = await supabase.from('action_vassal_interactions').delete().eq('id', id)
  if (error) throw error
  ok(ACTIONS)
}

export async function listVassalLevelRules() {
  const { data, error } = await supabase.from('vassal_level_rules').select('*').order('level')
  if (error) throw error
  return data
}

export async function upsertVassalLevelRule(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('vassal_level_rules').upsert({
    level: Number(data.level) || 1, xp_required: Number(data.xp_required) || 0,
    xp_per_action: Number(data.xp_per_action) || 10,
  }, { onConflict: 'level' })
  if (error) throw error
  ok(VASSALS)
}

export async function deleteVassalLevelRule(level: number) {
  const { error } = await supabase.from('vassal_level_rules').delete().eq('level', level)
  if (error) throw error
  ok(VASSALS)
}

export async function listNaturalResources() {
  const { data, error } = await supabase.from('natural_resources').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function createNaturalResource(formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('natural_resources', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('natural_resources').insert({
    slug: data.slug, name: data.name, description: data.description || null,
    icon_url: data.icon_url || null, rarity: data.rarity || 'common',
    base_qty: Number(data.base_qty) || 1, is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  ok(VASSALS)
}

export async function updateNaturalResource(id: string, formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('natural_resources', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('natural_resources').update({
    slug: data.slug, name: data.name, description: data.description || null,
    icon_url: data.icon_url || null, rarity: data.rarity || 'common',
    base_qty: Number(data.base_qty) || 1, is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }).eq('id', id)
  if (error) throw error
  ok(VASSALS)
}

export async function deleteNaturalResource(id: string) {
  const { error } = await supabase.from('natural_resources').delete().eq('id', id)
  if (error) throw error
  ok(VASSALS)
}
