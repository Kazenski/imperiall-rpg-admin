'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { formStrings } from '@/lib/utils/form'
import { slugExists } from '@/lib/utils/slug'

const PETS = '/pets'

function ok(path: string) {
  revalidatePath(path)
}

// ─────────────────────────────────────────────────── TEMPLATES

export async function listPetTemplates() {
  const { data, error } = await supabase
    .from('pet_templates')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function listPetTemplatesWithSkills() {
  const { data, error } = await supabase
    .from('pet_templates')
    .select('*, pet_template_skills(*, skills(*)), pet_template_diet(*, items(*))')
    .order('sort_order')
  if (error) throw error
  return data
}

function petPayload(data: Record<string, string>) {
  return {
    slug: data.slug,
    name: data.name,
    class_name: data.class_name || null,
    description: data.description || null,
    image_url: data.image_url || null,
    image_attack_url: data.image_attack_url || null,
    rarity: data.rarity || 'common',
    base_hp: Number(data.base_hp) || 50,
    base_mp: Number(data.base_mp) || 20,
    base_atk: Number(data.base_atk) || 5,
    base_def: Number(data.base_def) || 3,
    base_speed: Number(data.base_speed) || 100,
    companion_atk_bonus: Number(data.companion_atk_bonus) || 0,
    companion_def_bonus: Number(data.companion_def_bonus) || 0,
    companion_hp_bonus: Number(data.companion_hp_bonus) || 0,
    companion_mp_bonus: Number(data.companion_mp_bonus) || 0,
    companion_speed_bonus: Number(data.companion_speed_bonus) || 0,
    xp_share_percent: Number(data.xp_share_percent) || 10,
    special_effect: data.special_effect || null,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
}

export async function createPetTemplate(formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('pet_templates', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('pet_templates').insert(petPayload(data))
  if (error) throw error
  ok(PETS)
}

export async function updatePetTemplate(id: string, formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('pet_templates', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('pet_templates').update(petPayload(data)).eq('id', id)
  if (error) throw error
  ok(PETS)
}

export async function deletePetTemplate(id: string) {
  const { error } = await supabase.from('pet_templates').delete().eq('id', id)
  if (error) throw error
  ok(PETS)
}

// ─────────────────────────────────────────────────── HABILIDADES DO PET

export async function addPetSkill(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('pet_template_skills').insert({
    pet_template_id: data.pet_template_id,
    skill_id: data.skill_id,
    unlock_level: Number(data.unlock_level) || 1,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  ok(PETS)
}

export async function updatePetSkill(id: string, formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('pet_template_skills').update({
    skill_id: data.skill_id,
    unlock_level: Number(data.unlock_level) || 1,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }).eq('id', id)
  if (error) throw error
  ok(PETS)
}

export async function deletePetSkill(id: string) {
  const { error } = await supabase.from('pet_template_skills').delete().eq('id', id)
  if (error) throw error
  ok(PETS)
}

// ─────────────────────────────────────────────────── DIETA

export async function addPetDietItem(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('pet_template_diet').insert({
    pet_template_id: data.pet_template_id,
    item_id: data.item_id,
    xp_per_unit: Number(data.xp_per_unit) || 10,
  })
  if (error) throw error
  ok(PETS)
}

export async function deletePetDietItem(id: string) {
  const { error } = await supabase.from('pet_template_diet').delete().eq('id', id)
  if (error) throw error
  ok(PETS)
}

// ─────────────────────────────────────────────────── INCUBAÇÃO

export async function upsertIncubationConfig(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase
    .from('pet_incubation_config')
    .upsert({
      pet_template_id: data.pet_template_id,
      incubation_hours: Number(data.incubation_hours) || 24,
      cooldown_hours: Number(data.cooldown_hours) || 48,
      required_item_id: data.required_item_id || null,
      required_item_qty: Number(data.required_item_qty) || 1,
      success_rate_percent: Number(data.success_rate_percent) || 80,
    }, { onConflict: 'pet_template_id' })
  if (error) throw error
  ok(PETS)
}

export async function getIncubationConfig(petTemplateId: string) {
  const { data, error } = await supabase
    .from('pet_incubation_config')
    .select('*')
    .eq('pet_template_id', petTemplateId)
    .maybeSingle()
  if (error) throw error
  return data
}
