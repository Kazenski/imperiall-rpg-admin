'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const PATH = '/personagens'

export async function listCharacters() {
  const { data, error } = await supabase.from('characters').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function createCharacter(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('characters').insert({
    slug: data.slug, name: data.name, description: data.description || null,
    portrait_url: data.portrait_url || null,
    sprite_idle_url: data.sprite_idle_url || null,
    sprite_attack_url: data.sprite_attack_url || null,
    hp: Number(data.hp) || 100, atk: Number(data.atk) || 10,
    def: Number(data.def) || 5, speed: Number(data.speed) || 100,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function updateCharacter(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('characters').update({
    slug: data.slug, name: data.name, description: data.description || null,
    portrait_url: data.portrait_url || null,
    sprite_idle_url: data.sprite_idle_url || null,
    sprite_attack_url: data.sprite_attack_url || null,
    hp: Number(data.hp) || 100, atk: Number(data.atk) || 10,
    def: Number(data.def) || 5, speed: Number(data.speed) || 100,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  }).eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteCharacter(id: string) {
  const { error } = await supabase.from('characters').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function listCharacterSkills(characterId: string) {
  const { data, error } = await supabase.from('character_skills').select('*, skills(name)').eq('character_id', characterId)
  if (error) throw error
  return data
}

export async function addCharacterSkill(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('character_skills').insert({
    character_id: data.character_id, skill_id: data.skill_id,
    unlock_level: Number(data.unlock_level) || 1,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteCharacterSkill(id: string) {
  const { error } = await supabase.from('character_skills').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function listCharacterTraits(characterId: string) {
  const { data, error } = await supabase.from('character_traits').select('*, effects(name)').eq('character_id', characterId)
  if (error) throw error
  return data
}

export async function addCharacterTrait(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('character_traits').insert({
    character_id: data.character_id, effect_id: data.effect_id,
    value: Number(data.value) || 0, environment: data.environment || null,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteCharacterTrait(id: string) {
  const { error } = await supabase.from('character_traits').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}
