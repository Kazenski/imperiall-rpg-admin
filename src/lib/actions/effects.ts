'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const PATH = '/efeitos'

export async function listEffects() {
  const { data, error } = await supabase.from('effects').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function createEffect(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('effects').insert({
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    category: data.category,
    target: data.target,
    value_kind: data.value_kind,
    default_value: Number(data.default_value) || 0,
    icon_url: data.icon_url || null,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function updateEffect(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('effects').update({
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    category: data.category,
    target: data.target,
    value_kind: data.value_kind,
    default_value: Number(data.default_value) || 0,
    icon_url: data.icon_url || null,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }).eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteEffect(id: string) {
  const { error } = await supabase.from('effects').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

// Vínculos efeito <-> skill/item (valor personalizado por uso)
export async function listSkillEffects(skillId: string) {
  const { data, error } = await supabase.from('skill_effects').select('*, effects(name)').eq('skill_id', skillId).order('sort_order')
  if (error) throw error
  return data
}

export async function addSkillEffect(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('skill_effects').insert({
    skill_id: data.skill_id,
    effect_id: data.effect_id,
    value: Number(data.value) || 0,
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteSkillEffect(id: string) {
  const { error } = await supabase.from('skill_effects').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function listItemEffects(itemId: string) {
  const { data, error } = await supabase.from('item_effects').select('*, effects(name)').eq('item_id', itemId).order('sort_order')
  if (error) throw error
  return data
}

export async function addItemEffect(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('item_effects').insert({
    item_id: data.item_id,
    effect_id: data.effect_id,
    value: Number(data.value) || 0,
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteItemEffect(id: string) {
  const { error } = await supabase.from('item_effects').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}
